import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const target = resolve('dist');
if (target !== resolve('.') + '/dist' && !target.endsWith('\\dist')) throw new Error('Unexpected output path');
await rm(target,{recursive:true,force:true}); await mkdir(target);
for(const item of ['index.html','assets','experiments','LICENSE','THIRD_PARTY_NOTICES.md']) await cp(item,resolve(target,item),{recursive:true});
console.log('Built static V1.0 into dist/');
