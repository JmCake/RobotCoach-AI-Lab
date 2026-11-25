"""Retarget full-body drawings to the logged run, takeoff, landing and duck."""
from bisect import bisect_right
from functools import lru_cache
import math

import numpy as np

from athletic_keys import (HIP, NECK, TOP, EAR, EYE, NK, NA, NT, NH,
                           FK, FA, FT, FH, NS, NE, NF, FS, FE, FF, key_points)
from athletic_cels import HEEL, TOE, direction, rotation
from paint import ease

PARENTS = [(HIP,NECK),(NECK,TOP),(NECK,EAR),(EAR,EYE),
           (HIP,NK),(NK,NA),(NA,NT),(NA,NH),(HIP,FK),(FK,FA),(FA,FT),(FA,FH),
           (NECK,NS),(NS,NE),(NE,NF),(NECK,FS),(FS,FE),(FE,FF)]
STRIDE = [(0,0),(.16,1),(.38,5),(.52,3),(.69,4),(.85,2),(1,0)]
LOW_STEP = [(0,0),(.24,1),(.50,2),(.75,3),(1,0)]
HURDLE = [(0,0),(.073,1),(.255,2),(.49,3),(.84,4),(1.025,5)]
LEGS = [(FK,FA,FT,FH),(NK,NA,NT,NH)]


def between(a,b,u):
    """Interpolate rotating bones about their axles, including a rolling sole."""
    if u<=0: return a.copy()
    if u>=1: return b.copy()
    result=np.zeros_like(a)
    for parent,child in PARENTS:
        x,y=a[child]-a[parent]
        xx,yy=b[child]-b[parent]
        turn=math.atan2(x*yy-y*xx,x*xx+y*yy)
        angle=math.atan2(y,x)+u*turn
        length=(1-u)*math.hypot(x,y)+u*math.hypot(xx,yy)
        result[child]=result[parent]+[length*math.cos(angle),length*math.sin(angle)]
    return result


@lru_cache(maxsize=20)
def key(group,n):
    return key_points(group,n)


def sequence(group, sequence_keys, t):
    i=max(0,min(len(sequence_keys)-2,bisect_right(sequence_keys,(t,100))-1))
    first,ka=sequence_keys[i]
    last,kb=sequence_keys[i+1]
    u=float(np.clip((t-first)/(last-first),0,1))
    # Preserve motion through intermediate keys; avoid stops at each drawing.
    return between(key(group,ka),key(group,kb),u)


def ground_steps(frames):
    """Keep each sole at one track position for its entire pressure interval."""
    result=np.zeros((len(frames),2,3))
    for i,flag in enumerate((8,11)):
        phase=(frames[:,2]+i*.5)%1
        planted=np.where(frames[:,1]>.045,phase<.51,frames[:,flag]>0)
        edges=np.flatnonzero(np.diff(np.r_[False,planted,False]))
        intervals=list(zip(edges[::2],edges[1::2]))
        anchors=[(frames[a,0]+frames[b-1,0])*.5+.065 for a,b in intervals]
        for j,((a,b),anchor) in enumerate(zip(intervals,anchors)):
            for n in range(a,b):
                result[n,i]=[anchor,(n-a)/max(1,b-a-1),0]
            end=intervals[j+1][0] if j+1<len(intervals) else len(frames)
            following=anchors[j+1] if j+1<len(anchors) else frames[-1,0]+.48
            for n in range(b,end):
                u=(n-b+1)/(end-b+1)
                result[n,i]=[anchor+(following-anchor)*ease(0,1,u),u,1]
        if intervals:
            a=intervals[0][0]
            for n in range(a):
                u=(n+1)/(a+1)
                result[n,i]=[(frames[0,0]-.28)*(1-u)+anchors[0]*u,u,1]
    return result


def running_boot(step,distance,crouch,height):
    track_x,u,swing=step
    if swing:
        angle=np.interp(u,[0,.25,.63,.88,1],[.63,.91,.28,-.22,-.17])
        clearance=(.315-.218*crouch)*math.sin(math.pi*u)**1.4
    else:
        angle=np.interp(u,[0,.19,.63,1],[-.17,0,0,.63])
        clearance=0.
    angle*=1-.40*crouch
    toe,heel=(rotation(angle)@np.array([TOE,HEEL]).T).T
    pivot,flat=(toe,TOE) if toe[1]>=heel[1] else (heel,HEEL)
    ankle=np.array([track_x-distance+flat[0]-(HEEL[0]+TOE[0])*.5-pivot[0],
                    height-clearance-pivot[1]])
    return ankle,angle


