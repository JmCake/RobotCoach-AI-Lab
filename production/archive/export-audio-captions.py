"""Archive only. Split the existing deterministic audio mix and caption timings.

No animation frames are generated. FFMPEG may name an installed executable.
"""
import ast
import json
import os
from pathlib import Path
import subprocess
import wave
import numpy as np
from scipy.signal import butter, sosfilt

dest=Path(__file__).resolve().parent
repo=dest.parents[1]
feature=repo/'production/feature'
ff=os.environ.get('FFMPEG','ffmpeg')
text=(feature/'render.py').read_text('utf8')
functions={n.name:ast.get_source_segment(text,n) for n in ast.parse(text).body if isinstance(n,ast.FunctionDef)}
lines=json.loads((feature/'dialogue.json').read_text('utf8'))
def voice(k):
    with wave.open(str(feature/'voices'/(k+'.wav'))) as w:
        assert w.getframerate()==22050 and w.getnchannels()==1
        return np.frombuffer(w.readframes(w.getnframes()),'<i2').astype('float32')/32768
lengths={k:len(voice(k))/22050 for k in lines}
cuts={'opening':(26,[(3,'dream')]),'bridge':(23,[(.2,'bend'),(8.3,'hurdle'),(16.2,'alone')]),
      'ending':(133,[(.8,'world'),(6,'why'),(15,'news'),(26,'brief'),(36,'receive'),(74,'hold'),(90,'before'),(97,'learned'),(105,'future')])}
def getmix(name,duration,dialogue,with_voice=True,music=True):
    # Keep the random stream, gain automation and cue positions identical.
    code=functions['soundtrack'].split('    with wave.open(')[0]+'    return base\n'
    if not music:
        code=code.replace('def motif(start,frequencies,spacing,level):','def motif(start,frequencies,spacing,level):\n        return')
        code='\n'.join(line for line in code.splitlines() if 'base+=(.018*np.sin' not in line)
    env=dict(np=np,butter=butter,sosfilt=sosfilt,voice=voice if with_voice else lambda k:np.zeros_like(voice(k)))
    exec(code,env)
    return env['soundtrack'](name,duration,dialogue)
class Caption:
    def text(self,words,*args,**kwargs):self.words=words
def time(t):
    ms=round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
def srt(path,rows):
    path.write_text(''.join(f'{i}\n{time(a)} --> {time(b)}\n{line}\n\n' for i,(a,b,line) in enumerate(rows,1)),'utf-8')
def write_stems():
    cap={'lines':lines,'lengths':lengths};exec(functions['captions'],cap)
    for name,(duration,dialogue) in cuts.items():
        target=dest/'audio/stems'/name;target.mkdir(parents=True,exist_ok=True)
        full=getmix(name,duration,dialogue)
        bed=getmix(name,duration,dialogue,False)
        fx=getmix(name,duration,dialogue,False,False)
        layers={'music':bed-fx,'effects-ambience':fx,'dialogue':full-bed}
        assert np.max(np.abs(sum(layers.values())-full))<1e-8
        for key,buffer in layers.items():
            subprocess.run([ff,'-loglevel','error','-y','-f','f32le','-ar','22050','-ac','1','-i','pipe:0','-c:a','flac','-sample_fmt','s32',str(target/(key+'.flac'))],input=buffer.astype('<f4').tobytes(),check=True)
        rows=[];last='';start=0
        for i in range(duration*24+1):
            c=Caption();c.words='';t=i/24;cap['captions'](c,t,dialogue)
            if c.words!=last:
                if last:rows.append((start,t,last))
                start=t;last=c.words
        sub=dest/'subtitles';sub.mkdir(exist_ok=True)
        srt(sub/(name+'.srt'),rows)
        print(name,'cues',len(rows),'audio seconds',duration)
    srt(sub/'ending-titles.srt',[(118,120,'我们教会机器人奔跑，'),(120,122,'我们教会机器人奔跑，\n不是为了让它赢过人类，'),(122,124,'我们教会机器人奔跑，\n不是为了让它赢过人类，\n而是为了让科技抵达危险，让生命远离危险。'),(124,131.6,'我们教会机器人奔跑，\n不是为了让它赢过人类，\n而是为了让科技抵达危险，让生命远离危险。\n科技向善  ·  智能为人')])
if __name__=='__main__':write_stems()
