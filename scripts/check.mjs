import {readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
async function check(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())await check(path);
  else if(/\.(mjs|js)$/.test(path)){const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr||`Cannot check ${path}`);}
 }
}
for(const directory of ['assets','scripts','tests'])await check(directory);
console.log('JavaScript syntax checks passed.');