def set_leg(pose,leg,boot,angle,floor,tuck):
    knee,ankle,toe,heel=leg
    pads=(rotation(angle)@np.array([TOE,HEEL]).T).T
    boot[1]=min(boot[1],floor-max(pads[:,1]))
    length=max(.001,np.linalg.norm(boot))
    along_axis=boot/length
    # Straighten the links just short of toggle. The side view foreshortens
    # the thigh when a deep crouch sends the knee out of the sagittal plane.
    femur,tibia=.509-.092*tuck,.474-.052*tuck
    along=min(femur,(length*length+femur*femur-tibia*tibia)/(2*length))
    side=math.sqrt(max(0,femur*femur-along*along))
    k=along_axis*along+np.array([along_axis[1],-along_axis[0]])*side
    if tuck>0:
        # In a squat the knee travels slightly outwards around the chest.
        # Use the projected arc so it doesn't snap upwards as the ankle passes the hip.
        swing=math.tanh(boot[0]/.36)
        crouched=np.array([np.clip(.29+.18*swing,boot[0]-.40,boot[0]+.42),
                           .15-.13*swing+.22*(boot[1]-.24)])
        k+=(crouched-k)*(.86*tuck)
    if k[1]>floor-.16:
        k[1]=floor-.16
        k[0]=boot[0]+math.sqrt(max(0.,tibia*tibia-(k[1]-boot[1])**2))
    pose[knee]=k
    pose[ankle]=boot
    pose[toe],pose[heel]=boot+pads


def jump_windows(clip):
    events=clip['events']
    windows=[]
    for event in events:
        if event['kind']!='jump':continue
        start=event['t']
        land=next((e['t'] for e in events if e['t']>start and e['kind']=='land'),None)
        # All completed jumps use the same 95-tick actuator arc. A logged
        # collision can end a run before the final part of that arc is played.
        windows.append((start,land if land is not None else start+95))
    return windows


