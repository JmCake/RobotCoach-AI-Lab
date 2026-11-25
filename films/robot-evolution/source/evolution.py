"""Teaching cut. Every hardware change returns to the same camera and obstacle."""
from functools import lru_cache
import json
import math
from pathlib import Path

import cv2 as cv
import numpy as np
from PIL import Image, ImageDraw

from bend import View, WIDE, approach
from cycles import running
from film import beam, caption, hurdle, pang, stadium
from hardware import AMBER, BLUE, GREEN, VIOLET, Rig, posed
from paint import CYAN, GOLD, INK, WHITE, ease, font, premultiply, sprite
from pilot import ATHLETE, pilot

IMU, BEND, DAY, NIGHT, LIDAR, NIGHT_RETRY = 22.2,25.9,31.3,33.8,38.4,41.9
ROUGH, SOLES, ROUGH_RETRY = 47.7,51.5,55.1
LEARN, PRACTICE, LEARN_RETRY, FROZEN, LOW, TRAIL, LENGTH = 59.9,65.6,68.3,73.2,77.,81.4,91.
# The matching moment lies on a 30 fps exposure in both takes.
TRAINING_DECISION=2.40
DATA=json.loads(Path(__file__).with_name('observations.json').read_text(encoding='utf-8'))
LEARNING=DATA['learning']
RED=(255,143,128)
NIGHT_COLORS=np.uint8(np.stack([5+np.arange(256)*.27,13+np.arange(256)*.35,34+np.arange(256)*.43],axis=1)[:,None,:])


