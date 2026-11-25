from pathlib import Path
import sys
from PIL import Image,ImageDraw
import cv2 as cv

root=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(root/'source'))
from paint import Canvas
import classroom
out=Path(__file__).parent
cv.setNumThreads(2)
c=Canvas(1280)
times=[61.9,67.4,72.1,74.1,75.4,79.2,81.35,86.39,89.1,94.35,97.23,99.55,105.3,109.85,110.7,117.3]
sheet=Image.new('RGB',(448*4,274*4),(28,30,43))
d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    classroom.frame(c,t)
    im=Image.fromarray(c.rgb)
    im.save(out/f'film-{t:.2f}.jpg',quality=94)
    x,y=(i%4)*448,(i//4)*274
    sheet.paste(im.resize((448,252),Image.Resampling.LANCZOS),(x,y))
    d.text((x+8,y+254),str(t),fill='white')
sheet.save(out/'review.jpg',quality=92)
