"""Side-on sprint. Inked limb segments rotate about the painted mechanical axles."""
import math
import numpy as np
from PIL import Image

from paint import ART, rotate
from runner import Piece, gait

# Drawn cel one provides the silhouettes. The other exposures establish the
# extension, stance, recovery and knee-drive positions in the tracking camera.
PARTS={
 "far_thigh": ([(164,178),(203,187),(198,222),(151,269),(127,272),(124,244)],(180,202),(139,257)),
 "far_shin": ([(130,246),(151,249),(156,269),(127,280),(66,312),(47,298),(49,281),(107,251)],(139,257),(66,296)),
 "far_boot": ([(35,277),(68,277),(84,289),(77,313),(60,336),(62,365),(35,366),(24,332)],(66,296),(49,350)),
 "near_thigh": ([(171,181),(208,178),(231,207),(274,233),(282,254),(266,274),(242,272),(205,249),(168,231),(156,210)],(186,202),(254,255)),
 "near_shin": ([(240,243),(266,230),(283,246),(285,270),(321,308),(327,334),(308,345),(287,319),(248,288)],(254,255),(311,327)),
 "near_boot": ([(300,310),(320,309),(328,320),(349,304),(373,309),(380,328),(348,358),(314,366),(293,347)],(311,327),(356,316)),
 "far_upper": ([(225,102),(250,105),(279,123),(292,150),(278,166),(260,159),(232,137)],(238,113),(279,155)),
 "far_fore": ([(264,151),(277,141),(296,122),(314,109),(326,122),(311,145),(288,169),(274,172)],(279,155),(311,125)),
 "far_fist": ([(296,102),(305,87),(325,84),(342,104),(342,122),(321,139),(300,127)],(311,125),(322,105)),
 "near_upper": ([(154,84),(175,76),(202,78),(221,94),(220,121),(200,134),(177,128),(153,118),(134,121),(122,109),(125,93)],(195,102),(135,105)),
 "near_fore": ([(120,95),(141,92),(154,106),(144,125),(133,154),(119,162),(106,147),(110,121)],(135,105),(119,151)),
 "near_fist": ([(106,146),(130,142),(141,154),(147,172),(133,189),(110,186),(99,172)],(119,151),(124,175)),
 "shell": ([(195,81),(236,77),(253,97),(266,118),(271,150),(254,170),
            (233,176),(217,198),(199,218),(171,231),(155,219),(160,196),
            (177,177),(181,157),(174,144),(168,119)],(185,201),(231,92)),
 "head": ([(164,0),(316,0),(315,82),(285,106),(264,112),(233,103),
           (218,86),(187,79),(168,60)],(230,91),(246,16))
}


class Profile:
    def __init__(self):
        atlas=Image.open(ART/"side.png").convert("RGBA")
        cell=atlas.crop((0,0,atlas.width//3,atlas.height//2))
        k=cell.width/400
        self.source_scale=k
        self.parts={}
        for name,(outline,a,b) in PARTS.items():
            points=[(round(x*k),round(y*k)) for x,y in outline]
            self.parts[name]=Piece(cell,points),np.array(a)*k,np.array(b)*k

    def draw(self,c,x,ground,height,phase,pitch,compress,rig=None,leap=0.,surface=None,planted=None):
        k=height/358
        wave=math.tau*phase
        bob=-5*math.cos(2*wave)
        hip=np.array([186+2*math.sin(wave),202+bob])
        tuck=max(0.,math.sin(math.pi*leap))**1.1
        neck=hip+[45+2*math.sin(wave)+11*tuck,-109-7*tuck]

        def screen(point):
            xx,yy=rotate((point[0]-186,(point[1]-357)*compress),pitch)
            return np.array([x+xx*k,ground+yy*k])

        def stamp(part,start,end):
            cel,src,dest=self.parts[part]
            cel.draw(c,src,dest,screen(start),screen(end),k/self.source_scale,1.)

        def leg(side,offset):
            t=phase+offset
            knee=hip+[gait([68,52,11,-32,-48,-21,40,66],t),
                      gait([54,51,60,66,55,28,-4,11],t)]
            ankle=np.array([gait([311,241,171,96,66,87,178,257],t),
                            gait([327,333,334,320,296,249,253,269],t)])
            # Toe rotates on the ankle with the flexion of the foot at take-off.
            angle=gait([-.24,.36,.41,1.04,1.87,1.79,.79,.36],t)
            if tuck:
                if side=="near":
                    high_knee=hip+[75,-36]
                    high_ankle=hip+[148,-28+14*leap]
                    pointed=-.32
                else:
                    high_knee=hip+[-58,48]
                    high_ankle=hip+[-117,-3]
                    pointed=1.98
                knee=knee*(1-tuck)+high_knee*tuck
                ankle=ankle*(1-tuck)+high_ankle*tuck
                angle=angle*(1-tuck)+pointed*tuck
            toe=ankle+[48*math.cos(angle),48*math.sin(angle)]
            if surface:
                sole=ankle+[23*math.cos(angle)-20*math.sin(angle),23*math.sin(angle)+20*math.cos(angle)]
                sx,sy=screen(sole)
                hold=planted[1] if planted and side=="near" else 0.
                if hold:
                    follow=(planted[0]-sx)/k*hold
                    ankle[0]+=follow
                    toe[0]+=follow
                    knee[0]+=.45*follow
                    sx,sy=screen(sole+[follow,0])
                # Give the stance boot a planted contact on the ground profile.
                proximity=max(0.,min(1.,(sole[1]-283)/48))
                correction=(surface(sx)-sy)/(k*compress)*max(proximity,hold)
                ankle[1]+=correction
                toe[1]+=correction
                knee[1]+=.38*correction
            stamp(side+"_thigh",hip,knee)
            stamp(side+"_shin",knee,ankle)
            stamp(side+"_boot",ankle,toe)
            if rig:
                sole=ankle+[23*math.cos(angle)-20*math.sin(angle),23*math.sin(angle)+20*math.cos(angle)]
                rig.mount(c,"force",screen(sole),67*k,pitch+angle,-1 if side=="far" else 1)

        def arm(side,offset,shoulder):
            pump=(1-math.cos(wave+offset*math.tau))/2
            upper=3.04-2.21*pump
            lower=1.84-2.57*pump
            if tuck:
                upper=upper*(1-tuck)+(2.94 if side=="near" else .28)*tuck
                lower=lower*(1-tuck)+(1.76 if side=="near" else -1.09)*tuck
            elbow=shoulder+[60*math.cos(upper),60*math.sin(upper)]
            wrist=elbow+[48*math.cos(lower),48*math.sin(lower)]
            tip=wrist+[25*math.cos(lower-.12),25*math.sin(lower-.12)]
            stamp(side+"_upper",shoulder,elbow)
            stamp(side+"_fore",elbow,wrist)
            stamp(side+"_fist",wrist,tip)

        leg("far",.5)
        arm("far",.5,neck+[6,20])
        leg("near",0)
        stamp("shell",hip,neck)
        if rig:
            rig.mount(c,"imu",screen(neck+[12,32]),37*k,pitch-.20)
        arm("near",0,neck+[-36,10])
        stamp("head",neck,neck+[16+math.sin(wave),-75])
        if rig:
            rig.mount(c,"camera",screen(neck+[-5,-38]),28*k,pitch+.16)
            rig.mount(c,"lidar",screen(neck+[12,-79]),53*k,pitch+.12)
