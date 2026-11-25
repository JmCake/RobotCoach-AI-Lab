// Keep the full course build, but make the standalone motion demo the shared homepage.
import './build.mjs';
import {cp,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const target=resolve('dist');
await cp(resolve(target,'index.html'),resolve(target,'course.html'));
const demoPath=resolve(target,'demo-motion.html');
const demo=(await readFile(demoPath,'utf8')).replace('href="index.html#trial"','href="course.html#trial"');
await writeFile(demoPath,demo);
await writeFile(resolve(target,'index.html'),demo);
const visionPath=resolve(target,'experiments','road-vision.html');
const vision=(await readFile(visionPath,'utf8')).replace('href="../index.html#workshop"','href="../course.html#workshop"');
await writeFile(visionPath,vision);
const storyPath=resolve(target,'story.html');
const story=(await readFile(storyPath,'utf8')).replaceAll('href="index.html#','href="course.html#');
await writeFile(storyPath,story);
await writeFile(resolve(target,'.nojekyll'),'');
console.log('Pages build: motion demo at / and /demo-motion.html; course at /course.html');
