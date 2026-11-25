"""Original stereo foley and location ambience, leaving space for a teacher's voice."""
import math
import wave
import numpy as np

from bend import PALM, PLANT
from film import SENSE, CONTROL, LEARN, DECIDE, TRAIL


def recorded_cues(shoe,tone,sweep):
    from classroom import (TAKES, CLIPS, MATCH, FORWARD, EXPLORE, HANDOVER, REPORT,
                           SCORES, TEST, screen_time)
    for start,(name,points) in TAKES.items():
        clip=CLIPS[name]
        for tick,side in clip['contacts']:
            when=screen_time(points,tick)
            if when is not None:
                shoe(start+when,-1 if side==0 else 1,.55)
        for event in clip['events']:
            when=screen_time(points,event['t'])
            if when is None:
                continue
            t=start+when
            if event['kind']=='jump':
                shoe(t,-1,1.04)
                sweep(t+.05,.33,.051)
            elif event['kind']=='land':
                shoe(t,1,1.17)
            elif event['kind']=='hit':
                shoe(t,1,1.22)
                tone(t,196,76,.22,.13)
            elif event['kind']=='pass':
                tone(t,617,699,.13,.088)
                tone(t+.095,917,1004,.19,.064)
    old_hit=next(e['t'] for e in CLIPS['r6']['events'] if e['kind']=='hit')
    when=screen_time(TAKES[MATCH][1],old_hit)
    tone(MATCH+when,175,76,.18,.11,-.54)
    for t in (FORWARD,EXPLORE):
        tone(t+.04,524,393,.135,.07)
        tone(t+.19,392,395,.15,.05)
    for t in (HANDOVER,SCORES,TEST,REPORT):
        sweep(t-.07,.2,.044)


def teaching_cues(steps,shoe,tone,sweep,recorded=False):
    from evolution import (IMU,BEND,DAY,NIGHT,LIDAR,NIGHT_RETRY,ROUGH,SOLES,ROUGH_RETRY,
                           LEARN,PRACTICE,LEARN_RETRY,FROZEN,LOW,TRAIL,LENGTH)
    for start,frequency in ((IMU,560),(LIDAR,815),(SOLES,415)):
        sweep(start+.23,.68,.054)
        shoe(start+1.34,1,.72)
        tone(start+1.34,frequency,frequency*1.38,.17,.095)
        tone(start+1.46,frequency*1.5,frequency*1.53,.12,.052)
    steps(BEND,DAY,.33,.82)
    shoe(DAY+.24,-1,1.08)
    shoe(DAY+2.06,1,1.18)
    steps(NIGHT,NIGHT+3.10,.33,.61)
    steps(NIGHT_RETRY,NIGHT_RETRY+2.05,.33,.62)
    for when in (.10,.61,1.14,1.65):
        tone(NIGHT_RETRY+when,1460,1510,.065,.067,-.19)
        tone(NIGHT_RETRY+when+.10-.025*when,1180,1250,.065,.040,.36)
    shoe(NIGHT_RETRY+2.05,-1,1.18)
    sweep(NIGHT_RETRY+2.14,.72,.041)
    shoe(NIGHT_RETRY+4.22,1,1.30)
    steps(NIGHT_RETRY+4.56,ROUGH,.33,.72)
    for start in (ROUGH,ROUGH_RETRY):
        steps(start,start+1.49,.355,.63)
        shoe(start+1.53,1,1.38)
        sweep(start+1.55,.28,.069)
    shoe(ROUGH+1.84,-1,.9)
    steps(ROUGH_RETRY+1.94,LEARN,.52,.7)
    impact_times=((NIGHT,3.12),) if recorded else ((NIGHT,3.12),(LEARN,3.32))
    for start,impact in impact_times:
        tone(start+impact,195,68,.24,.14)
        shoe(start+impact,1,1.24)
        tone(start+impact+.57,290,99,.15,.10,.39)
        shoe(start+impact+.57,1,.65)
    if recorded:
        from classroom import LENGTH, TRAIL, TEST as FROZEN
        recorded_cues(shoe,tone,sweep)
    else:
        steps(LEARN,LEARN+3.3,.335,.67)
        for offset,freq in ((0,305),(.59,415),(1.22,520),(1.95,655)):
            tone(PRACTICE+offset,freq,freq*1.09,.15,.074)
        for start,takeoff,land,end in ((LEARN_RETRY,1.50,3.54,FROZEN),(FROZEN,1.13,2.96,LOW)):
            steps(start,start+takeoff,.335,.65)
            shoe(start+takeoff,-1,1.05)
            sweep(start+takeoff+.09,.78,.055)
            shoe(start+land,1,1.31)
            steps(start+land+.35,end,.335,.70)
        tone(LEARN_RETRY+3.57,626,703,.20,.10)
        tone(LEARN_RETRY+3.72,937,1004,.25,.077)
        steps(LOW,TRAIL,.35,.58)
        sweep(LOW+3.32,.33,.069)
    steps(TRAIL,TRAIL+2.1,.365,.57,True)
    steps(TRAIL+2.34,LENGTH-.22,.56,.50,True)
    sweep(TRAIL+3.44,.32,.082)
    for t in (TRAIL+1.19,TRAIL+1.43,TRAIL+7.28,TRAIL+7.51):
        tone(t,2440,3040,.13,.029,-.54)
    for cut in (5,IMU,LIDAR,SOLES,LEARN,FROZEN,TRAIL):
        sweep(cut-.09,.20,.052)
    return TRAIL


