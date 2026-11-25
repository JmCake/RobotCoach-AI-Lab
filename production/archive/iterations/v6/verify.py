from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import sys
import numpy as np
import cv2 as cv

work=Path(__file__).resolve().parent
film=work.parents[1]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(film/'source'))
from export import encoder
from paint import Canvas
from classroom import frame,TAKES,CLIPS,FORWARD,EXPLORE,MATCH,screen_time
from comic_training import MOTION
from athletic_motion import Performance,LEGS
from athletic_cels import RECTS,piece,rotation,direction
from athletic_keys import NECK,EYE,EAR
cv.setNumThreads(2)
old=film/'robot-evolution-v5.mp4'
new=work/'master.mp4'
long=work/'training.mp4'
trial=work/'trials.mp4'
action=work/'action.mp4'
ffbin=encoder()

def ff(*args):
    return subprocess.check_output([ffbin,'-nostdin','-loglevel','error','-xerror',*map(str,args)])

def hashes(path):
    raw=ff('-i',path,'-map','0:v:0','-fps_mode','passthrough','-f','framemd5','-')
    return [line.split(',')[-1] for line in raw.decode().splitlines() if not line.startswith('#')]

def rgb(path,n,w,h):
    buf=ff('-ss',f'{n/30:.9f}','-i',path,'-map','0:v:0','-frames:v',1,'-vf','scale=in_color_matrix=bt709',
           '-pix_fmt','rgb24','-f','rawvideo','-')
    return np.frombuffer(buf,np.uint8).reshape(h,w,3)

def geometry():
    assert len(MOTION)==7 and sum(map(len,MOTION.values()))==1937
    for start in (FORWARD,EXPLORE):
        assert all(screen_time(TAKES[start][1],n) is None for n in (24,37,120,157,181,252))
    p=Performance(CLIPS['r7'],MOTION['r7'])
    jump=next(j for j in p.jumps if j[0]==349)
    start,land,lead=jump
    def sole(k,i):
        q,h=p.sample(k)
        kn,an,tt,he=LEGS[i]
        return h-max(q[tt,1],q[he,1])
    assert land==444 and min(sole(349-1,i) for i in (0,1))<.001
    assert min(sole(390,i) for i in (0,1))>1.1
    assert max(abs(sole(k,lead)) for k in range(444,451))<.001
    anklex=[]
    for tick in range(444,451):
        q,h=p.sample(tick)
        i=p.first
        anklex.append(float(q[LEGS[lead][1],0]+p.trace[tick-i,0]))
    assert np.ptp(anklex)<.023,anklex
    assert sole(468,1-lead)<.004
    for name in ('r3','r6'):
        p=Performance(CLIPS[name],MOTION[name]);evt=p.hit
        q,h=p.sample(evt['t'])
        target=np.array([p.bar['x']-evt['x'],h-p.bar['height']])
        d=[]
        for kn,an,_,_ in LEGS:
            v=q[an]-q[kn];u=np.clip((target-q[kn])@v/(v@v),0,1)
            d.append(np.linalg.norm(target-q[kn]-u*v))
        assert min(d)<.018,(name,d)
    x,y,_,_=RECTS['head']
    vy,vx=np.nonzero(piece('head')[:,:,3]>150)
    points=np.stack([vx+x-233,vy+y-377])*.00157
    def helmet(n,t):
        q,h=n.sample(t);neck=q[NECK]*(.565/np.linalg.norm(q[NECK]))
        angle=np.clip(direction(q[EYE]-q[EAR])-.07,-.14,.30)
        v=(rotation(angle)@points).T+neck
        return v[:,0],h-v[:,1]
    hit=Performance(CLIPS['r36'],MOTION['r36'])
    gap=[]
    for k in range(527,533):
        xs,hs=helmet(hit,k);front=xs[(hs>=1.23)&(hs<=1.65)].max()
        gap.append(hit.bar['x']-hit.trace[k-hit.first,0]-front)
    assert min(gap[:-1])>0 and -.03<gap[-1]<=0
    duck=Performance(CLIPS['r246'],MOTION['r246'])
    beam=CLIPS['r246']['obstacles'][1]
    clearance=[]
    for k in range(510,557):
        xs,hs=helmet(duck,k)
        at_bar=np.abs(xs+duck.trace[k-duck.first,0]-beam['x'])<.026
        if at_bar.any():
            clearance.append(beam['height']-hs[at_bar].max())
        q,h=duck.sample(k)
        assert min(h-q[kn,1] for kn,_,_,_ in LEGS)>.15
    assert .02<min(clearance)<.15,clearance
    left=next(s for s in CLIPS['r6']['steps'] if s['t']==348)
    right=next(s for s in CLIPS['r36']['steps'] if s['t']==348)
    assert left['distance']==right['distance'] and [left['action'],right['action']]==[0,1]
    return {'landing':land,'shinContacts':[373,371],'visorContactTick':532,'beamGapInIllustration':round(min(clearance),3)}

def info(path,w,h,n):
    cap=cv.VideoCapture(str(path))
    assert cap.isOpened()
    values=[int(cap.get(3)),int(cap.get(4)),int(cap.get(5)),int(cap.get(7))]
    cap.release()
    assert values==[w,h,30,n],(path,values)

def err(a,b):
    return np.abs(a.astype(np.int16)-b.astype(np.int16)).mean()

def media():
    cuts=[(new,1920,1080,3966),(long,1920,1080,1881),(trial,1280,720,1110),(action,1280,720,675)]
    for cut in cuts:info(*cut)
    with ThreadPoolExecutor(max_workers=3) as pool:
        first,second,inside=pool.map(hashes,[old,new,long])
    assert len(first)==len(second)==3966 and len(inside)==1881
    assert first[:1797]==second[:1797] and first[3678:]==second[3678:]
    assert inside==second[1797:3678]
    for p,_,_,_ in cuts:
        ff('-i',p,'-map','0:a:0','-f','null','-')
    for p in (trial,action):
        ff('-i',p,'-map','0:v:0','-f','null','-')
    c=Canvas(1920)
    errors=[]
    for t in (59.9,61.9,70.8,74.7,80.78,83.94,85.83,88.85,90.1,96.33,100.79,104.62,109.43,110.84,116.94):
        n=round(t*30);frame(c,n/30)
        errors.append(err(c.rgb,rgb(new,n,1920,1080)))
    assert max(errors)<5.4,errors
    preview_errors=[]
    for path,sections in [(trial,[(1947,1110)]),(action,[(2100,183),(2493,207),(3057,285)])]:
        offset=0
        for start,count in sections:
            for delta in (0,1,count//2,count-1):
                preview=rgb(path,offset+delta,1280,720)
                master=rgb(new,start+delta,1920,1080)
                preview_errors.append(err(preview,cv.resize(master,(1280,720),interpolation=cv.INTER_AREA)))
            offset+=count
    assert max(preview_errors)<4.6,preview_errors
    return {'frames':[c[3] for c in cuts],'matchingOriginalFrames':2085,'trainingPreviewMatches':1881,
            'maxSourceFrameError':round(max(errors),2),'maxExcerptFrameError':round(max(preview_errors),2)}

if __name__=='__main__':
    print(json.dumps(geometry()),flush=True)
    if '--geometry' not in sys.argv:
        print(json.dumps(media()),flush=True)
