import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import edge from '../functions/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const config=JSON.parse(await readFile(resolve(root,'esa.jsonc'),'utf8'));
assert.equal(config.entry,'./functions/index.js');
assert.equal(config.assets.directory,'./dist');
assert.equal(config.assets.notFoundStrategy,'singlePageApplication');
for(const name of ['public/index.html','public/styles.css','public/refinements.css','public/app.js','public/favicon.svg',config.entry])assert.ok((await stat(resolve(root,name))).isFile());
for(const path of ['/api/prompt','/api/health']) {
  const response=await edge.fetch(new Request(`https://test.example${path}`));
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const body=await response.json();
  if(path==='/api/prompt'){assert.equal(typeof body.prompt,'string');assert.ok(body.prompt.length>10);assert.equal(body.source,'esa-edge');}
  else {assert.equal(body.ok,true);assert.equal(body.storage,'browser-local');}
  const head=await edge.fetch(new Request(`https://test.example${path}`,{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
}
assert.equal((await edge.fetch(new Request('https://test.example/api/missing'))).status,404);
const post=await edge.fetch(new Request('https://test.example/api/prompt',{method:'POST'}));assert.equal(post.status,405);assert.equal(post.headers.get('Allow'),'GET, HEAD');
const html=await readFile(resolve(root,'public/index.html'),'utf8');
assert.ok(!/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html)); // Inline SVG namespaces are not remote dependencies.
assert.ok(html.includes('lang="zh-CN"'));
console.log('PASS: ESA configuration, static files, edge prompt/health, HEAD, 404 and 405.');