def soundtrack(path,duration,teaching=False,recorded=False):
    sr=44100
    n=round(sr*duration)
    mix=np.zeros((n,2),dtype=np.float32)
    rng=np.random.default_rng(406)

    def place(start,signal,gain,pan=0.):
        ix=round(start*sr)
        sig=signal[:max(0,min(len(signal),n-ix))]
        if ix<0 or not len(sig):
            return
        angle=(pan+1)*math.pi/4
        mix[ix:ix+len(sig)]+=sig[:,None]*np.array([math.cos(angle),math.sin(angle)])*gain

    def tone(start,freq,end,dur,gain,pan=0.):
        t=np.arange(round(sr*dur))/sr
        env=np.minimum(1,t/.009)*np.minimum(1,(dur-t)/.045)*np.exp(-2.6*t/dur)
        phase=2*math.pi*(freq*t+(end-freq)/(2*dur)*t*t)
        place(start,(np.sin(phase)+.14*np.sin(phase*2))*env,gain,pan)

    def texture(dur,window):
        white=rng.standard_normal(round(sr*dur))
        return np.convolve(white,np.ones(window)/math.sqrt(window),"same")

    def shoe(t,side,weight=1.,wood=False):
        dur=.115
        a=np.arange(round(sr*dur))/sr
        impact=np.sin(2*math.pi*(98*a-210*a*a))*np.exp(-43*a)
        grit=texture(dur,4 if wood else 10)*np.exp(-47*a)
        env=np.minimum(1,a/.003)
        place(t,(.75*impact+.24*grit)*env,.23*weight,side*.24)
        if wood:
            tone(t+.004,385,250,.075,.065*weight,side*.2)

    def steps(start,end,period,gain=.8,wood=False,audible_until=math.inf):
        for i,t in enumerate(np.arange(start,end,period)):
            # Keep the original random sequence for the other five chapters.
            weight=gain*(.94+.06*math.cos(i)) if t<audible_until else 0.
            shoe(t,1 if i%2 else -1,weight,wood)

    def sweep(start,dur,level):
        t=np.arange(round(sr*dur))/sr
        place(start,texture(dur,24)*np.sin(math.pi*t/dur)**2,level)

    for t,f in [(0.18,176),(.43,350),(.60,525)]:
        tone(t,f,f*1.12,.45,.10)
    steps(5.,17.05,.325,.75,audible_until=5.+PLANT-.01)
    wet_start=TRAIL
    if teaching:
        shoe(5.+PLANT,-1,1.10)
        sweep(5.+PLANT+.045,.63,.12)
        wet_start=teaching_cues(steps,shoe,tone,sweep,recorded)
    else:
        for a,b in [(CONTROL,CONTROL+4.08),(CONTROL+6.42,LEARN),
                    (LEARN,LEARN+3.23),(LEARN+5.70,LEARN+8.87),
                    (LEARN+10.93,DECIDE),(DECIDE,TRAIL)]:
            steps(a,b,.325,.75)
        steps(TRAIL+.2,TRAIL+12.0,.44,.45,True)
        shoe(5.+PLANT,-1,1.10)
        sweep(5.+PLANT+.045,.63,.12)
        for t in [SENSE+.55,SENSE+2.30,SENSE+5.15,SENSE+6.90]:
            tone(t,620,980,.18,.09)
        shoe(CONTROL+6.22,1,1.7)
        shoe(LEARN+3.30,1,1.35)
        tone(LEARN+3.30,168,64,.29,.13)
        tone(LEARN+10.98,600,760,.24,.11)
        tone(LEARN+11.12,870,920,.27,.085)
        for t in (5,SENSE,CONTROL,LEARN+5.7,DECIDE,TRAIL):
            sweep(t-.13,.31,.094)
        for t in (TRAIL+1.2,TRAIL+1.48,TRAIL+7.8,TRAIL+8.05):
            tone(t,2320,3110,.135,.031,-.55)
    # Slow filtered air in the stands, then lapping water. No borrowed concert sound.
    tt=np.arange(n)/sr
    for channel in range(2):
        air=np.interp(tt,np.arange(0,duration+.01,.0035),
                      rng.standard_normal(len(np.arange(0,duration+.01,.0035))))
        ripples=(.28+.72*np.cos(1.76*tt+channel*.28)**2)
        env=np.where(tt<wet_start,.011+.003*np.sin(tt*.68),.014*ripples)
        mix[:,channel]+=air*env
    # Lead sole scrapes outwards; individual grains tick down before the palm takes weight.
    length=.72
    seconds=np.arange(round(sr*length))/sr
    scrape=texture(length,3)*np.minimum(1,seconds/.05)*np.exp(-4.7*seconds/length)
    place(5.+PLANT+.07,scrape,.115,-.30)
    for offset,freq in ((.15,1560),(.22,1190),(.35,1880),(.49,1050),(.63,1440)):
        tone(5.+PLANT+offset,freq,freq*.70,.029,.042,-.35)
    shoe(5.+PALM,-1,.84)
    tone(5.+PALM+.012,122,73,.12,.053,-.36)
    fade=np.minimum(1,np.minimum(tt/.15,(duration-tt)/.48))
    mix*=np.maximum(0,fade)[:,None]
    with wave.open(str(path),"wb") as stream:
        stream.setparams((2,2,sr,0,"NONE","not compressed"))
        stream.writeframes(np.int16(np.clip(mix,-.94,.94)*32767).tobytes())