class Performance:
    def __init__(self,clip,trace):
        self.first=clip['film']['from']
        self.trace=np.asarray(trace)
        self.feet=ground_steps(self.trace)
        self.jumps=[]
        self.beams=[obstacle['x'] for obstacle in clip['obstacles'] if obstacle['type']=='beam']
        for start,land in jump_windows(clip):
            if land+18<self.first or start>self.first+len(trace)-1:
                continue
            take=self.trace[int(np.clip(start-1-self.first,0,len(trace)-1))]
            lead=0 if take[11] else 1
            if self.first<=land<self.first+len(trace):
                contact=self.trace[land-self.first]
                if contact[8]!=contact[11]:
                    lead=int(contact[11])
            self.jumps.append((start,land,lead))
        self.hit=next((e for e in clip['events'] if e['kind']=='hit'),None)
        self.bar=(min(clip['obstacles'],key=lambda b:abs(b['x']-self.hit['x'])) if self.hit else None)
        if self.hit and self.first<=self.hit['t']<self.first+len(trace):
            feet=self.feet[self.hit['t']-self.first,:,0]
            self.front_at_hit=int(feet[1]>feet[0])

    def sample(self,tick):
        n=int(np.clip(tick-self.first,0,len(self.trace)-1))
        tick=self.first+n
        distance,lift,cycle=self.trace[n,:3]
        phase=(cycle+.5)%1.
        crouch=ease(.13,.91,self.trace[max(0,n-3):n+1,3].mean())
        pose=between(sequence('run',STRIDE,phase),sequence('low',LOW_STEP,phase),crouch)
        for i,(sh,el,hand) in enumerate(((FS,FE,FF),(NS,NE,NF))):
            swing=math.cos(math.tau*(phase+(1-i)*.5+.05))
            upper=1.84+.86*swing
            fore=upper-1.77-.14*max(0.,swing)
            upper+=(1.89+.65*swing-upper)*crouch
            fore+=(-.83+.20*swing-fore)*crouch
            pose[el]=pose[sh]+np.array([math.cos(upper),math.sin(upper)])*.304
            pose[hand]=pose[el]+np.array([math.cos(fore),math.sin(fore)])*.344
        height=(.825+.026*math.cos(phase*math.tau*2))*(1-crouch)+(.452+.013*math.sin(phase*math.tau*2))*crouch
        jump_weight=0.
        stage=None
        lead=1
        for start,land,lead in self.jumps:
            if start<=tick<=land+17:
                stage=(tick-start)/(land-start)
                jump_weight=ease(start-1,start+9,tick)*(1-ease(land+1,land+17,tick))
                jump=sequence('jump',HURDLE,stage)
                if lead==0:
                    near=[NK,NA,NT,NH,NS,NE,NF]
                    far=[FK,FA,FT,FH,FS,FE,FF]
                    jump[near+far]=jump[far+near]
                pose=between(pose,jump,jump_weight)
                hip=np.interp(stage,[0,.09,.30,.62,.87,.99,1.045,1.18],
                                    [.82,.88,.92,.92,.87,.84,.743,.84])
                height+=(hip-height)*jump_weight
                break
        floor=height+lift
        for beam_x in self.beams:
            ahead=beam_x-distance
            upright=(1-ease(.65,3.0,ahead))*ease(-.64,-.16,ahead)*(1-crouch)*(1-jump_weight)
            if upright:
                # The painted visor is deeper than the simulation's head marker.
                # Square the upper body on an upright approach so its nose meets
                # the beam at the recorded contact. A duck keeps its forward lean.
                neck=pose[NECK].copy()
                pose[NECK]+=upright*(np.array([-.064,-.562])-neck)
                pose[[TOP,EAR,EYE,NS,NE,NF,FS,FE,FF]]+=pose[NECK]-neck
        for i,leg in enumerate(LEGS):
            knee,ankle,toe,heel=leg
            run,angle=running_boot(self.feet[n,i],distance,crouch,height)
            if stage is not None and stage<.08 and i!=lead:
                run[1]+=lift*(1-ease(.012,.075,stage))
            boot=run.copy()
            if stage is not None:
                target=jump[ankle].copy()
                target*=min(1.,.991/max(.001,np.linalg.norm(target)))
                tilt=direction(jump[toe]-jump[heel])-direction(TOE-HEEL)
                if i==lead and stage>.80 and self.first<=land<self.first+len(self.trace):
                    # The arriving foot reaches the patch of track where its
                    # pressure switch closes, and stays there as the hip passes.
                    landing_x=self.feet[land-self.first,i,0]
                    anchor=np.array([landing_x-distance-(TOE[0]+HEEL[0])*.5,height-HEEL[1]])
                    if tick>=land:
                        anchor=run
                    settle=ease(.85,1.,stage)
                    target+=(anchor-target)*settle
                    landing_angle=angle if tick>=land else -.09
                    tilt+=(landing_angle-tilt)*settle
                if i!=lead and stage>1.04:
                    recover=ease(1.04,1.12,stage)
                    target+=(run-target)*recover
                    tilt+=(angle-tilt)*recover
                boot+=(target-boot)*jump_weight
                angle+=(tilt-angle)*jump_weight
            set_leg(pose,leg,boot,angle,floor,crouch*(1-jump_weight))
        if self.hit and self.hit['part']=='小腿':
            u=ease(self.hit['t']-12,self.hit['t'],tick)
            if u:
                dx=self.bar['x']-self.hit['x']
                # If the jump was early, it is the trailing shin which clips
                # the bar on descent. Running straight into it hits the front leg.
                idx=1-lead if dx<0 else self.front_at_hit
                knee,ankle,toe,heel=LEGS[idx]
                surface=np.array([dx,floor-self.bar['height']])
                radius=np.linalg.norm(surface)
                radial=surface/radius
                contact_length=max(.29,radius-.509+.002)
                along=(.509**2+radius**2-contact_length**2)/(2*radius)
                k=radial*along+np.array([radial[1],-radial[0]])*math.sqrt(max(0.,.509**2-along**2))
                boot=k+(surface-k)*(.474/contact_length)
                pose[knee]+=(k-pose[knee])*u
                delta=(boot-pose[ankle])*u
                delta[1]-=max(0.,max(pose[toe,1],pose[heel,1])+delta[1]-floor)
                pose[[ankle,toe,heel]]+=delta
        return pose,floor
