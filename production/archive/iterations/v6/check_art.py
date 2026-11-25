from pathlib import Path
from PIL import Image,ImageDraw
import cv2 as cv
import numpy as np
import sys,time
out=Path(__file__).resolve().parent
source=out.parents[1]/'final-race-video/films/robot-evolution/source'
sys.path.insert(0,str(source))
from classroom import CLIPS
from comic_training import draw
from paint import Canvas
cv.setNumThreads(2)
c=Canvas(1280)
rows=[('r7',[287,295,303,314,323,337,348]),('r7',[349,362,376,393,410,426,444]),
      ('r7',[436,444,448,454,459,464,469]),('r3',[288,302,323,340,355,366,373]),
      ('r246',[490,500,513,524,532,540,549])]
sheet=Image.new('RGB',(7*231,len(rows)*238),(22,29,43));d=ImageDraw.Draw(sheet)
start=time.monotonic()
for row,(name,indices) in enumerate(rows):
    for col,k in enumerate(indices):
        draw(c,CLIPS[name],k)
        im=Image.fromarray(c.rgb)
        if k in (323,349,376,393,426,444,448,532,540,373):
            im.save(out/f'{name}-{k}.jpg',quality=93)
        im=im.crop((255,92,792,600)).resize((231,218),Image.Resampling.LANCZOS)
        x,y=231*col,238*row;sheet.paste(im,(x,y));d.text((x+4,y+218),f'{name} / {k}',fill='white')
sheet.save(out/'new-motion.jpg',quality=94)
print('Draws',time.monotonic()-start)
