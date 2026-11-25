"""Sub-frame interpolation between painted contacts, passing poses and push-offs."""
from functools import lru_cache
import math

import cv2 as cv
import numpy as np
from PIL import Image

from paint import ART, premultiply
from side_runner import Profile

SIZE = 448
BASELINE = 419
CEL_HEIGHT = 350
SUBFRAMES = 6

# Landmarks were registered on 400 × 400 views of the original cells. Paired
# points stay on the same mechanical part even when the far foot is occluded.
# The order is crown, face, neck, pelvis, then shoulder/elbow/fist per arm
# and knee/ankle/toe per leg.
REAR = [
 [(204,12),(203,54),(204,88),(205,181),(157,100),(120,119),(126,172),(248,100),(269,129),(266,146),(180,217),(179,232),(180,269),(224,258),(220,344),(224,369)],
 [(194,13),(195,53),(194,87),(194,180),(149,100),(124,127),(131,137),(236,100),(274,126),(275,187),(167,244),(175,321),(176,368),(211,212),(211,266),(208,288)],
 [(204,13),(203,56),(204,88),(205,180),(156,100),(133,128),(140,143),(250,100),(285,125),(284,173),(182,257),(185,344),(185,368),(229,217),(229,234),(228,272)],
 [(194,12),(194,53),(194,88),(195,180),(149,100),(113,126),(114,179),(237,100),(270,126),(267,141),(173,209),(170,261),(169,284),(217,237),(209,306),(203,360)]
]


def poses(name, cols, rows):
    art=Image.open(ART/name).convert("RGBA")
    cells=[]
    for row in range(rows):
        for col in range(cols):
            bounds=(round(col*art.width/cols),round(row*art.height/rows),
                    round((col+1)*art.width/cols),round((row+1)*art.height/rows))
            cell=art.crop(bounds)
            alpha=np.array(cell.getchannel("A"))
            # Ignore isolated near-transparent fringe beyond a painted cell.
            mask=cv.morphologyEx((alpha>55).astype("uint8"),cv.MORPH_OPEN,np.ones((3,3),np.uint8))
            _,labels,stats,_=cv.connectedComponentsWithStats(mask)
            index=1+np.argmax(stats[1:,cv.CC_STAT_AREA])
            x,y,w,h=stats[index,:4]
            rect=(max(0,x-3),max(0,y-3),min(cell.width,x+w+3),min(cell.height,y+h+3))
            coords=np.float32(REAR[row*cols+col])*[cell.width/400,cell.height/400]-rect[:2]
            cells.append((cell.crop(rect),coords))
    size=min(CEL_HEIGHT/np.median([c.height for c,_ in cells]),(SIZE-40)/max(c.width for c,_ in cells),
             (BASELINE-10)/max(c.height for c,_ in cells))
    frames,points=[],[]
    for index,(cell,coords) in enumerate(cells):
        w,h=round(cell.width*size),round(cell.height*size)
        im=Image.new("RGBA",(SIZE,SIZE))
        ox=round(SIZE/2-coords[3,0]*size)
        oy=BASELINE-h
        im.paste(cell.resize((w,h),Image.Resampling.LANCZOS),(ox,oy))
        frames.append(premultiply(im))
        points.append(np.float32(coords*[w/cell.width,h/cell.height]+[ox,oy]))
    return frames,points


def controls(points):
    extra=[]
    for i,j,r in [(0,2,36),(2,3,24),(4,5,8),(5,6,7),(7,8,8),(8,9,7),
                  (3,10,12),(10,11,9),(3,13,12),(13,14,9)]:
        start,end=points[i],points[j]
        axis=end-start
        normal=np.array([-axis[1],axis[0]])*r/max(1,np.linalg.norm(axis))
        mid=(start+end)*.5
        extra.extend((mid+normal,mid-normal))
    return np.float32([*points,*extra])


