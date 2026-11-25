"""Build the portable lesson using the standard library, from any directory."""
import base64
import json
import re
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parents[1]
mime = {'.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav'}


def data_uri(path):
    return 'data:' + mime[path.suffix.lower()] + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def source(name):
    return (here / name).read_text(encoding='utf-8')


def build():
    paths = json.loads(source('media.json'))
    images = {key: data_uri(root / path) for key, path in paths.items()}
    ui = source('classroom.js').replace('// @include bend', source('bend.js')).replace('// @include rescue', source('rescue.js'))
    parts = {'RESCUE': source('rescue.html'), 'MODEL': source('motion.js'), 'UI': ui,
             'CSS': source('classroom.css') + '\n' + source('projection.css'),
             'ASSETS': json.dumps(images, separators=(',', ':')), 'VOICE': data_uri(here / 'media/closing.ogg'),
             'LICENSE': (root / 'LICENSE').read_text(encoding='utf-8')}
    output = re.sub(r'@@([A-Z_]+)@@', lambda m: parts[m[1]], source('classroom.html.in'))
    for key in re.findall(r'data-img="([^"]+)"', output):
        if key not in images:
            raise ValueError(f'Missing slide art: {key}')
    (root / '机器人总教练-大屏精简版.html').write_bytes(output.encode('utf-8'))


if __name__ == '__main__':
    build()
