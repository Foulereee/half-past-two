// Explicit one-time repository creation. Uses Git Credential Manager in memory only.
// Usage: node scripts/create-github-repo.mjs --create
import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';

if(!process.argv.includes('--create')) {
  console.log('To create the private Foulereee/half-past-two repository, run with --create.');
  process.exit(0);
}
const result=spawnSync('git',['credential','fill'],{
  input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',timeout:15000,windowsHide:true,
  env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}
});
const fields=Object.fromEntries((result.stdout||'').trim().split('\n').filter(line=>line.includes('=')).map(line=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1).trim()];}));
if(!fields.password)throw new Error('No signed-in GitHub account found in Git Credential Manager.');
const headers={Authorization:`Bearer ${fields.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'half-past-two-local'};
async function api(path,options={}) {
  const response=await fetch(`https://api.github.com${path}`,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(20000)});
  const data=await response.json();return {response,data};
}
const user=await api('/user');
if(user.response.status!==200 || user.data.login!=='Foulereee')throw new Error('Expected the signed-in account Foulereee.');
const existing=await api('/repos/Foulereee/half-past-two');
if(existing.response.status===200)throw new Error('Repository already exists; no existing repository was changed.');
if(existing.response.status!==404)throw new Error(`Repository lookup failed (${existing.response.status}).`);
const created=await api('/user/repos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'half-past-two',description:'凌晨两点半 · 深夜灵感日历，支持阿里云 ESA Pages 与边缘函数',private:true,auto_init:false})});
if(created.response.status!==201)throw new Error(`Repository creation failed (${created.response.status}): ${created.data.message||'request rejected'}`);
const info={owner:created.data.owner.login,name:created.data.name,url:created.data.html_url,cloneUrl:created.data.clone_url,visibility:created.data.private?'private':'public',branch:'main'};
await writeFile(new URL('../github-repository.json',import.meta.url),JSON.stringify(info,null,2)+'\n','utf8');
console.log(JSON.stringify(info));
