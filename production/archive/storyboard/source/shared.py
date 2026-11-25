import base64
import io
import json
from pathlib import Path
from PIL import Image

work=Path(__file__).resolve().parent
out=work.parent
root=work.parents[3]
site=root
media=site/'assets/story/media'
film=root/'films/robot-evolution'
art=film/'source/art'
hero=out/'art/starting-line.png'
loop=out/'art/bend-panels.png'
def data(blob,kind):
    return 'data:'+kind+';base64,'+base64.b64encode(blob).decode()
def picture(path,sz=1280):
    im=Image.open(path).convert('RGB')
    im.thumbnail((sz,sz))
    buf=io.BytesIO()
    im.save(buf,format='JPEG',quality=90,subsampling=0,optimize=True)
    return data(buf.getvalue(),'image/jpeg')
