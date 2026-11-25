"""Shot choreography for the offline film. Times are seconds, measurements are design pixels."""
from functools import lru_cache
import math

import cv2 as cv
from PIL import Image, ImageDraw

from cycles import running
from paint import Canvas, CYAN, GOLD, INK, WHITE, bubble, ease, font, premultiply, sprite
from pilot import ATHLETE, pilot

SENSE, CONTROL, LEARN, DECIDE, TRAIL, LENGTH = 22.2, 32.6, 42.6, 57.6, 68.8, 82.


@lru_cache(maxsize=40)
def caption_cel(words, small):
    size=27 if small else 32
    face=font(size*2)
    w=int(face.getlength(words))+77
    h=96 if small else 115
    im=Image.new("RGBA",(w+16,h+13))
    d=ImageDraw.Draw(im)
    d.polygon([(15,11),(w+13,11),(w-5,h+9),(5,h+9)],fill=(12,19,39,185))
    d.polygon([(10,3),(w,3),(w-17,h),(1,h)],fill=(255,252,239,250),outline=INK,width=5)
    d.line([(15,6),(w-4,6)],fill=(83,221,228),width=7)
    d.text((34,h*.49),words,font=face,fill=INK,anchor="lm")
    return premultiply(im)


def caption(c,words,t,x=42,y=631,small=False):
    u=ease(0,.23,t)
    c.paste(caption_cel(words,small),x-20*(1-u),y,.5,opacity=u)


def heading(c,words,t):
    # A brief title in the image, then clear the view of the action.
    u=ease(0,.2,t)*(1-ease(2.9,3.35,t))
    c.text(words,45,42,43,WHITE,3,INK,opacity=u)


def boot(c,t):
    pull=ease(.85,3.5,t)
    c.background("bay.png",1.35-.31*pull,(692,354))
    height=2010-1395*pull
    x=643+177*pull
    top=41+37*pull
    floor=top+height*.945
    if pull>.6:
        c.ellipse(x,floor,99,10,(35,32,82))
    ATHLETE.draw(c,x,floor,height,t/1.1,.035+.11*ease(3.8,5,t),
                 -.012*pull,head_turn=.36*math.sin(t*1.3))
    if t<.56:
        c.rgb=cv.convertScaleAbs(c.rgb,alpha=.12+.88*ease(0,.53,t))
    if t>1.65:
        u=ease(1.65,2.35,t)
        c.text("初代机",65,260,27,CYAN,1,INK,opacity=u)
        c.text("机器人进化跑",58,309,74,WHITE,3,INK,opacity=u)
        c.text("第一次上跑道。",67,428,32,WHITE,1,INK,opacity=u)


def sensor_tag(c,title,detail,where,target,t):
    x,y=where
    destx,desty=target
    anchor=x+225 if x<600 else x
    a=ease(0,.32,t)
    joint=(anchor+(destx-anchor)*.38,y+44)
    start=(anchor,y+44)
    tip=(joint[0]+(destx-joint[0])*a,joint[1]+(desty-joint[1])*a)
    c.line([start,joint,tip],(32,46,92),6)
    c.line([start,joint,tip],(133,248,251),2)
    c.ellipse(destx,desty,9+3*(1-a),9+3*(1-a),CYAN,2)
    bubble(c,title,detail,x,y,t)


def sensors(c,t):
    c.background("bay.png",1.035+.018*math.sin(t*.34),(642,415))
    y=627+1.3*math.sin(t*2)
    c.ellipse(655,y,107,11,(27,26,69))
    ATHLETE.draw(c,655,y,583,t/2.0,.025,head_turn=.4*math.sin(t*.72))
    heading(c,"感知升级",t)
    scan_y=164+(t%3.4)/3.4*414
    c.ellipse(655,scan_y,125,14,(40,187,234),2)
    if .55<t<5.15:
        sensor_tag(c,"摄像头","辨认跑道与弯道",(76,188),(651,178),t-.55)
    if 2.3<t<5.15:
        sensor_tag(c,"激光测距","估计障碍物距离",(826,294),(719,193),t-2.3)
    if 5.15<=t:
        sensor_tag(c,"惯性测量单元","感受身体倾斜",(78,206),(652,336),t-5.15)
    if 6.9<t:
        sensor_tag(c,"足底力觉","确认落脚与滑移",(825,415),(723,611),t-6.9)
    if t>8.35:
        caption(c,"看见环境，也要知道身体正在做什么。",t-8.35,small=True)


