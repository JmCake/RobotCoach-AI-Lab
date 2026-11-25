"""Render the locked classroom cuts with the original V6 rig in its 1280x720 space."""
from pathlib import Path
import sys, json, wave, subprocess, os, math, tempfile, shutil
from functools import lru_cache
import numpy as np
import cv2
from PIL import Image

work=Path(__file__).resolve().parent
app=work.parents[1]
src=Path(os.environ.get('ROBOTCOACH_V6_SOURCE',app.parent/'final-race-video/films/robot-evolution/source'))
build_temp=tempfile.TemporaryDirectory(prefix='robotcoach-render-')
audio_dir=Path(build_temp.name)
sys.path.insert(0,str(src))
from paint import Canvas,ease
from side_runner import Profile
from scipy.signal import butter,sosfilt

out=Path(os.environ.get('FEATURE_OUTPUT',app/'assets/feature'))
out.mkdir(parents=True,exist_ok=True)
ff=os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not ff:
    import imageio_ffmpeg
    ff=imageio_ffmpeg.get_ffmpeg_exe()
lines=json.loads((work/'dialogue.json').read_text('utf8'))
media=app/'assets/story/media'
photo=app/'assets/vision/samples/jiuzhaigou.webp'
W,H,FPS=1280,720,24
cv2.setNumThreads(2)
opening=[(3,'dream')]
ending=[(.8,'world'),(6,'why'),(15,'news'),(26,'brief'),(36,'receive'),(74,'hold'),(90,'before'),(97,'learned'),(105,'future')]
def voice(key):
    with wave.open(str(work/'voices'/(key+'.wav'))) as f:
        return np.frombuffer(f.readframes(f.getnframes()),'<i2').astype('float32')/32768

def soundtrack(name,duration,dialogue):
    rate=22050
    t=np.arange(round(duration*rate))/rate
    rng=np.random.default_rng(825)
    def noise(lo,hi):
        return sosfilt(butter(2,[lo,hi],btype='bandpass',fs=rate,output='sos'),rng.normal(size=len(t)))
    base=noise(90,790)*.028
    def swell(a,b):return np.minimum(1,np.maximum(0,(t-a)/b))
    def hit(start,sec,hz,level,decay=4):
        i=round(start*rate);x=np.arange(min(round(sec*rate),len(t)-i))/rate
        if len(x):base[i:i+len(x)]+=level*np.sin(2*np.pi*(hz*x+.5*hz*.06*x*x))*np.exp(-decay*x/sec)*np.minimum(1,x*50)
    def motif(start,frequencies,spacing,level):
        for j,hz in enumerate(frequencies):hit(start+j*spacing,3,hz,level,2)
    if name=='opening':
        base+=noise(400,3100)*.075*(1+.35*np.sin(t*2.8))*(1-swell(duration-.5,.32))
        motif(.3,[293.66,369.99,440],.65,.047)
        i=round(14.6*rate);n=int(.17*rate);base[i:i+n]+=rng.normal(0,.22,n)*np.exp(-np.arange(n)/(n/11))
        for at in np.arange(15.1,duration-.8,.34):hit(at,.15,96,.16)
    elif name=='bridge':
        base+=noise(400,3100)*.075*(1+.25*np.sin(t*2))
        motif(.15,[293.66,369.99,440],.47,.034)
        for at in np.arange(.22,5.4,.4):hit(at,.17,96,.14)
    else:
        base+=noise(650,4300)*.082*(1-swell(11,3))
        for at in [1.2,2.6,5.4,8.8]:hit(at,.32,1850,.045)
        for at in [14,14.25,26,36,69.5,70,72,74,80]:hit(at,.25,1000,.06)
        for at in np.arange(40,69,1.2):hit(at,.37,79,.16)
        for at in [6,25,42,61,83,96,107,118]:
            motif(at,[146.83,185,220] if at<82 else [293.66,369.99,440],1,.042)
        base+=(.018*np.sin(t*2*np.pi*110)+.012*np.sin(t*2*np.pi*146.83))*swell(13,5)*(1-swell(duration-10,8))
    for at,k in dialogue:
        v=voice(k);i=round(at*rate)
        base[i:i+len(v)]*=.47
        base[i:i+len(v)]+=v*.86
    base*=np.minimum(1,np.maximum(0,(duration-t)/1.5))
    with wave.open(str(audio_dir/(name+'.wav')),'wb') as f:
        f.setparams((1,2,rate,0,'NONE','not compressed'))
        f.writeframes((np.clip(base,-.98,.98)*32767).astype('<i2').tobytes())

