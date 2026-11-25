from pathlib import Path
from PIL import Image,ImageDraw
import cv2
root=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution'
p=root/'study/漫画训练全段.mp4'
cap=cv2.VideoCapture(str(p))
intervals=[(24.7,6.0),(10.4,4.4),(46.5,4.0)]
sheet=Image.new('RGB',(252*7,265*3),(20,29,42));d=ImageDraw.Draw(sheet)
for row,(start,delta) in enumerate(intervals):
    for col in range(7):
        t=start+col*delta/6
        cap.set(cv2.CAP_PROP_POS_FRAMES,round(t*30))
        ok,bgr=cap.read();assert ok
        im=Image.fromarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB)).resize((1280,720))
        im=im.crop((272,83,822,607)).resize((252,240),Image.Resampling.LANCZOS)
        x,y=col*252,row*265;sheet.paste(im,(x,y));d.text((x+5,y+242),f'{t:.2f}s',fill='white')
sheet.save(Path(__file__).with_name('previous-motion.jpg'),quality=91)
