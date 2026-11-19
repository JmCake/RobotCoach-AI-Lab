// Keep the full course build, but make the standalone motion demo the shared homepage.
import './build.mjs';
import {cp,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const target=resolve('dist');
await cp(resolve(target,'index.html'),resolve(target,'course.html'));
await cp(resolve(target,'demo-motion.html'),resolve(target,'index.html'));
await writeFile(resolve(target,'.nojekyll'),'');
console.log('Pages build: motion demo at / and /demo-motion.html; course at /course.html');