@lru_cache(None)
def plate(path):
    im=Image.open(path).convert('RGB')
    # Cover the complete aperture while preserving the source proportions.
    w,h=im.size
    if w/h>16/9:
        dx=(w-h*16/9)/2;im=im.crop((dx,0,w-dx,h))
    else:
        dy=(h-w*9/16)/2;im=im.crop((0,dy,w,h-dy))
    return np.array(im.resize((W,H),Image.Resampling.LANCZOS))
def move(im,z,fx=.5,fy=.5):
    m=np.float32([[z,0,W*fx*(1-z)],[0,z,H*fy*(1-z)]])
    return cv2.warpAffine(im,m,(W,H),borderMode=cv2.BORDER_REPLICATE)
def dissolve(a,b,f):return cv2.addWeighted(a,1-f,b,f,0.)
def art(n):return plate(work/'plates'/(n+'.png'))
@lru_cache(None)
def wave_maps():
    yy,xx=np.mgrid[:H,:W].astype('float32')
    # Pin the elbow. The wrist and open fingers move together in a small arc.
    weight=np.exp(-((xx-887)/75)**2-((yy-172)/115)**2).astype('float32')
    return xx,yy,weight
def clipread(path):
    cap=cv2.VideoCapture(str(path));hz=cap.get(cv2.CAP_PROP_FPS)
    def get(t):
        n=round(t*hz)
        if int(cap.get(cv2.CAP_PROP_POS_FRAMES))!=n:cap.set(cv2.CAP_PROP_POS_FRAMES,n)
        ok,f=cap.read()
        if not ok:raise ValueError((path,t))
        return cv2.cvtColor(cv2.resize(f,(W,H)),cv2.COLOR_BGR2RGB)
    return get
fall=clipread(app/'assets/rescue/opening-v6.mp4')
runner=Profile()
class Anchors:
    def __init__(self,radio=False):self.values=[];self.radio=radio
    def mount(self,c,name,pos,width,angle,side=1):
        self.values.append([name,round(pos[0]/W*100,2),round(pos[1]/H*100,2),round(width/W*100,2),round(angle,3)])
        if self.radio and name=='imu':
            x,y=pos[0]-21,pos[1]+47
            c.poly([(x-7,y-9),(x+6,y-10),(x+8,y+10),(x-6,y+11)],(43,52,59))
            c.line([(x-5,y-8),(x-6,y-17)],(23,24,30),3)
            c.line([(x-2,y-5),(x+4,y-5)],(137,221,228),2)
def static_mounts(name,z,fx,fy):
    marks={
      'arrival':[('lidar',.36,.34,.035),('camera',.311,.415,.019),('imu',.365,.505,.031),('force',.32,.905,.044),('force',.403,.895,.042)],
      'return':[('lidar',.466,.34,.031),('camera',.436,.391,.016),('imu',.469,.475,.032),('force',.451,.803,.032),('force',.472,.84,.034)],
      'line':[('camera',.469,.16,.043)]}
    return [[k,round((x*z+fx*(1-z))*100,2),round((y*z+fy*(1-z))*100,2),round(w*z*100,2),0] for k,x,y,w in marks.get(name,[])]
def captions(c,t,dialogue):
    for start,k in dialogue:
        duration=lengths[k];local=t-start
        if 0<=local<duration:
            import re
            words=lines[k][1]
            pieces=re.findall(r'[^，。！？……]+[，。！？……]*',words)
            groups=[]
            for part in pieces:
                if groups and len(groups[-1])+len(part)<=23:groups[-1]+=part
                else:groups.append(part)
            chosen=groups[-1];pos=0
            for part in groups:
                pos+=len(part)/len(words)*duration
                if local<pos:chosen=part;break
            c.text(chosen,640,646,32,stroke=3,align=.5)
            break