def hurdle(c,x,ground,scale=1.,tilt=0.,fall=0.):
    """Foreshortened training hurdle, including the farther mounting and track shadow."""
    if x < -220 or x > 1500:
        return
    def point(px,py):
        # Rotate the loose foam crossbar on impact, with feet still planted.
        return (x+(px+tilt*(-py)*.38)*scale,ground+py*scale)
    def part(pts,fill,stroke=INK,loose=False):
        if loose and fall:
            # The foam crossbar comes off the planted supports and drops onto the track.
            smooth=ease(0,.71,fall)
            bounce=7*math.sin(math.pi*min(1.,max(0.,(fall-.49)/.27)))
            p=[]
            for px,py in pts:
                u=(px-34)*math.cos(.23*smooth)-(py+115)*math.sin(.23*smooth)
                v=(px-34)*math.sin(.23*smooth)+(py+115)*math.cos(.23*smooth)
                p.append(point(34+u+51*smooth,-115+v+min(107,340*fall*fall)-bounce))
        else:
            p=[point(*v) for v in pts]
        c.poly(p,fill)
        if stroke:
            c.line(p,stroke,2.7*scale,True)
    part([(-30,2),(54,-33),(113,-30),(42,6)],(130,49,64),None)
    for dx,dy in [(73,-35),(0,0)]:
        part([(dx-21,dy),(dx+33,dy),(dx+36,dy-6),(dx-16,dy-7)],(187,197,205))
        part([(dx-4,dy-5),(dx+5,dy-5),(dx+6,dy-106),(dx-4,dy-108)],(215,225,231))
        c.line([point(dx,dy-8),point(dx,dy-103)],(101,132,157),2)
    part([(-10,-119),(75,-155),(86,-151),(0,-111)],(255,242,180),loose=True)
    part([(-10,-119),(0,-111),(0,-94),(-10,-100)],(172,87,44),loose=True)
    part([(0,-111),(86,-151),(86,-134),(0,-94)],(255,199,63),loose=True)
    for dx in (12,35,58):
        sl=-.455*dx
        part([(dx,-111+sl),(dx+9,-115+sl),(dx+15,-100+sl),(dx+5,-96+sl)],INK,None,True)


def stadium(c,t):
    c.background("stadium.png",1.20,(380+min(11,t)*40,385))
    # Track seams advance faster than the spectator tiers in the tracking shot.
    for n in range(4):
        px=(n*410-t*250)%1640-180
        c.line([(px,704),(px+47,676)],(249,177,154),3)


def pang(c,x,y,t):
    if not 0<=t<.55:
        return
    u=t/.55
    for i in range(10):
        a=-math.pi+i*math.pi/9
        r=28+95*u
        c.line([(x+math.cos(a)*r,y+math.sin(a)*r*.76),
                (x+math.cos(a)*(r+23*(1-u)),y+math.sin(a)*(r+23*(1-u))*.76)],
               (255,223,126),1+3*(1-u))


