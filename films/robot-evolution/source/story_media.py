"""Prepare the first story lesson from existing V6 footage, cels and mounts."""
import json
from pathlib import Path
import subprocess

import cv2 as cv
import numpy as np
from PIL import Image

from export import encoder
from hardware import Rig, component
from paint import ART, Canvas
from pilot import ATHLETE
from side_runner import Profile

film=Path(__file__).resolve().parents[1]
media=film.parents[1]/'assets/story/media'
master=film/'robot-evolution-v6.mp4'


def rgba(data):
    out=data.copy()
    alpha=out[:,:,3:4].astype(float)
    out[:,:,:3]=np.clip(np.round(out[:,:,:3]*255./np.maximum(1.,alpha)),0,255).astype('uint8')
    return Image.fromarray(out)


def prepare():
    media.mkdir(parents=True,exist_ok=True)
    for name,start,end in [('bend',8.6,18.1),('through',26.0,31.3)]:
        subprocess.run([encoder(),'-nostdin','-loglevel','error','-y','-ss',str(start),'-i',str(master),
                        '-t',f'{end-start:.3f}','-vf','scale=1280:720','-c:v','libx264','-crf','21',
                        '-pix_fmt','yuv420p','-c:a','aac','-b:a','112k','-movflags','+faststart',
                        str(media/(name+'.mp4'))],check=True)
    cap=cv.VideoCapture(str(master))
    for name,t in [('grid',8.6),('catch',18.0),('hurdle',31.3)]:
        cap.set(cv.CAP_PROP_POS_FRAMES,round(t*30))
        ok,bgr=cap.read()
        if not ok: raise RuntimeError(f'Missing source frame at {t}')
        im=Image.fromarray(cv.cvtColor(bgr,cv.COLOR_BGR2RGB))
        im.resize((1120,630),Image.Resampling.LANCZOS).save(media/(name+'.webp'),quality=87)
    cap.release()
    for name,extent in [('stadium',.64),('trail',1.)]:
        im=Image.open(ART/(name+'.png')).convert('RGB')
        im=im.crop((0,0,im.width,round(im.height*extent)))
        im.thumbnail((1100,700),Image.Resampling.LANCZOS)
        im.save(media/(name+'.webp'),quality=83)

    c=Canvas(1280)
    c.background('bay.png',1.07,(670,340))
    c.ellipse(649,660,114,12,(30,32,61))
    mounts=[]
    class Workshop(Rig):
        def mount(self,canvas,name,point,width,angle=0.,side=0):
            if name=='camera':
                super().mount(canvas,name,point,width,angle,side)
            else:
                mounts.append({'name':name,'x':round(point[0]/1280*100,3),
                               'y':round(point[1]/720*100,3),'width':round(width/1280*100,3),
                               'angle':round(angle,4)})
    ATHLETE.draw(c,649,655,625,.06,.025,rig=Workshop(1))
    Image.fromarray(c.rgb).save(media/'bay.webp',quality=87)
    for name in ('camera','lidar','imu','force'):
        rgba(component(name)).save(media/(name+'.webp'),lossless=True)

    model=Profile()
    atlas=Image.new('RGBA',(768,1024))
    pieces={}
    x=y=row=2
    for name,(piece,a,b) in model.parts.items():
        im=rgba(piece.image)
        if x+im.width+2>atlas.width:
            x,y,row=2,y+row+3,0
        atlas.paste(im,(x,y))
        pieces[name]={'rect':[x,y,im.width,im.height],'a':(a-piece.offset).round(3).tolist(),
                      'b':(b-piece.offset).round(3).tolist()}
        row=max(row,im.height)
        x+=im.width+3
    assert y+row<=atlas.height
    atlas.crop((0,0,atlas.width,y+row+2)).save(media/'runner.webp',lossless=True)
    (media/'registration.json').write_text(json.dumps({'pieces':pieces,'sourceScale':model.source_scale,
        'mounts':mounts},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')


if __name__=='__main__':
    prepare()
