import posixpath
import re
from shared import *

files=['grid.webp','catch.webp','bend.mp4','stadium.webp','runner.webp','camera.webp','lidar.webp','imu.webp','force.webp','registration.json']
types={'.webp':'image/webp','.mp4':'video/mp4','.json':'application/json'}
assets={f:data((media/f).read_bytes(),types[Path(f).suffix]) for f in files}
imports={}
def include(name):
    key='rc/'+name
    if key in imports:return
    imports[key]=''
    content=(site/'assets'/name).read_text(encoding='utf-8')
    def replace_import(m):
        target=posixpath.normpath(posixpath.join(posixpath.dirname(name),m[1]))
        include(target)
        return "from 'rc/"+target+"'"
    content=re.sub(r"""from\s+['"](\.[^'"]+)['"]""",replace_import,content)
    content=content.replace("new URL('./grandstand.webp',import.meta.url).href","window.storyAssets['stadium.webp']")
    content=content.replace("new URL('media/'+name,import.meta.url).href","window.storyAssets[name]")
    imports[key]=data(content.encode(),'text/javascript')
include('motion/curve-trial.js')
include('story/track.js')
tags='<script>window.storyAssets='+json.dumps(assets)+'</script><script type="importmap">'+json.dumps({'imports':imports})+'</script>'
sample=(work/'sample.html').read_text(encoding='utf8').replace('<!--IMPORTS-->',tags)
license=(site/'LICENSE').read_text(encoding='utf8')
sample=sample.replace('</body>','<!-- Original simulator and renderer: '+license+' -->\n</body>')
(out/'第一关互动样片.html').write_text(sample,encoding='utf8')
