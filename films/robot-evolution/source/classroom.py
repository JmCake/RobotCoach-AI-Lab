"""The action-selection lesson. All playheads index the recorded classroom runs."""
from bisect import bisect_right
from functools import lru_cache
import json
import math
from pathlib import Path

import cv2 as cv
import numpy as np

from evolution import (AMBER, BLUE, GREEN, RED, VIOLET, DAY, LEARN as RULE,
                       boardwalk, daylight, frame as hardware_frame, label, opening)
from hardware import Rig
from paint import CYAN, INK, WHITE, ease, font
from pilot import ATHLETE
import comic_training as comic

HANDOVER, EARLY, FORWARD, EXPLORE, SCORES = 64.9,70.,76.1,83.1,90.
MATCH, BEAM_HIT, BEAM_PASS, TEST, REPORT, TRAIL, LENGTH = 94.9,101.9,106.1,111.4,118.6,122.6,132.2
LOG=json.loads(Path(__file__).with_name('training-takes.json').read_text(encoding='utf-8'))
CLIPS=LOG['clips']
NAVY=(17,28,49)
PAPER=(242,243,233)
TYPE={'hurdle':'矮栏','beam':'低梁'}

# Screen seconds and actual 1/120 s physics ticks. Repeated ticks are editorial
# holds on a real decision or contact. The left side of MATCH stays on its last hit.
TAKES={
    RULE:('rule',[(0,267),(1.28,324),(1.48,324),(2.55,357),(3.3,388),(4.15,420),(5.,446)]),
    EARLY:('r3',[(0,275),(.82,288),(1.17,288),(2.55,329),(3.25,346),(4.12,367),(4.48,373),(6.1,373)]),
    FORWARD:('r6',[(0,0),(.83,22),(.83,320),(2.33,348),(2.83,348),(3.57,360),(4.30,371),(7.,371)]),
    EXPLORE:('r7',[(0,0),(.83,22),(.83,330),(1.69,348),(2.06,348),(3.55,390),(5.55,444),(6.90,469)]),
    MATCH:('r36',[(0,311),(1.42,348),(1.73,348),(2.72,371),(3.42,388),(4.58,414),(5.73,444),(7.,465)]),
    BEAM_HIT:('r36',[(0,465),(1.50,500),(2.70,532),(4.2,532)]),
    BEAM_PASS:('r246',[(0,477),(1.15,492),(1.45,492),(3.20,532),(4.10,549),(5.30,587)]),
    TEST:('test',[(0,263),(1.65,324),(2.65,366),(3.85,420),(4.52,456),(6.25,544),(7.2,580)])}


def physical_tick(points,local):
    return int(round(float(np.interp(local,[x for x,_ in points],[y for _,y in points]))))


def screen_time(points,tick):
    for (a,first),(b,last) in zip(points,points[1:]):
        if b>a and first<=tick<=last:
            return a if first==last else a+(b-a)*(tick-first)/(last-first)
    return None


def still(clip,tick):
    c=comic.panel_canvas()
    replay(c,clip,tick)
    return c.rgb


def replay(c,clip,tick):
    comic.draw(c,CLIPS[clip],tick)


def window(c,art,box,source):
    x,y,w,h=box
    sx,sy,sw,sh=source
    ah,aw=art.shape[:2]
    area=art[round(sy*ah/720):round((sy+sh)*ah/720),round(sx*aw/1280):round((sx+sw)*aw/1280)]
    l,t,r,b=round(x*c.s),round(y*c.s),round((x+w)*c.s),round((y+h)*c.s)
    c.rgb[t:b,l:r]=cv.resize(area,(r-l,b-t),interpolation=cv.INTER_LINEAR)


def lower(c,headline,detail,color=CYAN):
    w=min(1229, max(550,font(29).getlength(headline)+73,font(22).getlength(detail)+76))
    box=[(33,613),(w+21,613),(w+4,700),(19,700)]
    c.poly([(x+5,y+6) for x,y in box],INK)
    c.poly(box,(251,247,231))
    c.line(box,INK,3,True)
    c.poly([(34,615),(43,615),(29,698),(21,698)],color)
    c.text(headline,52,623,29,INK)
    c.text(detail,50,665,22,(53,65,83))


def header(c,words,color=CYAN):
    label(c,words,35,30,color,24)


