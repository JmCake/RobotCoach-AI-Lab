"""Cel-painted versions of the four mounts in experiments/selection.html."""
from functools import lru_cache
import math

from PIL import Image, ImageDraw

from paint import INK, premultiply

BLUE=(94,215,255)
AMBER=(255,195,97)
VIOLET=(214,166,255)
GREEN=(118,246,180)
COLORS={'camera':BLUE,'imu':AMBER,'lidar':VIOLET,'force':GREEN}
LEVEL={'camera':1,'imu':2,'lidar':3,'force':4}


@lru_cache(maxsize=4)
def component(name):
    im=Image.new('RGBA',(200,112))
    d=ImageDraw.Draw(im)
    def panel(points,fill,edge=INK,weight=4):
        d.polygon(points,fill=fill)
        d.line([*points,points[0]],fill=edge,width=weight,joint='curve')
    if name=='camera':
        panel([(14,33),(38,13),(145,13),(180,32),(184,80),(162,98),(42,97),(16,83)],'#176288')
        panel([(16,33),(41,15),(146,15),(166,30),(141,43),(36,45)],'#b7ecff')
        panel([(31,41),(147,37),(163,48),(163,83),(148,93),(37,93),(25,79)],'#32b9f4')
        d.ellipse((87,23,172,103),fill='#173552',outline=INK,width=5)
        d.ellipse((96,30,163,94),fill='#608cad',outline='#bdf7ff',width=4)
        d.ellipse((103,37,156,90),fill='#112c51',outline='#38cef6',width=5)
        d.ellipse((112,42,132,55),fill='#eaffff')
        d.line([(40,55),(64,54)],fill='white',width=4)
    elif name=='imu':
        panel([(14,28),(32,16),(165,16),(187,30),(185,84),(166,98),(28,96),(11,80)],'#86502c')
        panel([(16,28),(32,18),(164,18),(173,28),(159,37),(35,38)],'#fff0bf')
        panel([(26,37),(160,32),(175,42),(174,75),(161,85),(34,86),(22,73)],'#f6ad48')
        panel([(48,45),(133,42),(141,49),(138,72),(52,75),(45,68)],'#353b45',weight=3)
        d.line([(59,58),(77,58),(92,67),(113,49),(128,49)],fill='#ffd889',width=5)
        d.ellipse((151,47,164,60),fill='#fff8d5')
        for x in (30,163):
            d.ellipse((x-3,72,x+3,78),fill='#674735')
    elif name=='lidar':
        d.ellipse((17,57,184,101),fill='#403053',outline=INK,width=5)
        d.rectangle((14,39,186,69),fill='#7049a6',outline=INK,width=5)
        d.ellipse((14,51,186,83),fill='#8153b1',outline=INK,width=4)
        d.rectangle((18,41,182,63),fill='#9966c9')
        d.arc((16,38,184,75),0,178,fill='#f8dcff',width=5)
        for x,y in [(44,62),(86,66),(132,64),(162,59)]:
            d.rounded_rectangle((x-8,y-5,x+8,y+4),3,fill='#3b284e')
            d.line((x-3,y-2,x+4,y-2),fill='#e3c6ff',width=2)
        d.ellipse((13,13,187,61),fill='#ddb1fa',outline=INK,width=5)
        d.ellipse((44,23,156,49),fill='#bb8be9',outline='#8160aa',width=3)
        d.arc((23,18,175,54),188,300,fill='#fff1ff',width=4)
    else:
        panel([(6,43),(32,31),(174,29),(193,40),(185,67),(165,80),(25,80),(8,68)],'#255c4a')
        panel([(10,44),(34,33),(170,31),(185,39),(166,49),(29,54)],'#c6ffe7',weight=3)
        panel([(18,53),(167,46),(182,41),(176,63),(161,71),(28,73),(16,66)],'#54d79c',weight=3)
        for x in (42,71,100,129):
            d.line((x,57,x+19,56), fill='#e4ffed',width=4)
            d.line((x+18,65,x+23,58), fill='#287959',width=3)
    return premultiply(im)


class Rig:
    def __init__(self,level,incoming=None,locked=1.):
        self.level,self.incoming,self.locked=level,incoming,locked
        self.anchors={}

    def mount(self,c,name,point,width,angle=0.,side=0):
        if self.level<LEVEL[name]:
            return
        x,y=point
        self.anchors[name,side]=(x,y)
        if name==self.incoming:
            gap=1-self.locked
            dx,dy={'imu':(185,-65),'lidar':(90,-123),'force':(side*150,-64)}[name]
            if gap>.04:
                c.line([(x,y),(x+dx*gap,y+dy*gap)],(126,178,194),1.4)
            x+=dx*gap
            y+=dy*gap
            width*=1+.50*gap
        c.paste(component(name),x,y,width/200,(100,56),angle)


def posed(c,cel,x,y,scale,anchor,angle,rig,points):
    """Hardware registered to an independently painted airborne or crouching cel."""
    c.paste(cel,x,y,scale,anchor,angle)
    co,si=math.cos(angle),math.sin(angle)
    for name,u,v,width,rotation,side in points:
        dx,dy=(u*cel.shape[1]-anchor[0])*scale,(v*cel.shape[0]-anchor[1])*scale
        rig.mount(c,name,(x+co*dx-si*dy,y+si*dx+co*dy),width*cel.shape[1]*scale,angle+rotation,side)
