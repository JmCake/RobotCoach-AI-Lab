from pathlib import Path
import sys
from PIL import Image, ImageDraw
import cv2

root=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution'
sys.path.insert(0,str(root/'source'))
import classroom, comic_training as comic
from paint import Canvas
out=Path(__file__).parent
cv2.setNumThreads(2)
c=Canvas(1280)
frames=[('r6',348),('r6',371),('r3',340),('r3',373),('r7',365),('r7',390),('r36',352),
        ('r36',388),('r36',532),('r246',525),('r246',540),('test',548)]
sheet=Image.new('RGB',(3*448,4*274),(20,24,46));d=ImageDraw.Draw(sheet)
for i,(id,tick) in enumerate(frames):
    comic.draw(c,classroom.CLIPS[id],tick)
    img=Image.fromarray(c.rgb)
    img.save(out/f'stage-{id}-{tick}.jpg',quality=93)
    x,y=(i%3)*448,(i//3)*274
    sheet.paste(img.resize((448,252),Image.Resampling.LANCZOS),(x,y))
    d.text((x+8,y+253),f'{id} - {tick}',fill='white')
sheet.save(out/'stage.jpg',quality=93)
