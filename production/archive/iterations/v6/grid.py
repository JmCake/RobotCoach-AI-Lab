from PIL import Image, ImageDraw
from pathlib import Path
d=Path(__file__).resolve().parents[2]/'final-race-video/films/robot-evolution/source/art'
for name,cols,rows in [('side',3,2),('hurdle-stride',3,2),('low-stride',2,2)]:
    im=Image.open(d/(name+'.png')).convert('RGBA').resize((cols*512,rows*512),Image.Resampling.LANCZOS)
    out=Image.new('RGB',im.size,(155,163,167));out.paste(im,mask=im.getchannel('A'));g=ImageDraw.Draw(out)
    for row in range(rows):
        for col in range(cols):
            x,y=col*512,row*512
            for v in range(0,512,50):
                g.line((x+v,y,x+v,y+512),fill=(74,117,121))
                g.line((x,y+v,x+512,y+v),fill=(74,117,121))
                g.text((x+v+1,y+3),str(v),fill='black')
                g.text((x+1,y+v+1),str(v),fill='black')
    out.save(Path(__file__).with_name(name+'-grid.jpg'),quality=94)