def instruments(c,clip,k):
    typ,cm,speed,tilt,feet,_=CLIPS[clip]['signals'][k]
    x,y=957,25
    w,h=292,124
    shape=[(x+8,y),(x+w,y),(x+w-5,y+h),(x,y+h)]
    c.poly([(a+4,b+4) for a,b in shape],INK)
    c.poly(shape,(244,242,226))
    c.line(shape,INK,2,True)
    c.poly([(x+10,y+2),(x+w-2,y+2),(x+w-3,y+28),(x+8,y+28)],NAVY)
    c.text('此刻的传感器读数',x+18,y+3,17,WHITE)
    if not typ:
        obstacle='探测范围内无障碍'
    elif cm<0:
        obstacle=('矮栏' if typ==1 else '低梁')+'已到身侧'
    else:
        obstacle=f"{'矮栏' if typ==1 else '低梁'}  {cm/100:.1f} 米"
    c.text('雷达',x+16,y+34,17,(109,59,139))
    c.text(obstacle,x+71,y+32,19,INK)
    c.text('IMU',x+16,y+65,17,(139,78,32))
    c.text(f'{speed/100:.1f} 米/秒   倾角 {tilt}°',x+71,y+63,18,INK)
    c.text('足底',x+16,y+94,17,(29,103,80))
    c.text(('双脚离地','单脚支撑','双脚支撑')[feet],x+71,y+92,19,INK)


def stamp(c,words,color):
    label(c,words,36,90,color,31)


@lru_cache(maxsize=8)
def ticks(clip):
    return [s['t'] for s in CLIPS[clip]['steps']]


def decision(clip,tick):
    return CLIPS[clip]['steps'][max(0,bisect_right(ticks(clip),tick)-1)]


def reading(s):
    return f"选择动作时     {TYPE[s['type']]} {s['distance']:.2f} 米     IMU 测速 {s['speed']:.2f} 米/秒     足底{'已着地' if s['support'] else '已离地'}"


def score(value):
    return f'{value:.2f}'.replace('-','−')


def rule(c,t,k):
    replay(c,'rule',k)
    header(c,'越障演示  /  人写的规则',AMBER)
    at=decision('rule',324)
    if k<324:
        lower(c,'先看原来的程序怎样跨栏。','传感器报告前方的栏距、身体速度和脚是否着地。',AMBER)
    elif k<420:
        stamp(c,'规则发令  ·  起跳',AMBER)
        lower(c,'人写好条件，栏够近、脚已着地就起跳。',reading(at),AMBER)
    else:
        lower(c,'前脚落地，膝盖屈一下，再迈出下一步。','起跳时机由规则给出，落脚和恢复跑姿由运动控制器执行。',AMBER)


def handover(c,t):
    c.background('bay.png',1.07+.035*ease(0,5.1,t),(840,333))
    rig=Rig(4)
    h=565+23*ease(0,5.1,t)
    c.ellipse(971,608,80,9,(30,31,62))
    ATHLETE.draw(c,971,608,h,t*.42,.045,head_turn=.11*math.sin(t),rig=rig)
    label(c,'强化学习  /  动作选择',43,72,CYAN,23)
    c.text('让它自己找起跳时机',41,154,51,WHITE,2,INK)
    c.text('四件传感器继续工作，原控制器照管平衡和落脚。',46,249,25,WHITE,1,INK)
    c.text('撤下越障规则，动作评分从零开始。',46,301,27,CYAN,1,INK)
    if t>.96:
        for i,word in enumerate(('前进','起跳','下蹲')):
            xx=46+i*192
            label(c,word+'    0',xx,398,AMBER if i==1 else BLUE,30)
    lower(c,'训练时可以试不同的动作。','碰栏扣 12 分，越过一个障碍加 8 分。下一轮从起点跑，保留学到的评分。')


def early(c,t,k):
    replay(c,'r3',k)
    header(c,'训练节选  /  第 3 轮')
    if k<288:
        lower(c,'矮栏已经进入雷达的探测范围。','动作表还在探索。看看这次从哪里起跳。')
    elif k<373:
        stamp(c,'随机探索  ·  起跳' if k<=299 else ('仍在上升' if k<337 else '已经下落'),VIOLET)
        lower(c,'这次在离栏较远时就跳了。',reading(decision('r3',288)),VIOLET)
    else:
        stamp(c,'小腿碰栏  −12',RED)
        lower(c,'跳早了。前脚过去，后面的小腿在下落时碰栏。','这一轮到这里结束。下一轮会从起点再跑。',RED)


