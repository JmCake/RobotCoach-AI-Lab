"""Stage the recorded short-course runs with the film's original painted cels."""
from functools import lru_cache
import json
import math
from pathlib import Path

import cv2 as cv
import numpy as np

from bend import shadow_ink
from athletic_cels import athletic_cel
from athletic_motion import Performance
from paint import Canvas, INK, WHITE, ease, plate

SOURCE = Path(__file__).parent
MOTION = json.loads((SOURCE / 'training-motion.json').read_text(encoding='utf-8'))['traces']
FLOOR, METER = 571, 169
GOLD = (255, 203, 71)
STEEL = (106, 131, 155)


def position(clip, tick):
    bounds = clip['film']
    tick = max(bounds['from'], min(bounds['from']+len(MOTION[clip['id']])-1, tick))
    return MOTION[clip['id']][tick - bounds['from']]


def screen_x(distance):
    return 324 + 62 * (1 - math.exp(-distance / 3.4)) + 6.4 * distance


def shade(c, x, y, rx, ry, opacity):
    ink = shadow_ink()
    h, w = ink.shape[:2]
    c.stamp(ink, [[2*rx/w, 0, x-rx], [0, 2*ry/h, y-ry]], opacity)


@lru_cache(maxsize=1)
def track_plate():
    image = plate('stadium.png')
    height = image.shape[0]
    # Rack focus on the lane. The canopy and original red track stay sharp.
    rows = np.arange(height, dtype=np.float32)[:,None,None]/height
    focus = np.clip((rows-.18)/.12,0,1)*np.clip((.632-rows)/.07,0,1)
    distant = cv.GaussianBlur(image, (0,0), 1.6)*.78 + np.float32([228,237,247])*.22
    return np.uint8(image*(1-focus)+distant*focus)


def track(c, distance, actor_x):
    image = track_plate()
    h,w=image.shape[:2]
    z=1.19
    mat=np.float32([[c.w/w*z,0,(1-z)*(224+33*distance)*c.s],
                    [0,c.h/h*z,(1-z)*365*c.s]])
    c.rgb=cv.warpAffine(image,mat,(c.w,c.h),flags=cv.INTER_LINEAR,borderMode=cv.BORDER_REPLICATE)
    # The starting line and the track marks belong to the ground. They travel
    # with the actual distance covered, independently of the distant grandstand.
    zero = actor_x - distance*METER
    if -145 < zero < 1350:
        c.poly([(zero-105, 623), (zero-92, 623), (zero+107, 515), (zero+94, 515)], (254,240,214))
    for marker in range(max(1, int(distance/2)-2), int(distance/2)+5):
        x = zero + marker*2*METER
        c.line([(x-23, 601), (x+4, 586)], (250,176,151), 3)


def ink_shape(c, points, fill, width=2):
    c.poly(points, fill)
    c.line(points, INK, width, True)


def obstacle(c, middle, data, front):
    # The near half can cover the near shin. The back post always stays
    # behind the runner. Height is measured where the crossbar meets its lane.
    beam = data['type'] == 'beam'
    level = FLOOR - data['height']*METER
    # The overhead gate stands on a shallow diagonal across the lane. Its
    # outward face is visible beside the visor when the two first meet.
    perspective = 47 if beam else -51
    x0, y0 = middle+perspective, FLOOR+21
    x1, y1 = middle-perspective, FLOOR-21
    depth = 72 if beam else 15
    # The hurdle's reported height is its upper edge, the beam's height its underside.
    bottom = level if beam else level+depth
    if not front:
        c.poly([(x0-12,y0+6),(x1-10,y1+4),(x1+64,y1+2),(x0+65,y0+4)], (132,53,73))
    px, py = (x0,y0) if front else (x1,y1)
    dx = px-middle
    slope = 21/perspective
    mounting = bottom + dx*slope
    ink_shape(c, [(px-20,py-2),(px+26,py-2),(px+37,py-7),(px-10,py-7)], (192,205,215))
    ink_shape(c, [(px-4,py-6),(px+5,py-7),(px+5,mounting-3),(px-4,mounting)], STEEL)
    c.line([(px-1,py-9),(px-1,mounting)], (231,240,245), 2)
    # Draw two seamlessly joined portions of the inked foam board.
    left = front == (perspective<0)
    span = abs(perspective)+4
    lo, hi = (-span, 0.) if left else (0., span)
    def p(u, v):
        return (middle+u, bottom+slope*u-depth+v)
    c.poly([p(lo,0),p(hi,0),p(hi,depth),p(lo,depth)], (27,36,59))
    # Clip the yellow diagonal markings to the exact face, including its mid-plane.
    shift, period, stripe = min(16, depth*.43), (33 if beam else 24), (19 if beam else 13)
    for i in range(-4, 4):
        u = i*period+4
        poly = np.float32([(u,2),(u+stripe,2),(u+stripe+shift,depth-2),(u+shift,depth-2)])
        bounds = np.float32([(lo,0),(hi,0),(hi,depth),(lo,depth)])
        area, clipped = cv.intersectConvexConvex(bounds, poly)
        if area > .05:
            c.poly([p(float(a),float(b)) for a,b in clipped[:,0]], GOLD)
    c.poly([p(lo,-4),p(hi,-4),p(hi,0),p(lo,0)], (255,232,158))
    for v in (-4, depth):
        c.line([p(lo,v), p(hi,v)], INK, 2.5)
    edge = lo if left else hi
    c.line([p(edge,-4),p(edge,depth)], INK, 3)


