"""Ink and shade the registered poses with rigid artwork at the mechanical axles."""
from functools import lru_cache
import math

import cv2 as cv
import numpy as np
from PIL import Image

from athletic_keys import (HIP,NECK,EAR,EYE,NK,NA,NT,NH,FK,FA,FT,FH,NS,NE,NF,FS,FE,FF)
from paint import ART, premultiply

# Crops on the puppet sheet. Rounded ends continue underneath adjacent pieces.
RECTS={'head':(42,59,415,420),'body':(497,14,828,458),'upper':(896,124,1302,350),
       'shoulder':(896,124,1145,350),'forearm':(1340,140,1754,329),
       'thigh':(10,553,440,779),'shin':(464,568,864,770),'boot':(929,564,1295,773),
       'cap':(1450,569,1645,759)}
MASKS={
    'upper':[(1017,255),(1104,223),(1140,202),(1221,220),(1258,216),(1297,245),
             (1300,302),(1274,324),(1247,330),(1208,317),(1073,320),(1017,303)],
    'shoulder':[(897,229),(913,182),(965,146),(1018,127),(1078,137),(1124,158),
                (1142,194),(1143,221),(1126,250),(1090,279),(1081,309),(1058,337),
                (1024,347),(987,339),(964,315),(957,296),(926,290),(900,274)]}
SOCKETS={'body':((598,404),(679,50)), 'upper':((1018,280),(1253,275)),
         'forearm':((1390,241),(1675,226)), 'thigh':((62,666),(382,704)),
         'shin':((534,646),(817,707))}
BOOT_DENSITY=.00110
BOOT_PIVOT=(1028,630)
HEEL=np.array([951-BOOT_PIVOT[0],754-BOOT_PIVOT[1]])*BOOT_DENSITY
TOE=np.array([1262-BOOT_PIVOT[0],751-BOOT_PIVOT[1]])*BOOT_DENSITY


@lru_cache(maxsize=1)
def sheet():
    return np.asarray(Image.open(ART/'trackside-joints.png').convert('RGBA'))


@lru_cache(maxsize=20)
def piece(name,back=False):
    x,y,r,b=RECTS[name]
    im=sheet()[y:b,x:r].copy()
    a=np.uint8(np.clip((im[:,:,3].astype(float)-7)*255/241,0,255))
    if name in MASKS:
        mask=np.zeros(a.shape,np.uint8)
        cv.fillPoly(mask,[np.int32(MASKS[name])-np.int32([x,y])],255,cv.LINE_AA)
        a=cv.min(a,mask)
    if back:
        im[:,:,:3]=np.uint8(im[:,:,:3]*.80+[7,8,13])
    im[:,:,3]=a
    return premultiply(Image.fromarray(im))


def direction(p):
    return math.atan2(p[1],p[0])


def rotation(angle):
    co,si=math.cos(angle),math.sin(angle)
    return np.array([[co,-si],[si,co]])


def athletic_cel(canvas,pose,ax,floor,meter,ground):
    origin=np.array([ax,ground-floor*meter])
    def place(name,source_point,dest,k,angle,back=False):
        x,y,_,_=RECTS[name]
        canvas.paste(piece(name,back),*(origin+dest*meter),meter*k,
                     (source_point[0]-x,source_point[1]-y),angle)

    def bone(name,start,end,back=False):
        a,b=map(np.array,SOCKETS[name])
        axis=end-start
        angle=direction(axis)-direction(b-a)
        k=np.linalg.norm(axis)/np.linalg.norm(b-a)
        if name in ('thigh','shin'):
            width=.00155 if name=='thigh' else .00162
            axes=rotation(direction(axis))@np.diag([k,width])@rotation(-direction(b-a))
            anchor=origin+start*meter-meter*axes@(a-np.array(RECTS[name][:2]))
            canvas.stamp(piece(name,back),np.column_stack([meter*axes,anchor]))
        else:
            place(name,a,start,k,angle,back)

    hip=pose[HIP]
    neck_axis=pose[NECK]-hip
    neck=hip+neck_axis*.565/np.linalg.norm(neck_axis)
    a,b=map(np.array,SOCKETS['body'])
    body_angle=direction(neck-hip)-direction(b-a)
    body_transform=rotation(body_angle)*(.565/np.linalg.norm(b-a))
    shoulders=[hip+body_transform@(p-a) for p in (np.array([749,147]),np.array([572,153]))]

    def arm(i):
        back=i==0
        sh,el,hand=(FS,FE,FF) if back else (NS,NE,NF)
        shoulder=shoulders[i]
        upper=pose[el]-pose[sh]
        lower=pose[hand]-pose[el]
        elbow=shoulder+.304*upper/max(.001,np.linalg.norm(upper))
        knuckles=elbow+.344*lower/max(.001,np.linalg.norm(lower))
        bone('upper',shoulder,elbow,back)
        bone('forearm',elbow,knuckles,back)
        place('shoulder',(1022,281),shoulder,.00130,body_angle,back)

    def leg(i):
        back=i==0
        knee,ankle,toe,heel=(FK,FA,FT,FH) if back else (NK,NA,NT,NH)
        joint=hip+([-0.024,-.010] if back else [.006,.004])
        bone('thigh',joint,pose[knee],back)
        bone('shin',pose[knee],pose[ankle],back)
        angle=direction(pose[toe]-pose[heel])-direction(TOE-HEEL)
        place('boot',BOOT_PIVOT,pose[ankle],BOOT_DENSITY,angle,back)
        # The cover rides on the axle, independent of the relative limb angle.
        place('cap',(1549,670),pose[knee],.00073,0,back)

    arm(0)
    leg(0)
    bone('body',hip,neck)
    leg(1)
    head_angle=min(.30,max(-.14,direction(pose[EYE]-pose[EAR])-.07))
    place('head',(233,377),neck,.00157,head_angle)
    arm(1)