def deform(image,src,dst):
    # Inverse moving least-squares similarity. Each sub-frame samples a single
    # ink drawing, so disoccluded limbs retain solid edges rather than ghosting.
    height,width=image.shape[:2]
    xx,yy=np.meshgrid(np.linspace(0,width-1,89,dtype=np.float32),
                      np.linspace(0,height-1,89,dtype=np.float32))
    uv=np.stack([xx,yy],axis=-1)[:,:,None,:]
    delta=uv-dst
    weights=(np.sum(delta*delta,axis=-1)+40.)**-1.65
    weights/=weights.sum(axis=2,keepdims=True)
    w=weights[:,:,:,None]
    p=(dst*w).sum(axis=2)
    q=(src*w).sum(axis=2)
    dp=dst-p[:,:,None,:]
    dq=src-q[:,:,None,:]
    denom=np.maximum(.01,(w*dp*dp).sum(axis=(2,3)))
    a=(w*dp*dq).sum(axis=(2,3))/denom
    b=(weights*(dp[:,:,:,0]*dq[:,:,:,1]-dp[:,:,:,1]*dq[:,:,:,0])).sum(axis=2)/denom
    dx,dy=xx-p[:,:,0],yy-p[:,:,1]
    # Resize the displacement field to preserve exact pixel coordinates at rest.
    ddx=cv.resize(q[:,:,0]+a*dx-b*dy-xx,(width,height),interpolation=cv.INTER_CUBIC)
    ddy=cv.resize(q[:,:,1]+b*dx+a*dy-yy,(width,height),interpolation=cv.INTER_CUBIC)
    gy,gx=np.mgrid[0:height,0:width].astype(np.float32)
    return cv.remap(image,gx+ddx,gy+ddy,cv.INTER_LINEAR)


@lru_cache(maxsize=1)
def cycle(name):
    keys,points=poses(name,2,2)
    frames=[]
    for i,a in enumerate(keys):
        b=keys[(i+1)%len(keys)]
        pa,pb=map(controls,(points[i],points[(i+1)%len(keys)]))
        frames.append(a)
        for j in range(1,SUBFRAMES):
            t=j/SUBFRAMES
            mid=pa*(1-t)+pb*t
            cel,source=(a,pa) if t<.5 else (b,pb)
            frames.append(deform(cel,source,mid))
    return frames


@lru_cache(maxsize=1)
def rear_mounts():
    return poses("rear.png",2,2)[1]


def running(c,name,x,ground,height,phase,angle=0.,compress=1.,rig=None,leap=0.,surface=None,planted=None):
    if name=="side.png":
        side_model().draw(c,x,ground,height,phase,angle,compress,rig,leap,surface,planted)
        return
    frames=cycle(name)
    index=round(phase*len(frames))%len(frames)
    art=frames[index]
    sc=height/CEL_HEIGHT
    co,si=math.cos(angle),math.sin(angle)
    m=np.array([[co*sc,-si*sc*compress],[si*sc,co*sc*compress]])
    origin=np.array([x,ground])-m@np.array([SIZE/2,BASELINE])
    c.stamp(art,np.column_stack((m,origin)))
    if rig:
        first,sub=divmod(index,SUBFRAMES)
        keys=rear_mounts()
        pts=keys[first]+(keys[(first+1)%len(keys)]-keys[first])*(sub/SUBFRAMES)
        rig.mount(c,"camera",origin+m@(pts[1]+[35,-2]),21*sc,angle)
        rig.mount(c,"lidar",origin+m@(pts[0]+[0,0]),44*sc,angle)
        for side,ankle,toe in ((-1,11,12),(1,14,15)):
            foot=pts[toe]-pts[ankle]
            a=math.atan2(foot[1],foot[0])-math.pi/2
            rig.mount(c,"force",origin+m@(pts[toe]+[0,-3]),29*sc,angle+a,side)


@lru_cache(maxsize=1)
def side_model():
    return Profile()
