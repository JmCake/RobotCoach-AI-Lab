from pathlib import Path
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw
import cv2
import numpy as np

work=Path(__file__).resolve().parent
root=work.parents[1]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(root/'source'))
from paint import Canvas
from classroom import frame, CLIPS, LOG, TAKES, MATCH, physical_tick
from comic_training import MOTION
from export import encoder
from concurrent.futures import ThreadPoolExecutor

old=root/'robot-evolution-v4.mp4'
new=root/'robot-evolution-v5.mp4'
short=root/'study/试错训练回放.mp4'
long=root/'study/漫画训练全段.mp4'
codec=encoder()
cv2.setNumThreads(2)

def ff(*args):
    return subprocess.check_output([codec,'-nostdin','-v','error','-xerror',*map(str,args)])

def frames(path, select=None):
    args=('-vf',select) if select else ()
    raw=ff('-i',path,'-map','0:v:0',*args,'-fps_mode','passthrough','-f','framemd5','-')
    return [line.split(',')[-1].strip() for line in raw.decode().splitlines() if not line.startswith('#')]

def info(path, size, expected):
    cap=cv2.VideoCapture(str(path))
    assert cap.isOpened()
    assert (int(cap.get(3)),int(cap.get(4)))==size
    assert round(cap.get(5),5)==30 and int(cap.get(7))==expected
    cap.release()
    return expected

def decode_frame(path,n,w,h):
    rgb=ff('-ss',f'{n/30:.8f}','-i',path,'-map','0:v:0','-frames:v','1',
           '-vf','scale=in_color_matrix=bt709','-pix_fmt','rgb24','-f','rawvideo','-')
    return np.frombuffer(rgb,np.uint8).reshape(h,w,3)

def err(a,b):
    return round(float(np.abs(a.astype(np.int16)-b.astype(np.int16)).mean()),3)

expected={new.name:info(new,(1920,1080),3966),short.name:info(short,(1280,720),1110),
          long.name:info(long,(1920,1080),1881)}
with ThreadPoolExecutor(max_workers=3) as pool:
    checks={p:pool.submit(frames,p) for p in (old,new,long)}
    decoded={p:job.result() for p,job in checks.items()}
assert len(decoded[old])==len(decoded[new])==3966
assert decoded[old][:1797]==decoded[new][:1797], 'Opening picture changed'
assert decoded[old][3678:]==decoded[new][3678:], 'Closing picture changed'
assert decoded[new][1797:3678]==decoded[long], 'Training preview has different frames'

def audio(path,coded):
    args=('-c:a','copy') if coded else ('-c:a','pcm_s16le')
    return ff('-i',path,'-map','0:a:0',*args,'-f','md5','-').decode().strip()

assert audio(old,True)==audio(new,True)
assert audio(old,False)==audio(new,False)
for p in (short,long):
    ff('-i',p,'-map','0:v:0','-map','0:a:0','-f','null','-')

seconds=[59.9,61.9,64.9,70.0,73.33,75.43,79.02,81.35,86.39,89.1,94.30,
         97.2,99.55,101.2,105.25,109.85,110.7,117.3,121.65,122.6]
c=Canvas(1920)
check={}
for t in seconds:
    n=round(t*30)
    sample=decode_frame(new,n,1920,1080)
    frame(c,n/30)
    check[t]=err(sample,c.rgb)
    assert check[t]<5.5, (t,check[t])

short_errors=[]
for t in (.1,6.4,10.3,16.4,24.7,31.7,36.4):
    n=round(t*30)
    compact=decode_frame(short,n,1280,720)
    master=decode_frame(new,1947+n,1920,1080)
    small=cv2.resize(master,(1280,720),interpolation=cv2.INTER_AREA)
    short_errors.append(err(compact,small))
assert max(short_errors)<5,short_errors
assert sum(map(len,MOTION.values()))==LOG['frames']==1850
assert CLIPS['r6']['steps'][29]['t']==CLIPS['r36']['steps'][29]['t']==348
assert CLIPS['r6']['steps'][29]['action']==0 and CLIPS['r36']['steps'][29]['action']==1
print(json.dumps({'frames':expected,'unchangedOpeningAndClosing':2085,'unchangedAudio':True,
    'fullTrainingFramesMatch':1881,'sourceToMasterMeanErrors':check,'shortExcerptMeanErrors':short_errors,
    'registeredPhysicsTicks':1850},ensure_ascii=False))
