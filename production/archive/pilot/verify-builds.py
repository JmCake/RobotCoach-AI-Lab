from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import subprocess


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        self.urls.extend(v for k, v in attrs if k in ('href', 'src') and v)


project = Path(__file__).resolve().parents[2] / 'final-race-video'
out = (project / 'dist').resolve()
assert out == Path('D:/AIcoding/RobotCoach-AI-Lab/final-race-video/dist').resolve()
assert out.parent == project
for command, book in [('build-motion.mjs', 'course.html'), ('build.mjs', 'index.html')]:
    subprocess.run(['node', str(project / 'scripts' / command)], cwd=project, check=True)
    assert 'href="story.html"' in (out / 'index.html').read_text(encoding='utf8')
    assert 'href="story.html"' in (out / book).read_text(encoding='utf8')
    parsed = Links()
    parsed.feed((out / 'story.html').read_text(encoding='utf8'))
    for u in parsed.urls:
        assert (out / urlsplit(u).path).is_file(), u
    for part in ('manual', 'imitation', 'training', 'showcase', 'design'):
        assert book + '#' + part in parsed.urls
    assert 'experiments/road-vision.html?sample=jiuzhaigou' in parsed.urls
    assert (out / 'assets/vision/samples/jiuzhaigou.webp').is_file()
    for m in ('bend.mp4', 'through.mp4', 'runner.webp', 'registration.json'):
        rel = Path('assets/story/media') / m
        assert (out / rel).stat().st_size == (project / rel).stat().st_size
    print(command, 'verified', len(parsed.urls), 'references, six experiments and both film excerpts', flush=True)
