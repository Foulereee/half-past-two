import {mkdir,copyFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
async function copyDirectory(source,target) {
  await mkdir(target,{recursive:true});
  for(const name of await readdir(source)) {
    const src=join(source,name),dest=join(target,name);
    if((await stat(src)).isDirectory()) await copyDirectory(src,dest);
    else await copyFile(src,dest);
  }
}
await copyDirectory(resolve(root,'public'),resolve(root,'dist'));
console.log('Built dist/ — ready for ESA Pages; functions/index.js is the edge entry.');