PERFORMANCES = {}


@lru_cache(maxsize=24)
def body_pose(performance,tick):
    return performance.sample(tick)


def actor(c,ax,clip,tick,lift):
    name=clip['id']
    if name not in PERFORMANCES:
        PERFORMANCES[name]=Performance(clip,MOTION[name])
    performer=PERFORMANCES[name]
    k=min(performer.first+len(performer.trace)-1,max(performer.first,tick))
    pose,floor=body_pose(performer,k)
    airborne=ease(.025,.91,lift)
    shade(c,ax+9,FLOOR+2,83-31*airborne,9-2*airborne,.95-.28*airborne)
    athletic_cel(c,pose,ax,floor,METER,FLOOR)


def draw(c, clip, tick):
    frame = position(clip,tick)
    distance = frame[0]
    ax = screen_x(distance)
    track(c,distance,ax)
    objects = [(ax+(o['x']-distance)*METER,o) for o in clip['obstacles']]
    visible = [(x,o) for x,o in objects if -100<=x<=1380]
    for x,o in visible:
        obstacle(c,x,o,False)
    hit = next((e for e in clip['events'] if e['kind']=='hit'),None)
    actor(c,ax,clip,tick,frame[1])
    for x,o in visible:
        obstacle(c,x,o,True)
    if hit and tick >= hit['t']:
        data = min(clip['obstacles'],key=lambda o:abs(o['x']-distance))
        bar_x = ax+(data['x']-distance)*METER
        bar_y = FLOOR-data['height']*METER
        if data['type']=='beam':
            bar_y -= 56
        # A small hand-inked contact burst leaves the limb and the rail readable.
        points=[]
        for i in range(18):
            a=i*math.pi/9
            r=(23 if i%4==0 else 15) if i%2==0 else 5
            points.append((bar_x+r*math.cos(a),bar_y+r*math.sin(a)))
        c.poly(points, (255,208,55))
        c.ellipse(bar_x,bar_y,3.5,3.,WHITE)


def inset(c, name, amount):
    # A second, ink-bordered panel enters only after the filmed action reaches
    # its contact/clearance. It never covers the full-body replay on the left.
    u=ease(0,.24,amount)
    if not u:
        return
    x,y,w,h = 782 + 530*(1-u), 200, 455, 313
    s=c.s
    x0,y0,x1,y1=round(x*s),round(y*s),round((x+w)*s),round((y+h)*s)
    if x0>=c.w or y0>=c.h:
        return
    art=plate(name)
    crop_w=round(art.shape[0]*w/h)
    left=max(0,(art.shape[1]-crop_w)//2)
    rgb=cv.resize(art[:,left:left+crop_w],(x1-x0,y1-y0),interpolation=cv.INTER_AREA)
    corners=[(x+24,y),(x+w,y),(x+w-22,y+h),(x,y+h)]
    c.poly([(a+5,b+6) for a,b in corners],INK)
    mask=np.zeros(rgb.shape[:2],np.uint8)
    p=np.int32([(round(a*s)-x0,round(b*s)-y0) for a,b in corners])
    cv.fillConvexPoly(mask,p,255,cv.LINE_AA)
    n=min(c.w,x1)-x0
    cv.copyTo(rgb[:,:n],mask[:,:n],c.rgb[y0:y1,x0:x0+n])
    c.line(corners,INK,8,True)
    c.line(corners,(251,245,223),4,True)


@lru_cache(maxsize=1)
def panel_canvas():
    return Canvas(1280)