def side_athlete(c,x,ground,height,phase,jump=0.,landing=0.,pitch=0.):
    lift=math.sin(math.pi*jump) if 0<jump<1 else 0.
    c.ellipse(x,ground+2,height*(.229-.075*lift),8-3*lift,(110,44,67))
    if 0<jump<1:
        cel=sprite("leap.png")
        w=height*(1.06+.19*lift)
        # The arc and torso pitch continue through the tucked painted key pose.
        c.paste(cel,x,ground-189*lift,w/cel.shape[1],
                (cel.shape[1]*.51,cel.shape[0]*.98),-.18+.31*jump)
    else:
        running(c,"side.png",x,ground,height,phase,pitch,
                1-.14*max(0,landing))


def control(c,t):
    stadium(c,t)
    runner_x=433+8*t
    rail_x=runner_x+(5.16-t)*176
    hurdle(c,rail_x,610,.88)
    jump=max(0,min(1,(t-4.10)/2.12))
    landing=math.exp(-((t-6.36)/.18)**2)
    side_athlete(c,runner_x,612,324,t/.66,jump,landing)
    pang(c,runner_x+18,611,t-6.23)
    heading(c,"运动控制",t)
    if .5<t<3.9:
        caption(c,"先测距离，找准起跳点。",t-.5)
    elif 4.18<t<6.2:
        c.text("起跳",720,188,47,WHITE,3,INK,opacity=ease(4.18,4.43,t))
    elif t>6.53:
        caption(c,"落地时屈膝，用足底反馈缓冲。",t-6.53)


def learning(c,t):
    reset=5.7
    second=t>=reset
    local=t-reset if second else t
    clock=local if second else min(local,3.30)
    stadium(c,clock)
    x=460
    meet=3.30 if not second else 4.10
    rail=x+(meet-clock)*158+35
    hit=ease(3.28,3.57,local) if not second else 0
    hurdle(c,rail,610,.88,hit)
    jump=max(0,min(1,(local-3.22)/1.86)) if second else 0.
    side_athlete(c,x-37*hit,612,325,clock/.66,jump,
                 math.exp(-((local-5.17)/.16)**2) if second else 0.,-.23*hit)
    heading(c,"人工智能学习",t)
    if not second:
        if t<3.28:
            caption(c,"第一次试跑，机器人选择继续前进。",t)
        else:
            pang(c,x+34,552,t-3.30)
            bubble(c,"碰撞反馈  −12","小腿撞上矮栏",740,244,t-3.30,(255,142,140))
            caption(c,"这次反馈会降低该状态下前进的 Q 值。",t-3.35,small=True)
    else:
        if local<3.32:
            caption(c,"多轮训练后，再遇同一道栏。",local)
        elif local<5.28:
            caption(c,"在合适的距离选择起跳。",local-3.32)
        else:
            bubble(c,"越栏反馈  +8","更新这次起跳的 Q 值",726,225,local-5.28)
            caption(c,"策略从每一次动作的结果中学习。",local-5.45,small=True)


def beam(c,t):
    near=ease(2.0,7.45,t)
    past=ease(7.45,8.65,t)
    s=.12+near*.88+past*1.48
    cx=576+62*near
    feet=318+354*near+past*185
    top=310+43*near-past*640
    l,r=cx-321*s,cx+321*s
    for p in (l,r):
        c.poly([(p-8*s,feet),(p+8*s,feet),(p+8*s,top),(p-8*s,top)],(202,210,224))
        c.line([(p-7*s,feet),(p-7*s,top)],INK,max(1,3*s))
    c.poly([(l-8*s,top),(r+8*s,top),(r+8*s,top+23*s),(l-8*s,top+23*s)],(255,229,131))
    for i in range(11):
        px=l+i*(r-l)/11
        c.poly([(px,top),(px+19*s,top),(px+31*s,top+23*s),(px+12*s,top+23*s)],(43,49,65))
    c.line([(l-8*s,top),(r+8*s,top),(r+8*s,top+23*s),(l-8*s,top+23*s)],INK,2*s,True)