lengths={k:len(voice(k))/22050 for k in lines}
fall_end=17.53
opening_duration=26
def op(c,t):
    if t<14.6:
        z=1.04+.10*ease(0,4,t)+.22*ease(5,13,t)
        fx,fy=.43,.33
        xx,yy,weight=wave_maps()
        wave_amount=math.sin((t-2.6)*4)*ease(2.6,3.5,t)*(1-ease(7,8.5,t))
        moving=cv2.remap(art('line'),xx+13*wave_amount*weight,yy-5*wave_amount*weight,cv2.INTER_LINEAR)
        c.rgb=move(moving,z,fx,fy)
        if t<3.4:
            alpha=ease(.1,.8,t)*(1-ease(2.7,3.4,t))
            c.text('一台机器人的梦想',78,525,55,stroke=3,opacity=alpha)
        # Stopwatch sweep and visor illumination are diegetic motion cues.
        if 4<t<12:
            x=int(W*(.54*z+fx*(1-z)));y=int(H*(.18*z+fy*(1-z)))
            cv2.circle(c.rgb,(x,y),4,(122,252,255),-1,cv2.LINE_AA)
        return static_mounts('line',z,fx,fy)
    c.rgb=fall(min(fall_end,6.14+t-14.6))
    if t<14.76:c.rgb=dissolve(np.full_like(c.rgb,247),c.rgb,ease(14.6,14.76,t))
    return []

def finish(c,t):
    anchors=[]
    def still(n,z,x,y):
        c.rgb=move(art(n),z,x,y);return static_mounts(n,z,x,y)
    if t<14.7:
        c.rgb=move(plate(photo),1+.055*ease(0,12,t),.52,.53)
        c.rgb=(c.rgb*(1-ease(11.8,14.7,t))).astype('uint8')
    elif t<40.5:
        z=1+.19*ease(15,30,t)+.27*ease(30,40,t)
        anchors=still('arrival',z,.38,.49)
        if t<16.4:c.rgb=(c.rgb*ease(14.7,16.4,t)).astype('uint8')
        if 16.4<t<23:c.text('未来应用设想   /   震后探查',60,56,25,stroke=2)
    elif t<70:
        u=(t-40.5)/29.5
        c.rgb=move(art('corridor'),1.025+.075*u,.61,.57)
        walk=min(1,(t-40.5)/25)
        x=210+570*walk
        cone=c.rgb.copy()
        y=428+4*math.sin(t*.9)
        cv2.fillConvexPoly(cone,np.int32([[x+34,y],[1160,320],[1235,568]]),(122,174,186))
        c.rgb=dissolve(c.rgb,cone,.105)
        for i in range(20):
            px=(i*131+t*(3+i%4))%1280;py=300+(i*41+2*math.sin(t+i))%235
            cv2.circle(c.rgb,(int(px),int(py)),1,(148,164,175),-1)
        rig=Anchors(radio=True)
        c.ellipse(x,607,65,8,(29,34,44))
        runner.draw(c,x,602,218,.19+min(25,t-40.5)*.48,-.06,.96,rig,surface=lambda _:602)
        anchors=rig.values
        # Memories return on the gaze, the landing, and the decision to stop.
        for a,b,im in [(45.5,46.65,app/'assets/rescue/eye.webp'),(55.6,56.85,out/'impact.webp'),(65.8,67,out/'sample-coach.webp')]:
            if a<=t<b:
                f=ease(a,a+.16,t)*(1-ease(b-.18,b,t));c.rgb=dissolve(c.rgb,move(plate(im),1.23,.58,.59),f)
                if f>.25:anchors=[]
    elif t<83:
        z=1.26-.2*ease(70,82,t);still('radio',z,.57,.6)
        # Radio activity rides the same terminal that receives the pictures.
        for i in range(4):
            x=772+7*i;y=484;v=3+int(7*(1+math.sin(t*8+i)))
            c.line([(x,y),(x,y-v)],(92,234,215),3)
    elif t<88:
        anchors=still('return',1.20+.12*ease(83,88,t),.47,.53)
    elif t<105:
        # Tight framing keeps the audience's attention on the contact.
        z=1.38+.16*ease(88,97,t)
        still('hands',z,.50,.68)
        if 90<t<94.5:
            f=ease(90,90.5,t)*(1-ease(93.8,94.5,t))
            c.rgb=dissolve(c.rgb,move(plate(out/'impact.webp'),1.65,.55,.72),f)
    else:
        z=1.37-.36*ease(105,122,t)
        anchors=still('return',z,.47,.53)
        if t>=117.7:
            f=ease(117.7,120,t)
            c.rgb=(c.rgb*(1-f*.78)).astype('uint8')
            for i,(at,line) in enumerate([(118,'我们教会机器人奔跑，'),(120,'不是为了让它赢过人类，'),(122,'而是为了让科技抵达危险，让生命远离危险。')]):
                c.text(line,640,225+i*62,36,align=.5,stroke=1,opacity=ease(at,at+.9,t))
            c.text('科技向善  ·  智能为人',640,458,24,fill=(252,218,143),align=.5,opacity=ease(124,125.2,t))
        if t>129:
            c.rgb=(c.rgb*(1-ease(129,131.6,t))).astype('uint8')
            anchors=[]
    return anchors

