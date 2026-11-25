"""Articulated cels of the same athlete. All visible panels come from the painted model."""
import math

import cv2 as cv
import numpy as np
from PIL import Image, ImageDraw

from paint import ART, premultiply, rotate

# Seams follow axle housings and armour edges on the 1086 × 1448 model sheet.
HEAD = [(270,0),(804,0),(800,304),(695,306),(651,331),(621,351),
        (463,351),(423,332),(382,315),(267,310)]
BODY = [(454,318),(624,318),(650,340),(685,337),(721,351),(735,383),
        (728,451),(762,488),(710,558),(668,590),(658,633),(697,652),
        (701,689),(664,721),(624,757),(583,814),(508,821),(468,769),
        (419,729),(379,699),(379,674),(393,638),(416,627),(407,584),
        (374,565),(326,497),(357,457),(350,393),(358,355),(394,340),(425,335)]
LEFT = {
    "upper": ([(138,321),(321,318),(355,349),(359,397),(348,469),
               (320,502),(306,540),(260,596),(222,624),(149,594),(134,550)], (303,441),(191,597)),
    "fore": ([(137,576),(195,565),(238,586),(237,625),(209,668),
              (151,770),(140,801),(78,807),(62,773),(71,676),(106,614)], (191,597),(118,784)),
    "hand": ([(80,761),(142,772),(157,801),(194,839),(192,879),(157,920),
              (91,931),(42,892),(43,837),(61,798)], (118,784),(113,877)),
    "thigh": ([(355,696),(387,697),(417,722),(456,763),(505,806),
               (499,859),(465,953),(441,993),(329,993),(310,919),(305,787)], (421,759),(381,1002)),
    "shin": ([(318,958),(347,934),(417,942),(456,974),(466,1020),
              (441,1071),(416,1179),(392,1265),(383,1299),(290,1305),
              (281,1258),(273,1125),(283,1052),(297,990)], (381,1002),(350,1274)),
    "foot": ([(286,1257),(317,1243),(377,1250),(400,1267),(406,1305),
              (432,1381),(414,1438),(233,1442),(228,1376),(265,1322)], (350,1274),(334,1409))
}


class Piece:
    def __init__(self, original, poly):
        mask = Image.new("L", original.size)
        ImageDraw.Draw(mask).polygon(poly, fill=255)
        rgba = original.copy()
        alpha = np.minimum(np.array(mask), np.array(original.getchannel("A")))
        rgba.putalpha(Image.fromarray(alpha))
        box = rgba.getbbox()
        self.offset = np.array(box[:2], dtype=float)
        self.image = premultiply(rgba.crop(box))

    def draw(self, canvas, a, b, start, end, width, opacity):
        ref = np.array(b, float) - a
        axis = ref / np.linalg.norm(ref)
        dest = np.array(end) - start
        dest_axis = dest / max(.0001, np.linalg.norm(dest))
        normal = np.array([-dest_axis[1], dest_axis[0]])
        matrix = (np.outer(dest / np.linalg.norm(ref), axis) +
                  np.outer(normal * width, [-axis[1], axis[0]]))
        canvas.stamp(self.image, np.column_stack((matrix, start + matrix @ (self.offset-a))), opacity)


