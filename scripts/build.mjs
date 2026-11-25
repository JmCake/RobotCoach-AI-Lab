import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const target = resolve('dist');
if (target !== resolve('.') + '/dist' && !target.endsWith('\\dist')) throw new Error('Unexpected output path');
await rm(target,{recursive:true,force:true}); await mkdir(target);
for(const item of ['index.html','story.html','demo-motion.html','assets','experiments','LICENSE','THIRD_PARTY_NOTICES.md']) await cp(item,resolve(target,item),{recursive:true});
const campus = 'study-photos/bohai';
if (process.argv.includes('--with-campus')) {
  await cp(resolve(campus), resolve(target, campus), {recursive: true});
} else {
  await mkdir(resolve(target, campus), {recursive: true});
  await writeFile(resolve(target, campus, 'catalog.json'), '[]\n');
}
console.log('Built static V2.0 into dist/');
