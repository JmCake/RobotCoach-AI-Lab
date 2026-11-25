"""First run, followed by the missed bend and a grounded catch."""
import math

from bend import WIDE, trackside
from paint import Canvas, ease
from runner import Runner

PILOT_LENGTH = 17.2
ATHLETE = Runner()


def lane_flow(c, t, left_visible, speed=1.):
    # Track paint passes under each camera in perspective. The two views share distance.
    for i in range(5):
        u = ((t*speed*.54 + i/5) % 1) ** 2.4
        if u < .018:
            continue
        y = 362+405*u
        cx = 272-26*u
        spread = 183*u
        if left_visible:
            c.line([(cx-spread,y),(cx+spread,y)],(185,247,247),1+3*u)
        ry = 25 + 780*u
        mid = 940 -10*u
        half = 17+322*u
        c.line([(mid-half+9,ry),(mid-half+12+20*u,ry)],
               (255,196,180),1+4*u)
        c.line([(mid+half-9,ry),(mid+half-12-20*u,ry)],
               (255,196,180),1+4*u)


def pilot(c, t, diagnostic=True, rig=None):
    if t>=WIDE:
        trackside(c,t,ATHLETE,diagnostic,rig)
        return
    zoom=1.018+.026*ease(0,6.9,t)
    shift=(2.4*math.sin(1.7*t),1.6*math.sin(t*5))
    c.background("split.png",zoom,(580,342),shift)
    lane_flow(c,t,True)
    phase=t/.65
    x=935+6*math.sin(math.tau*phase)
    c.ellipse(x+4,667,103,10,(113,37,63))
    ATHLETE.draw(c,x,666,633+13*math.sin(t*.51),phase,1,
                 -.017+.017*math.sin(math.tau*phase),contact_shadow=True,rig=rig)


if __name__ == "__main__":
    import argparse
    from PIL import Image
    parser=argparse.ArgumentParser()
    parser.add_argument("time",type=float)
    parser.add_argument("image")
    parser.add_argument("--width",type=int,default=1280)
    args=parser.parse_args()
    canvas=Canvas(args.width)
    pilot(canvas,args.time)
    Image.fromarray(canvas.rgb).save(args.image)