def forward(c,t,k):
    replay(c,'r6',k)
    header(c,'第 6 轮  /  从起点重跑' if k<=22 else '第 6 轮  /  栏前慢放')
    if k<348:
        lower(c,'第 6 轮，从起点重跑。','看栏前的最后几步。雷达持续测距，足底传感器报告哪只脚着地。')
    elif k<371:
        stamp(c,'选择前进',AMBER)
        lower(c,'栏就在前面，脚也已着地，这次它继续跑。',reading(decision('r6',348)),AMBER)
    else:
        s=decision('r6',360)
        comic.inset(c,'shin-contact.png',t-screen_time(TAKES[FORWARD][1],371))
        stamp(c,'小腿碰栏  −12',RED)
        lower(c,f"上一次选动作时，距栏 {s['distance']:.2f} 米。它继续跑，随即碰栏。",
              f"把这次结果记回动作表。这种情况下，“前进”的评分由 {score(s['before'])} 降到 {score(s['after'])}。",RED)


def explore(c,t,k):
    replay(c,'r7',k)
    header(c,'第 7 轮  /  从起点重跑' if k<=22 else '第 7 轮  /  栏前慢放')
    if k<348:
        lower(c,'回到起点，再试一次。','栏架位置略有变化，控制平衡和落脚的程序照常运行。')
    elif k<390:
        stamp(c,'随机探索  ·  这次试跳' if k<=359 else '双脚腾空',VIOLET)
        lower(c,'在相近的距离，这一轮试了另一个动作。',reading(decision('r7',348)),VIOLET)
    elif k<444:
        stamp(c,'通过第一道栏  +8',GREEN)
        lower(c,'前脚伸过栏，后腿收起，两条腿都过去了。','越栏这一步得到奖励。这个结果会影响以后在相近栏距时的选择。',GREEN)
    else:
        stamp(c,'落地  ·  继续跑',GREEN)
        lower(c,'前脚踩实，屈膝接住身体，再换另一条腿向前。','足底传感器重新测到支撑，运动控制器接回跑步节奏。',GREEN)


def score_history(c,t):
    # Keep the seventh take moving on the left while tracing real visits to one Q-table cell.
    c.rgb[:]=PAPER
    k=round(np.interp(t,[0,1.1,2.6,4.15,4.9],[330,348,390,444,469]))
    c.poly([(31,141),(617,141),(617,546),(31,546)],INK)
    window(c,still('r7',k),(28,137,582,402),(158,60,810,559))
    c.line([(28,137),(610,137),(610,539),(28,539)],INK,3,True)
    label(c,'同一类读数  /  起跳评分怎样改变',36,38,VIOLET,25)
    c.text('第 7 轮 · 起跳回看',45,153,23,WHITE,2,INK)
    c.text('脚已着地，矮栏在约 1.3～1.9 米处',650,143,27,INK)
    c.text('同一速度档，每个点是一笔实际更新',652,195,19,(65,79,98))
    history=[a for a in LOG['jumpHistory'] if 7<=a['attempt']<=34]
    def xy(a):
        return (666+(a['attempt']-7)*19,474-a['after']*87)
    c.line([(665,264),(665,475),(1190,475)],(88,117,139),2)
    progress=7+27*ease(.23,3.43,t)
    visible=[a for a in history if a['attempt']<=progress]
    if len(visible)>1:
        c.line([xy(a) for a in visible],(116,67,150),3)
    for a in visible:
        x,y=xy(a)
        c.ellipse(x,y,4.1,4.1,(116,67,150))
        if a['attempt'] in (7,17,34):
            c.text(score(a['after']),x,y-34,21,INK,align=.5)
    for n in (7,17,34):
        c.text(f'第 {n} 轮',666+(n-7)*19,493,18,(65,79,98),align=.5)
    lower(c,'程序每走一步，都用结果更新刚才那个选择。',
          '下一步有好结果，也会提高前一步的评分。反复遇到相近的栏距，起跳的分数逐渐变高。',VIOLET)


def matched(c,t,k):
    c.rgb[:]=PAPER
    at=decision('r6',348)
    c.text('同一道栏，同一组传感器读数',36,31,38,INK)
    c.text(reading(at),39,96,23,(65,79,98))
    for x,id,tag in [(16,'r6','第 6 轮'),(650,'r36','第 36 轮')]:
        old=id=='r6'
        window(c,still(id,k),(x,153,614,401),(194,64,834,545))
        c.line([(x,153),(x+614,153),(x+614,554),(x,554)],INK,3,True)
        label(c,tag,x+14,167,AMBER if old else CYAN,22)
        if t>=1.42:
            act=('碰栏  −12' if k>=371 else '前进') if old else ('落地续跑' if k>=444 else ('越栏  +8' if k>=388 else '起跳'))
            label(c,act,x+14,495,RED if old and k>=371 else (AMBER if old else GREEN),24)
    q=decision('r36',348)['q']
    lower(c,'同样的栏距，先看两边脚下会发生什么。' if k<348 else '第 6 轮继续跑，第 36 轮按最高分选择起跳。',
          f'此时动作表里的评分     前进  {score(q[0])}         起跳  {score(q[1])}         下蹲  {score(q[2])}',GREEN)