def gait(values, phase):
    """Periodic cubic interpolation keeps velocity continuous at the loop seam."""
    n = len(values)
    value = phase % 1 * n
    i, t = int(value), value % 1
    a,b,c,d = (values[(i+j)%n] for j in (-1,0,1,2))
    return .5*(2*b + (-a+c)*t + (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t*t*t)


class Runner:
    def __init__(self):
        original = Image.open(ART/"runner.png").convert("RGBA")
        self.head = Piece(original, HEAD)
        self.body = Piece(original, BODY)
        self.parts = {}
        for side in (-1,1):
            def flip(p):
                return (1085-p[0], p[1]) if side == 1 else p
            for name, (poly, a, b) in LEFT.items():
                self.parts[side,name] = Piece(original,[flip(p) for p in poly]), flip(a), flip(b)

    def draw(self, canvas, x, floor, height, phase=0, run=1., lean=0.,
             crouch=0., reach=0., opacity=1., head_turn=0., contact_shadow=False,
             skid=0., rig=None):
        k = height / 1400
        ang = math.tau * phase
        hip_y = -644 + 114*run + 117*crouch + (15*math.cos(2*ang))*run
        rock = 17*math.sin(ang)*run

        def p(pos):
            # Ankle-centred whole-body tilt for loss of balance and banked turns.
            xx, yy = rotate(pos, lean)
            return np.array([x+xx*k, floor+yy*k])

        def draw(side, name, a, b, width):
            piece, src_a, src_b = self.parts[side,name]
            piece.draw(canvas,src_a,src_b,p(a),p(b),k*width,opacity)

        legs, arms = {}, {}
        for side in (-1,1):
            f = phase + (.5 if side == 1 else 0)
            knee_drop = gait([187,211,230,202,158,95,60,110],f)
            sole = gait([0,-5,-29,-84,-169,-222,-174,-76],f)
            foot_size = gait([1.10,1.04,.93,.81,.74,.82,.98,1.10],f)
            leg_width = 1 + run*(foot_size-1)
            hip = (side*100,hip_y)
            knee = (side*(143+run*gait([2,0,-14,-24,-32,-12,13,17],f))+rock*.25,
                    hip_y+251+run*(knee_drop-251)-34*crouch)
            ankle = (side*(190+run*gait([-56,-45,-33,-49,-83,-93,-66,-49],f)),
                     sole*run - 151*leg_width)
            if side == -1 and skid:
                # The loaded shoe slides on the loose shoulder before the pelvis follows.
                knee = (knee[0]-92*skid, knee[1]+24*skid)
                ankle = (ankle[0]-226*skid, ankle[1])
            toe = (ankle[0]+side*(14+run*9),ankle[1]+141*leg_width)
            legs[side] = hip,knee,ankle,toe,leg_width

            pump = -math.cos(math.tau*f)
            shoulder = (side*(232+7*run)+rock,hip_y-323+12*side*math.sin(ang)*run)
            elbow = (side*(346+(37-20*pump)*run)+rock,
                     hip_y-164+run*(18-38*pump))
            wrist = (side*(427+run*(-175-63*pump))+rock,
                     hip_y+28+run*(-126-115*pump))
            if reach:
                elbow = (elbow[0]+side*102*reach,elbow[1]-76*reach)
                wrist = (wrist[0]+side*268*reach,wrist[1]-145*reach)
            hand_dir = (side*(10-62*run-30*pump*run),93-125*run-54*pump*run)
            if reach:
                hand_dir = (hand_dir[0]+side*75*reach,hand_dir[1]-15*reach)
            if math.hypot(*hand_dir)<38:
                hand_dir=(side*-43,-17)
            scale_hand=1+.16*run*pump
            direction=math.atan2(hand_dir[1],hand_dir[0])
            finger=(wrist[0]+math.cos(direction)*93*scale_hand,
                    wrist[1]+math.sin(direction)*93*scale_hand)
            arms[side]=shoulder,elbow,wrist,finger,scale_hand

        if contact_shadow:
            for side,(h,n,a,e,sw) in legs.items():
                tx,ty=p(e)
                surface=ty if side == -1 and skid else floor
                gap=max(0., (surface-ty)/max(.01,k))
                if gap<94:
                    canvas.ellipse(tx,surface, k*(65-gap*.32),k*(11-gap*.04),(64,36,61))
        for side in sorted(legs,key=lambda s:legs[s][-1]):
            h,n,a,e,sw=legs[side]
            draw(side,"thigh",h,n,.93+sw*.07)
            draw(side,"shin",n,a,sw)
            draw(side,"foot",a,e,sw)
            if rig:
                rig.mount(canvas,"force",p((e[0], e[1]+9*sw)),154*k*sw,lean,side)
        for side in (-1,1):
            sh,el,wr,fi,sw=arms[side]
            draw(side,"upper",sh,el,1.)
        body_a=(rock,hip_y-326)
        body_b=(0,hip_y+37)
        self.body.draw(canvas,(543,425),(543,788),p(body_a),p(body_b),k*(1+.065*run),opacity)
        if rig:
            rig.mount(canvas,"imu",p((rock*.8,hip_y-259)),202*k,lean)
        face_x=rock*.8+head_turn*13
        head_a=(face_x,hip_y-420+run*18+crouch*20)
        head_b=(face_x+head_turn*10,head_a[1]-216)
        self.head.draw(canvas,(543,327),(543,76),p(head_a),p(head_b),k*(1.015-.035*abs(head_turn)),opacity)
        if rig:
            rig.mount(canvas,"camera",p((face_x-177,head_a[1]-83)),97*k,lean)
            rig.mount(canvas,"lidar",p((face_x+head_turn*10,head_a[1]-281)),184*k,lean)
        for side in sorted(arms,key=lambda s:arms[s][-1]):
            sh,el,wr,fi,sw=arms[side]
            draw(side,"fore",el,wr,.94+sw*.06)
            draw(side,"hand",wr,fi,sw)
