from pathlib import Path
import hashlib
import json

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution'
path=root/'robot-evolution-v3.mp4'
video=cv2.VideoCapture(str(path))
fps=video.get(cv2.CAP_PROP_FPS)
count=int(video.get(cv2.CAP_PROP_FRAME_COUNT))
assert (fps,count,int(video.get(3)),int(video.get(4)))==(30,2730,1920,1080)

def at(t):
    video.set(cv2.CAP_PROP_POS_FRAMES,min(count-1,round(t*fps)))
    ok,data=video.read()
    assert ok,t
    return cv2.cvtColor(data,cv2.COLOR_BGR2RGB)

# At matched decision time, compression can introduce small local colour differences.
before=at(59.9+2.40)
after=at(68.3+1.50)
error=np.abs(before[310:950].astype(np.int16)-after[310:950].astype(np.int16)).mean()
assert error<4,error
before=at(59.9+2.40+.65)
after=at(68.3+1.50+.65)
action_delta=np.abs(before[310:950,510:880].astype(np.int16)-after[310:950,510:880].astype(np.int16)).mean()
assert action_delta>9,action_delta
assert at(91).mean()<18

shots=[
    (17.72,'鞋底滑出，手掌撑地'),(24.36,'胸口装上姿态传感器'),(30.63,'重跑同一道弯'),
    (37.23,'灯光变暗，碰到栏杆'),(40.55,'头顶装上激光雷达'),(45.04,'等到合适距离再起跳'),
    (50.21,'前脚先踏上隆起'),(53.82,'双脚装上足底力觉'),(59.11,'收短下一步，越过土坡'),
    (63.72,'训练中碰栏扣分'),(67.39,'反复尝试三种动作'),(70.85,'训练后在同处起跳'),
    (75.19,'冻结策略，移动栏位'),(80.04,'换作低梁，自主下蹲'),(85.70,'湿滑栈道上的落脚')]
w,h=490,276
sheet=Image.new('RGB',(w*3,(h+37)*5),(19,27,42))
d=ImageDraw.Draw(sheet)
face=ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc',19)
for i,(time,caption) in enumerate(shots):
    im=Image.fromarray(at(time)).resize((w,h),Image.Resampling.LANCZOS)
    x,y=i%3*w,i//3*(h+37)
    sheet.paste(im,(x,y))
    d.text((x+10,y+h+5),f'{int(time)//60:02d}:{int(time)%60:02d}   {caption}',font=face,fill='#f0f4f8')
sheet.save(root/'study/升级过程选帧.jpg',quality=93,optimize=True)
print(json.dumps({'frames':count,'fps':fps,'seconds':count/fps,'bytes':path.stat().st_size,
    'matchedFrameMeanError':round(float(error),2),'differentActionsMeanError':round(float(action_delta),2),
    'sha256':hashlib.file_digest(path.open('rb'),'sha256').hexdigest()},indent=2))