@lru_cache(maxsize=80)
def label_cel(words,color,size):
    face=font(size*2)
    w=round(face.getlength(words))+61
    h=2*size+26
    im=Image.new('RGBA',(w+6,h+5))
    d=ImageDraw.Draw(im)
    d.polygon([(0,0),(w,0),(w-12,h),(0,h)], fill=(16,26,47,227))
    d.polygon([(0,0),(8,0),(8,h),(0,h)],fill=color)
    d.text((22,h//2-1),words,font=face,fill=(250,252,249),anchor='lm')
    return premultiply(im)


def label(c,words,x=42,y=40,color=CYAN,size=23):
    c.paste(label_cel(words,color,size),x,y,.5)


def cap(c,words,t):
    caption(c,words,t,38,641,True)


def note(c,words,t,x=42,y=102,color=WHITE,size=35):
    c.text(words,x,y,size,color,3,INK,opacity=ease(0,.17,t))


def opening(c,t,explain=False):
    u=ease(.75,3.05,t)
    c.background('bay.png',1.35-.31*u,(692,354))
    height=1950-1328*u
    x=654+164*u
    floor=52+26*u+height*.945
    if u>.6:
        c.ellipse(x,floor,93,11,(30,32,64))
    rig=Rig(1)
    ATHLETE.draw(c,x,floor,height,t/1.1,.035+.11*ease(3.8,5,t),
                 -.012*u,head_turn=.36*math.sin(t*1.3),rig=rig)
    if t<.47:
        c.rgb=cv.convertScaleAbs(c.rgb,alpha=.12+.88*ease(0,.45,t))
    if t>1.05:
        a=ease(1.05,1.42,t)
        c.text('机器人进化跑',53,245,72,WHITE,3,INK,opacity=a)
        if explain:
            c.text('头侧摄像头辨认跑道。',61,351,31,BLUE,1,INK,opacity=a)
            c.text('双腿按人写好的步态程序迈步。',61,407,27,WHITE,1,INK,opacity=ease(1.58,1.94,t))
        else:
            c.text('初代机只有一枚摄像头。',61,358,31,BLUE,1,INK,opacity=a)
    if t>3.02:
        joint=rig.anchors['camera',0]
        c.line([(960,157),(890,157),joint],BLUE,2)
        label(c,'头侧摄像头',943,132,BLUE,22)


def install(c,t,kind):
    color,title,detail,action,level={
        'imu':(AMBER,'胸口装上姿态传感器','IMU 测出身体倾斜的角度。','控制器据此调整转向和身体姿态。',2),
        'lidar':(VIOLET,'头顶装上激光雷达','激光脉冲打在栏杆上，再反射回来。','根据往返时间，算出到栏杆的距离。',3),
        'force':(GREEN,'两只脚装上力觉传感器','鞋底受力，就知道哪只脚先着地。','比较两脚的落差，调整下一步。',4)
    }[kind]
    settle=ease(.28,1.38,t)
    push=ease(1.56,3.55,t)
    c.background('bay.png',1.12+.07*push,(810,330))
    rig=Rig(level,kind,settle)
    h=990+106*push
    x=875 if kind!='force' else 856
    floor={'imu':309+.642*h,'lidar':231+.958*h,'force':521}[kind]
    ATHLETE.draw(c,x,floor,h,t*.30,.018,head_turn=.07*math.sin(2*t),rig=rig)
    for (name,side),(xx,yy) in rig.anchors.items():
        if name==kind and 1.29<t<1.80:
            blink=(t-1.29)/.51
            c.ellipse(xx,yy,(26+48*blink)*(h/1000),(17+35*blink)*(h/1000),color,2.8*(1-blink))
    label(c,'维修区',47,133,color)
    note(c,title,t,x=46,y=204,size=43)
    c.text(detail,52,303,26,WHITE,2,INK,opacity=ease(.18,.48,t))
    c.text(action,52,355,25,color,1,INK,opacity=ease(.80,1.12,t))


def bend_retry(c,t):
    # Identical framing, start mark and stride phase to the failed trackside shot.
    clock=WIDE+t*.99
    v=View(c,min(clock,8.83))
    c.background('turn-shoulder.png',v.z,(0,0),(v.dx,v.dy))
    x,y,h,_=approach(min(clock,9.75))
    ex=max(0.,clock-9.75)
    y+=64*ex
    h+=53*ex
    progress=min(1.22,(clock-WIDE)/4.55)
    x+=206*progress**2.24+18*ex
    phase=(clock-9.75)/.65
    lean=.235*ease(.35,2.4,t)-.14*ease(3.8,5.4,t)
    xx,yy=v.xy(x,y)
    v.shadow(x,y+1,h*.15,h*.018,.72)
    ATHLETE.draw(c,xx,yy,h*v.z,phase,1,lean,contact_shadow=True,rig=Rig(2))
    label(c,'重跑同一个弯道',color=AMBER)
    if t<2.59:
        cap(c,'摄像头看见白线拐弯，机器人开始转向。',t)
    else:
        cap(c,'胸口测到侧倾，控制器随步纠偏，双脚留在红道内。',t-2.59)


def track(c,t,night=False):
    stadium(c,t)
    if night:
        c.rgb=cv.LUT(c.rgb,NIGHT_COLORS)


def runner_side(c,x,ground,h,phase,rig,jump=0.,pitch=0.,compress=1.,night=False,surface=None,planted=None):
    lift=max(0.,math.sin(math.pi*jump))
    shade=(41,36,68) if night else (119,55,65)
    c.ellipse(x+13,ground+2,h*(.20-.065*lift),7-2.5*lift,shade)
    running(c,'side.png',x,ground-h*.37*lift,h,phase,pitch,compress,rig,jump,surface,planted)


def range_bracket(c,x,y,width,height,color):
    arm=min(20,width*.27)
    for side in (-1,1):
        for vertical in (-1,1):
            a=x+side*width/2
            b=y+vertical*height/2
            c.line([(a-side*arm,b),(a,b),(a,b-vertical*arm)],color,2)


def daylight(c,t,explain=False):
    clock=3.12+t-1.12
    x=403+9*clock
    rail=x+67+(3.12-clock)*159
    track(c,clock)
    hurdle(c,rail,604,.93)
    jump=max(0.,min(1.,(t-.24)/1.82))
    runner_side(c,x,606,312,(clock-3.12)/.66,Rig(2),jump,
                compress=1-.09*math.exp(-((t-2.11)/.14)**2))
    label(c,'同一道矮栏  ·  白天',color=AMBER)
    cap(c,'摄像头发现矮栏，人写的规则根据栏距和速度发出起跳指令。' if explain
        else '白天能看见栏，照原有的规则就能跨过去。',t)


def night_run(c,t,retry):
    jump_start,meet,landing=2.05,3.12,4.22
    clock=t if retry else min(t,meet)
    x=403+9*clock
    rail=x+67+(meet-clock)*159
    track(c,clock,True)
    hit=0 if retry else ease(meet,meet+.39,t)
    hurdle(c,rail,604,.93,fall=max(0.,t-meet) if not retry else 0.)
    q=max(0.,min(1.,(t-jump_start)/(landing-jump_start))) if retry else 0.
    rig=Rig(3 if retry else 2)
    phase=(clock-meet)/.66
    # Stay with the falling crossbar when the runner's forward boot makes contact.
    compression=1-.16*hit-.10*math.exp(-((t-landing-.07)/.15)**2)*retry
    runner_side(c,x-14*hit,606,312,phase,rig,q,.19*hit,compression,True)
    label(c,'重跑同一道弱光矮栏' if retry else '同一道矮栏  ·  灯光变暗',color=VIOLET if retry else BLUE)
    if not retry:
        if t<meet:
            note(c,'摄像头在这里仅能探测 1.05 米',t,size=29)
            cap(c,'灯光变暗。脚步还很稳，栏杆的位置却看不清。',t)
        else:
            pang(c,x+67,512,t-meet)
            note(c,'碰栏',t-meet,color=RED)
            cap(c,'图像来得太晚，来不及起跳。',t-meet)
        return
    first=DATA['trials']['night'][1]['events']
    if t<jump_start:
        d=first['lidar']['distance']+(first['jump']['distance']-first['lidar']['distance'])*t/jump_start
        if ('lidar',0) in rig.anchors:
            origin=rig.anchors['lidar',0]
            tip=(rail+27,485)
            for fraction in ((t*2.0)%1,(t*2.0+.5)%1):
                xx=origin[0]+(tip[0]-origin[0])*fraction
                yy=origin[1]+(tip[1]-origin[1])*fraction
                c.line([(xx,yy),(xx+15,yy+3)],VIOLET,2)
            range_bracket(c,rail+35,484,91,55,VIOLET)
        note(c,f'距栏 {d:.1f} 米',t,color=VIOLET)
        cap(c,'雷达已测到栏杆，先继续跑。',t)
    elif t<landing:
        note(c,f"距栏 {first['jump']['distance']:.2f} 米起跳",t-jump_start,color=VIOLET)
        cap(c,'距离合适，预设规则这才发出起跳指令。',t-jump_start)
    else:
        pang(c,x+10,605,t-landing)
        cap(c,'越过同一道栏，屈膝落地，胸口的 IMU 帮它稳住身体。',t-landing)


def uneven(c,t,retry):
    contact=1.53
    if retry:
        progress=153*min(t,contact)+90*max(0.,t-contact)
    else:
        after=max(0.,t-contact)
        progress=153*min(t,contact)+74*(1-math.exp(-3.5*after))
    x=459
    marker=x+104+153*contact-progress
    # Surveyed in the 1280 x 720 art space along the near wheel mark of the painted dirt.
    zoom=1.66
    dx=marker-642*zoom
    dy=582-483*zoom
    c.background('uneven.png',zoom,(0,0),(dx,dy))
    def surface(sx):
        u=(sx-dx)/zoom
        ridge=27.*math.exp(-((u-642)/90.)**2)+16.*math.exp(-((u-973)/69.)**2)
        return (483-ridge)*zoom+dy
    align=ease(contact-.20,contact+.27,t)
    if retry:
        pitch=-.095*align+.09*ease(contact+.34,contact+1.28,t)
        comp=1-.13*math.exp(-((t-contact-.20)/.39)**2)
    else:
        pitch=.27*ease(contact,contact+.57,t)-.065*ease(contact+.68,contact+1.19,t)
        comp=1-.38*ease(contact,contact+.64,t)+.045*ease(contact+.88,contact+1.52,t)
    floor=surface(x)
    phase=progress/(153*.71)-contact/.71+.04
    if not retry:
        phase-=.26*ease(contact,contact+.47,t)
    rig=Rig(4 if retry else 3)
    hold=ease(contact-.09,contact+.065,t)
    if retry:
        hold*=1-ease(contact+.25,contact+.54,t)
    runner_side(c,x,floor+3,300,phase,rig,pitch=pitch,compress=comp,surface=surface,planted=(marker,hold))
    label(c,'重跑同一段起伏路面' if retry else '下一关  ·  起伏路面',color=GREEN if retry else AMBER)
    if t<contact:
        cap(c,'同一条凸起，仍由前脚先落地。' if retry else '越过栏杆后，前脚踏上凸起，后脚还在低处。',t)
    elif not retry:
        pang(c,marker,surface(marker),t-contact)
        note(c,'前脚先受力，膝盖一软',t-contact,size=31)
        cap(c,'沿用平地的步幅，身体向前栽。',t-contact)
    else:
        if t<contact+.68:
            ax,ay=rig.anchors['force',1]
            c.ellipse(ax,ay+3,29,7,GREEN,2.5)
        if t<3.24:
            note(c,'前脚着地',t-contact,color=GREEN,size=30)
            cap(c,'鞋底传回落脚差，控制器减速、收短下一步。',t-contact)
        else:
            cap(c,'后脚跟上，重心稳住，继续跑过接缝。',t-3.24)


DUCK_MOUNTS=[
    ('camera',.696,.271,.060,.19,0),('lidar',.585,.131,.130,.12,0),
    ('force',.299,.925,.116,-.04,-1),('force',.587,.842,.088,.21,1)]
LEAP_MOUNTS=[
    ('camera',.573,.180,.057,.08,0),('lidar',.632,.009,.101,.30,0),
    ('imu',.513,.374,.069,.40,0),('force',.939,.651,.103,-1.07,1),('force',.081,.713,.088,-.69,-1)]


def chalk(c,x,ground):
    c.line([(x-37,ground+24),(x+104,ground-33)],(247,224,193),3)
    c.line([(x-35,ground+27),(x+105,ground-30)],(177,89,85),1.2)


def training_track(c,clock):
    x=435+5*clock
    rail=x+67+(3.32-clock)*142
    track(c,clock)
    chalk(c,rail,608)
    return x,rail,(clock-3.32)/.67


def early_learning(c,t):
    hit_at=3.32
    clock=min(t,hit_at)
    x,rail,phase=training_track(c,clock)
    hit=ease(hit_at,hit_at+.40,t)
    hurdle(c,rail,606,.90,fall=max(0.,t-hit_at))
    runner_side(c,x-14*hit,609,313,phase,Rig(4),pitch=.20*hit,compress=1-.18*hit)
    collision=LEARNING['collision']
    label(c,'加装软件  ·  强化学习（Q-learning）',color=CYAN)
    if t<1.72:
        note(c,'从空白动作表开始',t,size=32)
        cap(c,'跑、跳、蹲它已经会了。这次由它自己试，何时用哪招。',t)
    elif t<hit_at:
        note(c,f"第 {collision['attempt']} 轮   选择前进",t-1.72,size=32)
        cap(c,f"距栏 {collision['previousChoice']['distance']:.2f} 米，脚已着地。",t-1.72)
    else:
        pang(c,x+67,515,t-hit_at)
        note(c,f"碰栏  {collision['reward']:+d}".replace('-','−'),t-hit_at,color=RED,size=38)
        after=f"{collision['after']:.1f}".replace('-','−')
        cap(c,f'这时选“前进”的评分从 {collision["before"]} 降到 {after}。',t-hit_at)


def practice(c,t):
    c.background('bay.png',1.07,(662,365))
    label(c,'强化学习  ·  反复试跑',color=CYAN)
    stages=[p for p in LEARNING['progress'] if p['attempt']>1]
    index=sum(t>=k for k in (.59,1.22,1.95))
    progress=stages[index]
    note(c,f"已训练 {progress['attempt']} 轮",t,x=42,y=109,size=37)
    # Three painted actions in the same bay. The numbers are cumulative training observations.
    h=209
    rig=Rig(4)
    for x in (250,660,1030):
        c.ellipse(x,524,93,11,(36,34,73))
    running(c,'side.png',250,522,h,t/.69,rig=rig)
    cel=sprite('leap.png')
    xx=650+7*math.sin(t*2.6)
    y=419-12*math.sin(t*2.6)
    posed(c,cel,xx,y,.188,(cel.shape[1]*.5,cel.shape[0]*.50),-.03,rig,LEAP_MOUNTS)
    cel=sprite('duck.png')
    posed(c,cel,1030,517+3*math.sin(t*7),.172,(cel.shape[1]*.52,cel.shape[0]*.94),0,rig,DUCK_MOUNTS)
    for x,word in ((250,'前进'),(650,'起跳'),(1030,'下蹲')):
        c.text(word,x,552,25,WHITE,2,INK,align=.5)
    cap(c,'按障碍、距离和落脚情况分别记分，再试下一轮。',t)


def learned_hurdle(c,t,frozen=False):
    run=LEARNING['transfer' if frozen else 'retrial']
    start,meet,land=(1.13,1.98,2.96) if frozen else (1.50,2.42,3.54)
    if not frozen:
        x,rail,phase=training_track(c,TRAINING_DECISION+t-start)
    else:
        x=429+7*t
        rail=x+79+(meet-t)*167
        phase=t/.67
        track(c,t+1.1)
        chalk(c,rail,608)
        old_x=rail+97*(LEARNING['retrial']['obstacles'][0]['x']-run['obstacles'][0]['x'])
        c.line([(old_x-28,628),(old_x+77,585)],(247,188,158),2)
    hurdle(c,rail,606,.9)
    jump=max(0.,min(1.,(t-start)/(land-start)))
    runner_side(c,x,609,313,phase,Rig(4),jump,compress=1-.10*math.exp(-((t-land-.1)/.16)**2))
    event=next(e for e in run['events'] if e['kind']=='jump')
    if frozen:
        label(c,'冻结动作表  ·  未见过的赛道',color=GREEN)
        note(c,f"第一栏移到 {run['obstacles'][0]['x']:.2f} 米",t,color=WHITE,size=31)
        cap(c,'栏架位置变了。没有人发指令，它按眼前的距离起跳。',t)
    else:
        label(c,'训练 300 轮后  ·  重跑同一道栏',color=CYAN)
        if t<start:
            note(c,f"第一栏在 {run['obstacles'][0]['x']:.2f} 米",t,size=30)
            cap(c,'再次接近这道矮栏，脚底传回着地信号。',t)
        elif t<land:
            note(c,f"距栏 {event['distance']:.2f} 米   选择起跳",t-start,color=CYAN,size=32)
            cap(c,'同样的位置，这次它选了起跳。',t-start)
        else:
            pang(c,x+15,606,t-land)
            note(c,f"成功越栏  +{LEARNING['passReward']}",t-land,color=GREEN,size=39)
            cap(c,'越栏得到正反馈。',t-land)


def low_beam(c,t):
    # Continue the frozen run from behind, in the line of the next obstacle.
    u=2.1+t*1.52
    c.background('curve.png',1.05+.035*ease(0,4.4,t),(569,318))
    lower=ease(.92,2.12,t)*(1-ease(3.55,4.30,t))
    x=635+4*math.sin(t*8)-14*ease(3.62,4.35,t)
    floor=647-9*ease(3.4,4.4,t)
    rig=Rig(4)
    if u<=7.18:
        beam(c,u)
    c.ellipse(x,floor+2,61,8,(120,46,65))
    if .47<lower:
        cel=sprite('duck.png')
        h=391*(1-.38*lower)
        posed(c,cel,x,floor-2*math.sin(t*11),h/(cel.shape[0]*.80),
              (cel.shape[1]*.52,cel.shape[0]*.94),.016*math.sin(t*7),rig,DUCK_MOUNTS)
    else:
        running(c,'rear.png',x,floor,385,t/.70,-.024,1-.48*lower,rig)
    if u>7.18:
        beam(c,u)
    label(c,'冻结测试  ·  第二个障碍',color=GREEN)
    if t<2.48:
        note(c,'前方低梁   选择下蹲',t,size=30)
        cap(c,'这次挡住的是头顶。它换了动作，收身从梁下通过。',t)
    else:
        tests=LEARNING['tests']
        note(c,f"测试完赛   {tests['before']}/{tests['total']}  →  {tests['after']}/{tests['total']}",t-2.48,color=GREEN,size=32)
        cap(c,'训练前后，测试用的是同一组陌生赛道。',t-2.48)


def boardwalk(c,t,explain=False):
    # Follow the painted reflections on the left of the deck. Both rails enclose the route.
    distance=(1-math.exp(-t*.16))/.16-1.22*(1-math.exp(-max(0.,t-2.1)*.27))
    y=703-distance*70
    x=475+(703-y)*.91+5*math.sin(t*.86)
    slip=13*(ease(3.42,3.73,t)-ease(3.80,4.53,t))
    x+=slip
    h=307-(703-y)*.63
    c.background('trail.png',1.026-.012*ease(0,9.6,t),(768,327))
    # Ripples remain attached to wet planks and disperse after the two successive contacts.
    for when in (3.46,4.02,4.58,5.14,5.70,6.26):
        age=t-when
        if 0<=age<=.68:
            at=(1-math.exp(-when*.16))/.16-1.22*(1-math.exp(-max(0.,when-2.1)*.27))
            yy=704-at*70
            xx=475+(703-yy)*.91+(-10 if when in (3.46,4.58,5.70) else 12)
            if age<.45:
                c.ellipse(xx,yy,6+43*age,1+7*age,(180,214,210),1.6)
            c.ellipse(xx,yy+2,7+49*age,1+8*age,(167,191,197),1.4)
    phase=min(t,2.1)/.73+max(0.,t-2.1)/1.12
    roll=.12*(ease(3.40,3.76,t)-ease(3.76,4.48,t))-.031*math.sin(t*1.3)
    c.ellipse(x,y+1,h*.145,max(2,h*.017),(131,102,78))
    running(c,'rear.png',x,y,h,phase,roll,1-.075*ease(2.,3.,t),Rig(4))
    label(c,'应用设想  ·  雨后栈道巡检',color=BLUE)
    if t<3.25:
        cap(c,'摄像头看见木板上的水痕，运动控制器让它放慢脚步。' if explain
            else '摄像头先看见木板上的水痕，机器人放慢脚步。',t)
    elif t<6.42:
        cap(c,'鞋底报滑移，IMU 报侧倾，运动控制器随即调整姿态。' if explain
            else '支撑脚开始滑动，鞋底反馈滑移，胸口的 IMU 测到侧倾。',t-3.25)
    else:
        cap(c,'它收短步幅，稳住重心，继续沿栈道巡检。',t-6.42)
    if t>9.12:
        c.rgb=cv.convertScaleAbs(c.rgb,alpha=1-.94*ease(9.12,9.60,t))


SHOTS=[
    (0,opening),(5,lambda c,t:pilot(c,t,rig=Rig(1))),
    (IMU,lambda c,t:install(c,t,'imu')),(BEND,bend_retry),(DAY,daylight),
    (NIGHT,lambda c,t:night_run(c,t,False)),(LIDAR,lambda c,t:install(c,t,'lidar')),
    (NIGHT_RETRY,lambda c,t:night_run(c,t,True)),(ROUGH,lambda c,t:uneven(c,t,False)),
    (SOLES,lambda c,t:install(c,t,'force')),(ROUGH_RETRY,lambda c,t:uneven(c,t,True)),
    (LEARN,early_learning),(PRACTICE,practice),(LEARN_RETRY,learned_hurdle),
    (FROZEN,lambda c,t:learned_hurdle(c,t,True)),(LOW,low_beam),(TRAIL,boardwalk)]


def frame(c,t):
    for start,draw in reversed(SHOTS):
        if t>=start:
            draw(c,t-start)
            return
