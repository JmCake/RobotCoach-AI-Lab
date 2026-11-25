from concurrent.futures import ThreadPoolExecutor
import os
from pathlib import Path
import subprocess
import sys

out=Path(__file__).resolve().parent
film=out.parents[1]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(film/'source'))
from classroom import frame,RULE,TRAIL,LENGTH
from export import encoder,export
from sound import soundtrack

def ff(*args):
    subprocess.run([encoder(),'-nostdin','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def outer():
    ff('-i',film/'robot-evolution-v5.mp4','-map','0:v:0','-c:v','copy','-f','segment',
       '-segment_times','59.9,122.6','-segment_time_delta','0.01666','-reset_timestamps','1',
       '-segment_format','mp4',out/'outer-%d.mp4')

def paint():
    first,last=round(RULE*30),round(TRAIL*30)
    export(out/'painted.mp4',lambda c,t:frame(c,(first+round(t*30))/30),(last-first)/30,1920,30)

def finish():
    cat=out/'cut.ffconcat'
    cat.write_text("ffconcat version 1.0\nfile 'outer-0.mp4'\nduration 59.900000\nfile 'painted.mp4'\nduration 62.700000\nfile 'outer-2.mp4'\nduration 9.600000\n",encoding='ascii')
    audio_opts=['-c:a','aac','-b:a','160k','-movflags','+faststart']
    ff('-f','concat','-safe',0,'-i',cat,'-i',out/'effects.wav','-map','0:v:0','-map','1:a:0',
       '-c:v','copy','-video_track_timescale','15360',*audio_opts,out/'master.mp4')
    ff('-i',out/'painted.mp4','-ss',RULE,'-i',out/'effects.wav','-t',TRAIL-RULE,
       '-map','0:v','-map','1:a','-c:v','copy',*audio_opts,out/'training.mp4')
    video_opts=['-c:v','libx264','-preset','medium','-crf',18,'-threads',5,'-pix_fmt','yuv420p',
                '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709']
    ff('-ss','64.9','-i',out/'master.mp4','-t',37,'-vf','scale=1280:720',
       *video_opts,*audio_opts,out/'trials.mp4')
    selects=[(70,76.1),(83.1,90),(101.9,111.4)]
    inputs=[]
    chains=[]
    for i,(start,end) in enumerate(selects):
        inputs+=['-ss',start,'-t',f'{end-start:.3f}','-i',out/'master.mp4']
        chains.extend([f'[{i}:v]scale=1280:720,setpts=PTS-STARTPTS[v{i}]',
                       f'[{i}:a]asetpts=PTS-STARTPTS[a{i}]'])
    graph=';'.join(chains+['[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]'])
    ff(*inputs,'-filter_complex_threads',3,'-filter_complex',graph,'-map','[v]','-map','[a]',
       *video_opts,*audio_opts,out/'action.mp4')
    print('Four cuts rendered.',flush=True)

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        tasks=[pool.submit(paint),pool.submit(outer),pool.submit(soundtrack,out/'effects.wav',LENGTH,True,True)]
        for task in tasks:
            task.result()
    finish()
