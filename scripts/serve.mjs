import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import edge from '../functions/index.js';

const root=fileURLToPath(new URL('../public/',import.meta.url));
const port=Number(process.env.PORT || 4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')) {
      const response=await edge.fetch(new Request(url,{method:req.method}));
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
    const pathname=decodeURIComponent(url.pathname);
    let path=resolve(root,`.${pathname}`);
    if(path!==resolve(root) && !path.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
    try {if((await stat(path)).isDirectory())path=resolve(path,'index.html');}
    catch {if(!extname(path))path=resolve(root,'index.html');}
    const content=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:content);
  } catch(error) {res.writeHead(error.code==='ENOENT'?404:400,{'Content-Type':'text/plain; charset=utf-8'});res.end('页面暂时没有找到。');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is occupied. Set PORT to another port.`:error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nESA-compatible APIs: /api/prompt, /api/health\nPress Ctrl+C to stop.`));
