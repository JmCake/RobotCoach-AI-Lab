"""Compositing in a 1280 × 720 design space. Sprites use premultiplied alpha."""
from functools import lru_cache
from pathlib import Path
import math
import os

import cv2 as cv
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ART = Path(__file__).resolve().parent / "art"
INK = (20, 27, 51)
CYAN = (70, 239, 255)
WHITE = (249, 251, 255)
GOLD = (255, 218, 87)


def ease(a, b, t):
    u = max(0., min(1., (t - a) / (b - a)))
    return u * u * (3 - 2 * u)


def rotate(point, angle):
    x, y = point
    c, s = math.cos(angle), math.sin(angle)
    return x * c - y * s, x * s + y * c


def premultiply(image):
    data = np.array(image.convert("RGBA"))
    data[:, :, :3] = (data[:, :, :3].astype(np.uint16) *
                      data[:, :, 3:4] // 255).astype(np.uint8)
    return data


@lru_cache(maxsize=160)
def sprite(name):
    return premultiply(Image.open(ART / name))


@lru_cache(maxsize=12)
def plate(name):
    return np.array(Image.open(ART / name).convert("RGB"))


@lru_cache(maxsize=50)
def font(size):
    choices = [os.environ.get("ROBOTCOACH_FONT"),
               "C:/Windows/Fonts/msyhbd.ttc",
               "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
               "/System/Library/Fonts/PingFang.ttc"]
    for path in filter(None, choices):
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    raise RuntimeError("Set ROBOTCOACH_FONT to a Chinese bold OpenType font.")


@lru_cache(maxsize=150)
def lettering(words, size, fill, stroke, outline):
    face = font(size * 2)
    box = face.getbbox(words, stroke_width=stroke * 2)
    im = Image.new("RGBA", (box[2] - box[0] + 8, box[3] - box[1] + 8))
    ImageDraw.Draw(im).text((4 - box[0], 4 - box[1]), words, font=face,
                            fill=fill, stroke_width=stroke * 2, stroke_fill=outline)
    return premultiply(im)


class Canvas:
    def __init__(self, width):
        self.s = width / 1280
        self.w, self.h = width, round(720 * self.s)
        self.rgb = np.zeros((self.h, self.w, 3), dtype=np.uint8)

    def background(self, name, zoom=1., focus=(640, 360), shift=(0., 0.)):
        art = plate(name)
        ah, aw = art.shape[:2]
        sx, sy = self.w / aw * zoom, self.h / ah * zoom
        tx = (focus[0] * (1 - zoom) + shift[0]) * self.s
        ty = (focus[1] * (1 - zoom) + shift[1]) * self.s
        m = np.float32([[sx, 0, tx], [0, sy, ty]])
        self.rgb = cv.warpAffine(art, m, (self.w, self.h), flags=cv.INTER_LINEAR,
                                 borderMode=cv.BORDER_REPLICATE)

    def stamp(self, art, mat, opacity=1.):
        if opacity <= .001:
            return
        m = np.float32(mat) * self.s
        h, w = art.shape[:2]
        corners = np.float32([[0, 0, 1], [w, 0, 1], [w, h, 1], [0, h, 1]]) @ m.T
        x0, y0 = np.maximum([0, 0], np.floor(corners.min(axis=0)).astype(int) - 1)
        x1, y1 = np.minimum([self.w, self.h], np.ceil(corners.max(axis=0)).astype(int) + 1)
        if x1 <= x0 or y1 <= y0:
            return
        m[:, 2] -= [x0, y0]
        piece = cv.warpAffine(art, m, (x1 - x0, y1 - y0), flags=cv.INTER_LINEAR)
        if opacity < .999:
            piece = cv.convertScaleAbs(piece, alpha=opacity)
        back = self.rgb[y0:y1, x0:x1]
        alpha = np.repeat((255 - piece[:, :, 3:4]), 3, axis=2)
        cv.add(piece[:, :, :3], cv.multiply(back, alpha, scale=1 / 255), dst=back)

    def paste(self, art, x, y, scale=1., anchor=(0., 0.), angle=0., opacity=1.):
        c, s = scale * math.cos(angle), scale * math.sin(angle)
        ax, ay = anchor
        self.stamp(art, [[c, -s, x - c * ax + s * ay],
                         [s, c, y - s * ax - c * ay]], opacity)

    def points(self, points):
        return np.int32(np.round(np.asarray(points) * self.s * 16))

    def poly(self, points, color):
        cv.fillPoly(self.rgb, [self.points(points)], color, cv.LINE_AA, shift=4)

    def line(self, points, color, width=2, closed=False):
        cv.polylines(self.rgb, [self.points(points)], closed, color,
                     max(1, round(width * self.s)), cv.LINE_AA, shift=4)

    def ellipse(self, x, y, rx, ry, color, width=-1):
        cv.ellipse(self.rgb, (round(x * self.s * 16), round(y * self.s * 16)),
                   (max(1, round(rx * self.s * 16)), max(1, round(ry * self.s * 16))),
                   0, 0, 360, color, -1 if width < 0 else max(1, round(width*self.s)),
                   cv.LINE_AA, shift=4)

    def text(self, words, x, y, size=30, fill=WHITE, stroke=0, outline=INK,
             align=0., opacity=1., scale=1.):
        art = lettering(words, size, fill, stroke, outline)
        self.paste(art, x, y, .5 * scale, (art.shape[1] * align, 0), opacity=opacity)


@lru_cache(maxsize=16)
def bubble_art(title, detail, trim=CYAN):
    """Ink, neon bevel and offset print shadow echo the projection's teaching inserts."""
    scale = 2
    w = max(350, round(max(font(36).getlength(title), font(23).getlength(detail)) + 85))
    h = 111
    im = Image.new("RGBA", ((w + 14) * scale, (h + 14) * scale))
    d = ImageDraw.Draw(im)

    def shape(points, fill, border=None, line=1):
        xy = [(round(x*scale), round(y*scale)) for x, y in points]
        d.polygon(xy, fill=fill)
        if border:
            d.line(xy + [xy[0]], fill=border, width=line*scale, joint="curve")

    edge = [(24, 3), (w-31, 3), (w-22, 10), (w-5, 10), (w, 17),
            (w, h-25), (w-19, h-7), (w-80, h-7), (w-91, h-2),
            (12, h-2), (3, h-11), (3, 24)]
    shape([(x+6, y+5) for x, y in edge], (18, 16, 49, 195))
    shape(edge, (19, 33, 72, 250), (31, 108, 196), 6)
    shape(edge, (19, 33, 72, 249), trim, 3)
    d.line([(26*scale, 14*scale), ((w-51)*scale, 14*scale)], fill=(55,114,159), width=scale)
    d.text((28*scale, 13*scale), title, font=font(36*scale), fill=WHITE, anchor="lt")
    d.text((29*scale, 66*scale), detail, font=font(23*scale), fill=trim, anchor="lt")
    return premultiply(im)


def bubble(canvas, title, detail, x, y, t, trim=CYAN):
    amount = ease(0, .25, t)
    art = bubble_art(title, detail, trim)
    canvas.paste(art, x + (1-amount)*29, y, .5 * (.89+.11*amount), opacity=amount)
