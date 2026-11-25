"""Trackside view, a match cut to the slipping boot, and a three-point catch."""
import math
from functools import lru_cache

import numpy as np
from PIL import Image

from cycles import deform
from paint import ART, INK, WHITE, bubble, ease, premultiply

WIDE = 5.20
INSERT = 8.90
PLANT = 9.75
BACK_TO_WIDE = 10.67
PALM = 12.36

# The same toe is followed through the wide shot and the insert. The three
# painted cels have corresponding crown, eyes, armour joints, fingertips and soles.
LANDMARKS = np.float32([
    [(242,106),(181,233),(240,220),(332,195),(225,281),(283,277),(339,295),(415,379),
     (417,216),(521,235),(608,257),(701,246),(627,306),(210,304),(173,359),(129,419),
     (84,440),(27,475),(255,420),(192,534),(86,590),(231,591),(533,456),(609,526),(650,580)],
    [(212,164),(145,287),(205,281),(304,253),(188,337),(260,342),(326,345),(407,424),
     (391,276),(483,286),(585,306),(681,300),(612,357),(177,372),(147,424),(102,479),
     (58,501),(10,518),(255,436),(275,536),(184,593),(337,590),(485,537),(580,512),(644,565)],
    [(191,186),(139,320),(200,309),(298,273),(176,365),(248,364),(332,372),(419,443),
     (378,307),(480,309),(580,332),(671,325),(607,387),(175,396),(164,455),(132,559),
     (96,584),(32,598),(273,501),(355,549),(233,593),(391,592),(523,505),(634,535),(666,593)]
])
SUPPORT = np.float32([(144,615),(250,613),(293,614)])
PALMS = np.float32([(79,463),(54,518),(91,605)])
TRAILING_TOE = np.float32([(653,590),(645,581),(663,605)])


@lru_cache(maxsize=1)
def catch_cels():
    with Image.open(ART/"catch.png") as sheet:
        cells=[]
        for left,right in ((0,719),(719,1438),(1438,2172)):
            cell=Image.new("RGBA",(740,724))
            cell.paste(sheet.crop((left,0,right,724)),(0,0))
            cells.append(premultiply(cell))
    return cells


def catch_pose(p):
    index=min(1,int(p))
    mix=p-index
    source=index if mix<.5 else index+1
    cel=catch_cels()[source]
    if .002<mix<.998:
        points=(1-mix)*LANDMARKS[index]+mix*LANDMARKS[index+1]
        cel=deform(cel,LANDMARKS[source],points)
    return cel,index,mix


@lru_cache(maxsize=1)
def shadow_ink():
    y,x=np.mgrid[-1:1:49j,-1:1:201j]
    alpha=np.uint8(170*np.maximum(0,1-x*x-y*y)**1.45)
    ink=np.empty((49,201,4),np.uint8)
    ink[:,:,:3]=np.uint8(alpha[:,:,None].astype(float)*np.array([49,31,61])/255)
    ink[:,:,3]=alpha
    return ink


class View:
    def __init__(self,c,t):
        self.c=c
        if INSERT<=t<BACK_TO_WIDE:
            self.z=2.34
            focus=(625-12*ease(INSERT,BACK_TO_WIDE,t),474+13*ease(INSERT,BACK_TO_WIDE,t))
        elif t>=BACK_TO_WIDE:
            self.z=1.20+.045*ease(BACK_TO_WIDE,PALM,t)-.075*ease(13.1,16.9,t)
            focus=(577-24*ease(BACK_TO_WIDE,PALM,t)+15*ease(13.1,16.9,t),391)
        else:
            self.z=1.015+.055*ease(WIDE,INSERT,t)
            focus=(640,359+5*ease(WIDE,INSERT,t))
        self.dx=640-self.z*focus[0]
        self.dy=360-self.z*focus[1]

    def xy(self,x,y):
        return self.z*x+self.dx,self.z*y+self.dy

    def shadow(self,x,y,rx,ry,strength):
        xx,yy=self.xy(x,y)
        self.c.stamp(shadow_ink(),np.array([[2*rx*self.z/201,0,xx-rx*self.z],
                                            [0,2*ry*self.z/49,yy-ry*self.z]]),strength)

    def line(self,points,color,width):
        self.c.line([self.xy(*p) for p in points],color,width*self.z)


def approach(t):
    u=min(1,max(0,(t-WIDE)/(PLANT-WIDE)))
    depth=.56*u+.44*u*u
    floor=258+239*depth+29*ease(PLANT,PLANT+.9,t)
    x=660-.16*(floor-258)-13*ease(PLANT,PLANT+.9,t)
    height=161+214*depth+12*ease(PLANT,PLANT+.9,t)
    phase=(min(t,PLANT)-PLANT)/.65
    return x,floor,height,phase


