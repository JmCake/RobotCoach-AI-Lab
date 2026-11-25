"""Build the side-by-side study using the attendee's MOV and a rendered pilot."""
import argparse
from pathlib import Path
import cv2 as cv
import numpy as np
from PIL import Image

from export import export
from paint import Canvas, WHITE, CYAN, font
from pilot import PILOT_LENGTH


def comparison(source, recreated, destination):
    original=cv.VideoCapture(str(source))
    copy=cv.VideoCapture(str(recreated))
    if not original.isOpened() or not copy.isOpened():
        raise ValueError("Both the source MOV and the rendered pilot must be readable.")
    original.set(cv.CAP_PROP_POS_MSEC,215500)
    _,anchor=original.read()
    anchor=cv.resize(cv.cvtColor(anchor[114:215,230:1180],cv.COLOR_BGR2GRAY),None,fx=.5,fy=.5)
    original.set(cv.CAP_PROP_POS_MSEC,211300)
    fps=30
    def panel(c,arr,x,y,w,h):
        ih,iw=arr.shape[:2]
        k=min(w/iw,h/ih)
        cw,ch=round(iw*k*c.s),round(ih*k*c.s)
        xx,yy=round((x+w*.5)*c.s-cw*.5),round((y+h*.5)*c.s-ch*.5)
        c.rgb[yy:yy+ch,xx:xx+cw]=cv.resize(arr,(cw,ch),interpolation=cv.INTER_AREA)

    def draw(c,t):
        aok,a=original.read()
        bok,b=copy.read()
        if not aok or not bok:
            raise ValueError("Input ended before the comparison.")
        gray=cv.resize(cv.cvtColor(a[35:325,:1510],cv.COLOR_BGR2GRAY),None,fx=.5,fy=.5)
        _,score,_,(xx,yy)=cv.minMaxLoc(cv.matchTemplate(gray,anchor,cv.TM_CCOEFF_NORMED))
        dx=xx*2-230 if score>.45 else 0
        dy=yy*2+35-114 if score>.45 else 0
        roi=a[max(0,213+dy):min(1080,683+dy),max(0,dx):min(1920,1259+dx)]
        c.rgb[:]=[14,24,43]
        c.text("现场屏摄",34,54,33,WHITE)
        c.text("独立动画",666,54,33,WHITE)
        c.line([(34,113),(615,113)],(55,84,113),2)
        c.line([(666,113),(1246,113)],(55,84,113),2)
        panel(c,cv.cvtColor(roi,cv.COLOR_BGR2RGB),22,131,599,397)
        panel(c,cv.cvtColor(b,cv.COLOR_BGR2RGB),655,131,603,397)
        c.text(f"03:{31.3+t:05.2f}",34,544,28,CYAN)
        c.text(f"+{t:05.2f} 秒",666,544,28,CYAN)
        note=("交替摆臂、左右脚换支撑" if t<5.2 else "修订版切到弯道外侧，白线弯向一边" if t<8.9
              else "鞋底越过白线，碎石被擦开" if t<10.67 else "重心前移，机器人伸手撑地" if t<13.35
              else "诊断框移到右上，保留手掌和脚底的画面")
        c.text(note,34,621,29,WHITE)
    try:
        export(destination,draw,PILOT_LENGTH,1280,fps)
    finally:
        original.release()
        copy.release()


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    for key in ("source","recreated","destination"):
        parser.add_argument(key,type=Path)
    args=parser.parse_args()
    comparison(args.source,args.recreated,args.destination)