def decision(c,t):
    if t<2.05:
        c.background("curve.png",1.18+.12*t,(646,300))
        h=1130+630*ease(.3,1.90,t)
        ATHLETE.draw(c,659,76+h*.88,h,t/.65,1.)
        heading(c,"自主决策",t)
        return
    c.background("curve.png",1.045+.036*ease(2,9,t),(565,309))
    duck=ease(5.8,6.85,t)*(1-ease(7.65,8.60,t))
    turn=ease(8.12,11.12,t)
    x=639-105*turn+5*math.sin(t*8.5)
    h=400-39*turn
    ground=639-34*turn
    if t<=7.20:
        beam(c,t)
    c.ellipse(x,ground+2,63,9,(118,47,70))
    if duck<.46:
        running(c,"rear.png",x,ground,h,t/.69,-.16*turn,1-.36*duck)
    else:
        cel=sprite("duck.png")
        visible_height=h*(.93-.32*duck)
        scale=visible_height/(cel.shape[0]*.80)
        c.paste(cel,x,ground-2*math.sin(t*12),scale,
                (cel.shape[1]*.52,cel.shape[0]*.94),.025*math.sin(t*6))
    if t>7.20:
        beam(c,t)
    if 2.27<t<5.3:
        bubble(c,"前方低梁","测距信号持续更新",84,141,t-2.27)
    elif 5.36<t<8.23:
        caption(c,"策略选择下蹲，收身通过。",t-5.36)
    elif t>=8.40:
        caption(c,"通过后重新观察，恢复前进。",t-8.40)


def trail(c,t):
    travel=(1-math.exp(-.145*t))/(1-math.exp(-.145*13.2))
    c.background("trail.png",1.04-.028*travel,(775,317))
    # Follow the dry right-hand decking. Screen speed falls with distance.
    x=820+47*math.sin(travel*math.pi)-36*travel
    ground=699-363*travel
    height=340-261*travel
    if 2.4<t<6.5:
        u=ease(2.4,2.95,t)*(1-ease(5.85,6.5,t))
        for i in range(3):
            c.ellipse(355,401,(18+11*i)*u,(3+i*2)*u,(156,250,245),1)
        c.line([(245,321),(282,321),(355,392)],(178,254,246),2)
        c.text("水面",170,299,27,WHITE,2,INK,opacity=u)
        c.line([(1003,399),(973,399),(911,456)],(250,242,177),2)
        c.text("栈道",1007,380,27,WHITE,2,INK,opacity=u)
    c.ellipse(x,ground+1,height*.15,max(2,height*.016),(135,95,75))
    running(c,"rear.png",x,ground,height,t/.88,-.036*math.sin(math.pi*travel))
    if t<3.55:
        heading(c,"应用设想 · 栈道巡检",t)
    if 3.6<t<7.48:
        caption(c,"识别水面和栈道，沿可通行区域前进。",t-3.6,small=True)
    if 7.72<t<11.66:
        caption(c,"水痕提示可能湿滑，落脚后再检查反馈。",t-7.72,small=True)
    if t>12.85:
        c.rgb=cv.convertScaleAbs(c.rgb,alpha=1-.86*ease(12.85,13.19,t))


def slash(c,t,cut):
    dt=t-cut
    if abs(dt)>.14:
        return
    x=-290+1810*(dt+.14)/.28
    c.poly([(x+182,0),(x+281,0),(x-24,720),(x-117,720)],(248,251,245))
    c.line([(x+282,0),(x-23,720)],(27,38,60),4)


def frame(c,t):
    if t<5:
        boot(c,t)
    elif t<SENSE:
        pilot(c,t-5)
    elif t<CONTROL:
        sensors(c,t-SENSE)
    elif t<LEARN:
        control(c,t-CONTROL)
    elif t<DECIDE:
        learning(c,t-LEARN)
    elif t<TRAIL:
        decision(c,t-DECIDE)
    else:
        trail(c,t-TRAIL)
    for cut in (5,SENSE,CONTROL,LEARN+5.7,DECIDE,TRAIL):
        slash(c,t,cut)
