import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const project = new URL('../', import.meta.url);
const hasCampusPhotos = existsSync(new URL('study-photos/bohai/bohai-qiushi.webp', project));
const story = process.argv.includes('--story');
const rescue = process.argv.includes('--rescue');
const feature = process.argv.includes('--feature');
const page = feature ? '/film.html' : rescue ? '/rescue.html' : story ? '/story.html' : '/experiments/road-vision.html?sample=bohai-qiushi';

async function isReady(origin) {
  const options = { signal: AbortSignal.timeout(1200), redirect: 'error' };
  try {
    const response = await fetch(origin + page, options);
    const title = feature ? '<title>机器人总教练 · 奔跑的意义</title>' : rescue ? '<title>拯救初代机器人 · 第一关课堂样片</title>' : story ? '<title>机器人进化跑 · 剧情课堂</title>' : '<title>机器人看路 · RobotCoach</title>';
    if (!response.ok || !(await response.text()).includes(title)) return false;
    if (feature) return (await fetch(origin + '/assets/feature/ending.mp4',{...options,method:'HEAD'})).headers.get('content-type')==='video/mp4';
    if (rescue) return (await fetch(origin + '/assets/rescue/opening-v6.mp4',{...options,method:'HEAD'})).ok;
    if (story) return (await fetch(origin + '/assets/story/media/bend.mp4',{...options,method:'HEAD'})).headers.get('content-type')==='video/mp4';
    if (!hasCampusPhotos) return true;
    const catalog = await fetch(origin + '/study-photos/bohai/catalog.json', options);
    return catalog.ok && (await catalog.json()).some(item => item.file === 'bohai-qiushi.webp');
  } catch {
    return false;
  }
}

async function openPort(port) {
  const origin = 'http://127.0.0.1:' + port;
  if (await isReady(origin)) return origin;

  const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd: project,
    env: { ...process.env, PORT: String(port), SERVE_DIST: '0' },
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  });
  let stopped = false;
  server.once('error', () => { stopped = true; });
  server.once('exit', () => { stopped = true; });
  for (let attempt = 0; attempt < 24; attempt++) {
    await delay(150);
    if (await isReady(origin)) {
      server.unref();
      return origin;
    }
    if (stopped) return;
  }
  if (!stopped) server.kill();
}

const ports = new Set([Number(process.env.PORT), ...(feature ? [24871,24872,34871] : rescue ? [24861, 24862, 34861] : [14289, 24289, 34289])]);
let origin;
for (const port of ports) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) continue;
  origin = await openPort(port);
  if (origin) break;
}
if (origin) {
  console.log(origin + page);
} else {
  console.error((rescue?'第一关课堂':story?'剧情课堂':'路面识别')+'服务未能启动，请检查本机是否允许监听回环端口。');
  process.exitCode = 1;
}
