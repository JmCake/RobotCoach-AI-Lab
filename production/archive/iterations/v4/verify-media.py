from pathlib import Path
import hashlib
import json
import subprocess
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(root/'source'))
from classroom import TAKES, CLIPS, LENGTH, physical_tick, EARLY, FORWARD, EXPLORE, BEAM_HIT, BEAM_PASS, TEST
from export import encoder

def open_cut(path,dimensions,rate,count):
    cap=cv2.VideoCapture(str(path),cv2.CAP_FFMPEG,[cv2.CAP_PROP_N_THREADS,2])
    assert cap.isOpened()
    assert (int(cap.get(3)),int(cap.get(4)))==dimensions
    assert int(cap.get(cv2.CAP_PROP_FRAME_COUNT))==count
    assert abs(cap.get(cv2.CAP_PROP_FPS)-rate)<.0001
    return cap

def get(cap,n):
    cap.set(cv2.CAP_PROP_POS_FRAMES,n)
    ok,bgr=cap.read()
    assert ok,n
    return bgr

def distance(a,b):
    return round(float(np.abs(a.astype(np.int16)-b.astype(np.int16)).mean()),2)

def decoded709(path,n):
    # Match the master's declared Rec.709 YUV matrix when comparing its encoded
    # picture against the exact RGB buffer used by the movie compositor.
    raw=subprocess.check_output([encoder(),'-nostdin','-loglevel','error','-ss',f'{n/30:.7f}',
        '-i',str(path),'-frames:v','1','-vf','scale=in_color_matrix=bt709','-pix_fmt','bgr24','-f','rawvideo','-'])
    return np.frombuffer(raw,np.uint8).reshape(1080,1920,3)

film=root/'robot-evolution-v4.mp4'
small=root/'study/试错训练回放.mp4'
master=open_cut(film,(1920,1080),30,3966)
excerpt=open_cut(small,(1280,720),30,1110)
native=open_cut(root/'source/art/training-replays.mp4',(1536,864),120,1850)
errors=[]
sheet=Image.new('RGB',(450*3,((12+2)//3)*271),(15,25,41))
draw=ImageDraw.Draw(sheet)
marks=[(3.4,'camera'),(67.4,'handover'),(73.2,'early jump'),(75.4,'early collision'),
       (81.35,'negative reward'),(83.22,'restart'),(89.15,'first hurdle passed'),(94.25,'real score updates'),
       (100.35,'same-state split'),(105.2,'beam collision'),(110.6,'beam passed'),(120.2,'controls')]
for i,(t,word) in enumerate(marks):
    im=Image.fromarray(cv2.cvtColor(get(master,round(t*30)),cv2.COLOR_BGR2RGB))
    x=i%3*450;y=i//3*271
    sheet.paste(im.resize((450,253),Image.Resampling.LANCZOS),(x,y))
    draw.text((x+5,y+253),f'{t:.2f}  {word}',fill='white')
sheet.save(Path(__file__).with_name('final-frames.jpg'),quality=94)
for start,local in [(EARLY,1.86),(EARLY,3.51),(FORWARD,4.82),(EXPLORE,4.34),(EXPLORE,5.92),
                    (BEAM_HIT,3.1),(BEAM_PASS,2.95),(TEST,5.9)]:
    n=round((start+local)*30)
    sample=decoded709(film,n)
    id,points=TAKES[start]
    k=physical_tick(points,n/30-start)
    f=CLIPS[id]['film']
    base=cv2.resize(get(native,f['offset']+k-f['from']),(1920,1080))
    roi=(slice(320,895),slice(330,1300))
    errors.append(distance(sample[roi],base[roi]))
assert max(errors)<5.0,errors
excerpt_errors=[]
for sec in (.2,6.9,14.85,19.35,24.24,31.22,36.5):
    n=round(sec*30)
    a=get(excerpt,n)
    b=cv2.resize(get(master,1947+n),(1280,720),interpolation=cv2.INTER_AREA)
    excerpt_errors.append(distance(a,b))
assert max(excerpt_errors)<5,excerpt_errors
assert get(master,3965).mean()<18
with film.open('rb') as fp:
    digest=hashlib.file_digest(fp,'sha256').hexdigest()
print(json.dumps({'fullFrames':3966,'excerptFrames':1110,'nativeFrames':1850,
    'eightMatchedReplayFrames':errors,'excerptMatches':excerpt_errors,'seconds':LENGTH,
    'fullBytes':film.stat().st_size,'excerptBytes':small.stat().st_size,'sha256':digest}))