def slip(t):
    skid=ease(PLANT+.035,PLANT+.84,t)
    lean=-.016-.23*ease(PLANT+.20,BACK_TO_WIDE,t)
    crouch=.71*ease(PLANT+.17,BACK_TO_WIDE,t)
    reach=.94*ease(PLANT+.19,BACK_TO_WIDE,t)
    return skid,lean,crouch,reach


def toe_at(t):
    # Contact phase is held while the support boot slides. This is the same
    # foot endpoint and ankle-centred tilt used by Runner.draw.
    x,floor,h,_=approach(t)
    skid,lean,_,_=slip(t)
    lateral=-157-226*skid
    down=-11.
    return (x+(lateral*math.cos(lean)-down*math.sin(lean))*h/1400,
            floor+(lateral*math.sin(lean)+down*math.cos(lean))*h/1400)


def scrape(v,t):
    if t<=PLANT:
        return
    last=min(t,BACK_TO_WIDE)
    marks=[toe_at(s) for s in np.linspace(PLANT,last,12)]
    for dx,dy in ((1,1),(8,4)):
        v.line([(x+dx,y+dy) for x,y in marks],(131,107,132),1.8)
    for i in range(16):
        start=PLANT+.055+i*.034
        if t<start:
            continue
        origin=toe_at(start)
        life=.29+.12*((i*7)%5)
        u=min(1,(t-start)/life)
        dx=12+(i*29)%62
        rise=6+(i*13)%28
        px=origin[0]+dx*u
        py=origin[1]+(i%5-1)*2*u-4*rise*u*(1-u)
        x,y=v.xy(px,py)
        size=(1.8+i%3*.55)*v.z
        v.c.ellipse(x,y,size,size*.68,(97,76,112))
        v.c.ellipse(x-size*.17,y-size*.17,size*.57,size*.33,(226,207,220))


def brace(v,t,rig=None):
    # The boot stays at the end of its skid. Torso, forearm and knee move
    # around it. The hand then takes a share of the load.
    p=ease(BACK_TO_WIDE,11.51,t)+ease(11.51,PALM,t)-.40*ease(13.45,15.88,t)
    cel,index,mix=catch_pose(p)
    foot=SUPPORT[index]*(1-mix)+SUPPORT[index+1]*mix
    hand=PALMS[index]*(1-mix)+PALMS[index+1]*mix
    rear=TRAILING_TOE[index]*(1-mix)+TRAILING_TOE[index+1]*mix
    x,y=toe_at(BACK_TO_WIDE)
    shift=ease(BACK_TO_WIDE,PALM,t)
    x-=20*shift
    y+=18*shift
    scale=.566+.033*shift
    # Compress around the sole on landing; settle without lifting it off the ground.
    squash=1-.052*math.exp(-((t-PALM-.07)/.145)**2)
    def mark(point):
        return x+(point[0]-foot[0])*scale,y+(point[1]-foot[1])*scale*squash
    hx,hy=mark(hand)
    rx,ry=mark(rear)
    v.shadow(x+53,y+1,141,10,.40)
    v.shadow(x+3,y,40,6,.96)
    v.shadow(rx,ry+3,22,4,.77)
    v.shadow(hx,y-3,24,4,.97*ease(11.80,PALM,t)*(1-.65*ease(13.45,15.88,t)))
    xx,yy=v.xy(x,y)
    k=scale*v.z
    v.c.stamp(cel,np.array([[k,0,xx-k*foot[0]],[0,k*squash,yy-k*squash*foot[1]]]))
    if rig:
        ear=LANDMARKS[index,3]*(1-mix)+LANDMARKS[index+1,3]*mix
        rig.mount(v.c,"camera",v.xy(*mark(ear)),61*k,-.28)
    if PALM<t<PALM+.46:
        u=(t-PALM)/.46
        for i in range(5):
            sx,sy=v.xy(hx-(12+8*i)*u,hy+2-22*math.sin(math.pi*u)*(1-i*.09))
            v.c.ellipse(sx,sy,2*v.z,1.3*v.z,(145,117,145))


def trackside(c,t,athlete,diagnostic,rig=None):
    v=View(c,t)
    c.background("turn-shoulder.png",v.z,(0,0),(v.dx,v.dy))
    scrape(v,t)
    if t<BACK_TO_WIDE:
        x,floor,height,phase=approach(t)
        skid,lean,crouch,reach=slip(t)
        v.shadow(x,floor+1,height*.15,height*.018,.7)
        xx,yy=v.xy(x,floor)
        athlete.draw(c,xx,yy,height*v.z,phase,1,lean,crouch=crouch,reach=reach,
                     contact_shadow=True,skid=skid,rig=rig)
    else:
        brace(v,t,rig)
    if diagnostic and 6.15<t<8.67:
        opacity=ease(6.15,6.40,t)*(1-ease(8.38,8.67,t))
        c.text("跑道拐弯了，它还在直跑。",49,47,30,WHITE,3,INK,opacity=opacity)
    if diagnostic and t>13.35:
        bubble(c,"转向晚了一步","脚踩上碎石，鞋底滑了出去。",804,63,t-13.35)
