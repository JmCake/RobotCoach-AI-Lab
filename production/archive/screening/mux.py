"""Mux the real projector capture with the concurrently captured browser audio."""
from pathlib import Path
import json,subprocess
import cv2
from datetime import datetime
from scipy.signal import correlate
import numpy as np
base=Path(__file__).resolve().parent
dest=base.parents[2]/'docs/全片验收'
cap=base/'capture'
entry=json.loads((cap/'sources.json').read_text())
video=cap/entry['video']
assert video.name=='projector.mp4' and video.is_file()
ff='ffmpeg'
v=cv2.VideoCapture(str(video));duration=v.get(7)/v.get(5);v.release()
assert duration>285
# Actual Edge phase events logged by the recording run, relative to its opening.
cuts=[(0,'序幕 · 一台机器人的梦想'),(26.3,'弯道现场与维修舱'),(41.3,'从弯道到矮栏'),
      (64.8,'机器人训练营'),(103.3,'六段连续总决赛'),(156.7,'九寨沟的落脚点'),
      (163,'奔跑的意义'),(251,'科技的温度')]
m=[';FFMETADATA1','title=机器人总教练 · 奔跑的意义（课堂顺播实录）']
for i,(t,title) in enumerate(cuts):
    end=cuts[i+1][0] if i+1<len(cuts) else duration
    m+=['[CHAPTER]','TIMEBASE=1/1000',f'START={round(t*1000)}',f'END={round(end*1000)}','title='+title]
meta=cap/'chapters.ffmeta';meta.write_text('\n'.join(m),'utf8')
file=dest/'完整课堂顺播.mp4'
subprocess.run([str(ff),'-loglevel','error','-y','-i',str(video),'-itsoffset',str(entry['delta']/1000),
    '-i',str(cap/'class-audio.webm'),'-f','ffmetadata','-i',str(meta),'-map','0:v:0','-map','1:a:0',
    '-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',str(file)],check=True)
def sample(path,start,length):
    raw=subprocess.check_output([str(ff),'-loglevel','error','-ss',str(start),'-i',str(path),'-t',str(length),'-f','f32le','-ac','1','-ar','8000','pipe:1'])
    return np.frombuffer(raw,'<f4')
movie=dest.parents[1]/'assets/feature/ending.mp4'
template=sample(movie,27,2)
capture=sample(file,186,12)
lag=correlate(capture,template,mode='valid',method='fft').argmax()
at=186+lag/8000
a=capture[lag:lag+len(template)]
corr=np.corrcoef(a,template)[0,1]
assert corr>.5,(at,corr)
print('seconds',round(duration,2),'bytes',file.stat().st_size,'audio offset ms',entry['delta'],'rescue speech match',round(at,2),round(corr,3))