def render(name,duration,dialogue,fn):
    soundtrack(name,duration,dialogue)
    args=[str(ff),'-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r',str(FPS),'-i','pipe:0','-i',str(audio_dir/(name+'.wav')),'-c:v','libx264','-threads','4','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(out/(name+'.mp4'))]
    process=subprocess.Popen(args,stdin=subprocess.PIPE)
    c=Canvas(W);keys=[]
    for i in range(int(duration*FPS)):
        t=i/FPS
        mounts=fn(c,t)
        captions(c,t,dialogue)
        if i%3==0:keys.append(mounts)
        process.stdin.write(c.rgb.tobytes())
        if i%480==0:print(name,t,flush=True)
    process.stdin.close()
    if process.wait():raise RuntimeError(name)
    (out/(name+'-mounts.json')).write_text(json.dumps(keys,separators=(',',':')))
    if name=='opening':Image.fromarray(c.rgb).save(out/'impact.webp',quality=93)
    print('finished',name,flush=True)
def coach_panel():
    from film import hurdle,stadium
    from paint import sprite
    c=Canvas(W);stadium(c,1.6);hurdle(c,610,625,1.13)
    cel=sprite('leap.png');c.paste(cel,605,325,.39,(cel.shape[1]*.5,cel.shape[0]*.5))
    Image.fromarray(c.rgb).save(out/'sample-coach.webp',quality=94)

def still_assets():
    def crop(path,stem,box):
        im=Image.open(path).convert('RGB');w,h=im.size
        rect=tuple(round(n*size) for n,size in zip(box,(w,h,w,h)))
        im.crop(rect).save(out/(stem+'.webp'),quality=91)
    crop(media/'hurdle.webp','hurdle-pov',(.465,.32,1,.85))
    crop(src/'art/shin-contact.png','sample-trial',(.16,.035,.9,1))
    crop(work/'plates/line.png','start',(0,0,1,1))

def bridge(c,t):
    import evolution
    from film import hurdle,stadium
    if t<2:
        original=exit_take(3.25+t)
        rig=Anchors()
        # Use the original take's joint transforms to register optional equipment
        # on the original pixels. Camera and IMU are already painted in this take.
        capture=Canvas(128)
        previous=evolution.Rig
        try:
            evolution.Rig=lambda *args:rig
            evolution.bend_retry(capture,3.35+t)
        finally:evolution.Rig=previous
        z=1.43
        c.rgb=move(original,z,.59,.48)
        return [[n,round(x*z+59*(1-z),2),round(y*z+48*(1-z),2),round(w*z,2),a] for n,x,y,w,a in rig.values if n in ['force','lidar']]
    p=min(1,(t-2)/4.3)
    travel=1-(1-p)**2
    stadium(c,1+travel*2);hurdle(c,1030-290*travel,606,1.0)
    rig=Anchors()
    # Begin on the same screen direction as the V6 running profile and settle
    # into a single planted exposure before the look toward the obstacle.
    x=345+169*travel
    c.ellipse(x+7,606,61,7,(117,57,68))
    runner.draw(c,x,603,307,.19+3.04*travel,-.03,.98,rig,surface=lambda _:603)
    if 9.3<=t<15.4:
        f=ease(9.3,9.7,t)*(1-ease(15,15.4,t))
        c.rgb=dissolve(c.rgb,move(plate(out/'hurdle-pov.webp'),1+.14*ease(9.3,15.4,t),.51,.62),f)
        if f>.25:return []
    return rig.values

if __name__=='__main__':
    for key in ['camp','broadcast','trail']:
        subprocess.run([str(ff),'-loglevel','error','-y','-i',str(work/'voices'/(key+'.wav')),'-c:a','aac','-b:a','80k',str(out/(key+'.m4a'))],check=True)
    (out/'lines.json').write_text(json.dumps({k:{'role':v[0],'line':v[1],'duration':round(lengths[k],3)} for k,v in lines.items()},ensure_ascii=False),'utf8')
    still_assets();coach_panel()
    exit_take=clipread(media/'through.mp4')
    if 'bridge' in sys.argv or len(sys.argv)==1:render('bridge',23,[(.2,'bend'),(8.3,'hurdle'),(16.2,'alone')],bridge)
    if 'opening' in sys.argv or len(sys.argv)==1:render('opening',opening_duration,opening,op)
    if 'ending' in sys.argv or len(sys.argv)==1:render('ending',133,ending,finish)