def beam_lesson(c,t,k,success):
    clip='r246' if success else 'r36'
    replay(c,clip,k)
    if success and k>=532:
        comic.inset(c,'beam-clearance.png',t-screen_time(TAKES[BEAM_PASS][1],532))
    header(c,'低梁再试  /  第 246 轮' if success else '继续看第 36 轮  /  第二个障碍',GREEN if success else AMBER)
    if not success:
        if k<532:
            lower(c,'刚过了矮栏，前面换成低梁。','雷达报出低梁，动作表仍然选前进，身体保持直立。',AMBER)
        else:
            stamp(c,'头部碰梁  −12',RED)
            lower(c,'跨栏会了，过低梁还会碰头。','这次失败也写进动作表。接下来还要练什么时候开始蹲、要蹲多久。',RED)
    elif k<492:
        lower(c,'重跑第 36 轮的这根低梁。','身体仍由相同的姿态控制程序保持平衡。',GREEN)
    elif k<549:
        stamp(c,'选择下蹲  ·  屈膝过梁',GREEN)
        lower(c,'先屈膝压低头顶，再交替迈步从梁下钻过。',reading(decision('r246',492)),GREEN)
    else:
        stamp(c,'低梁通过  +8',GREEN)
        lower(c,'头部从梁下通过，随后重新站起。','策略刚刚学到的是在低梁前连续收身。',GREEN)


def test(c,t,k):
    replay(c,'test',k)
    header(c,'冻结测试  /  新赛道',GREEN)
    if k<366:
        lower(c,'训练满 300 轮，锁住动作表，换一条没练过的赛道。',
              '硬件和运动控制器照常工作。测试中关掉随机探索，也停止改分。',GREEN)
        if k>=324:
            stamp(c,'选择起跳',GREEN)
    else:
        if k>=544:
            stamp(c,'低梁通过',GREEN)
        elif k>=408 and decision('test',k)['action']==2 and CLIPS['test']['signals'][k][5]>55:
            stamp(c,'选择下蹲',GREEN)
        lower(c,'先跨矮栏，再收身通过低梁。','策略用传感器读数选动作，运动控制器负责执行、落脚和扶稳身体。',GREEN)


def report(c,t):
    c.background('bay.png',1.10,(732,339))
    ATHLETE.draw(c,1008,628,526,t*.38,.04,head_turn=.07*math.sin(t),rig=Rig(4))
    label(c,'同样四件传感器  /  同一组测试赛道',44,55,GREEN,23)
    c.text('谁来发越障指令',42,130,43,WHITE,2,INK)
    stats=LOG['results']
    for i,(name,key,tint) in enumerate([('人写的规则','rules',BLUE),('空白动作表','empty',AMBER),('学到的动作表','trained',GREEN)]):
        y=223+i*95
        c.text(name,53,y,29,WHITE,1,INK)
        c.text(f"{stats[key]} / {stats['total']} 条完赛",353,y,31,tint,2,INK)
    lower(c,'两种办法都能完成这组测试。','规则由人给出时机。强化学习从试错中学到时机，走稳和落地仍交给原控制器。',GREEN)


STARTS=[RULE,HANDOVER,EARLY,FORWARD,EXPLORE,SCORES,MATCH,BEAM_HIT,BEAM_PASS,TEST,REPORT,TRAIL]
SCENES={RULE:rule,EARLY:early,FORWARD:forward,EXPLORE:explore,MATCH:matched,
        BEAM_HIT:lambda c,t,k:beam_lesson(c,t,k,False),
        BEAM_PASS:lambda c,t,k:beam_lesson(c,t,k,True),TEST:test}


def frame(c,t):
    if t<RULE:
        if t<5:
            opening(c,t,True)
        elif DAY<=t<33.8:
            daylight(c,t-DAY,True)
        else:
            hardware_frame(c,t)
        return
    start=STARTS[bisect_right(STARTS,t)-1]
    local=t-start
    if start in TAKES:
        clip,points=TAKES[start]
        k=physical_tick(points,local)
        SCENES[start](c,local,k)
        if start!=MATCH:
            instruments(c,clip,k)
    elif start==HANDOVER:
        handover(c,local)
    elif start==SCORES:
        score_history(c,local)
    elif start==REPORT:
        report(c,local)
    else:
        boardwalk(c,local,True)
