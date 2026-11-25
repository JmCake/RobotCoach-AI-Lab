from pathlib import Path
import sys

out=Path(__file__).resolve().parent
source=out.parents[1]/'final-race-video/films/robot-evolution/source'
sys.path.insert(0,str(source))
from classroom import frame,RULE,TRAIL
from export import export

first,last=round(RULE*30),round(TRAIL*30)
export(out/'painted.mp4',lambda canvas,t:frame(canvas,(first+round(t*30))/30),
       (last-first)/30,1920,30)
