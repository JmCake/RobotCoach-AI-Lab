import http from 'node:http';
import {createReadStream} from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SERVE_DIST === '1' ? 'dist' : '.');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webm':'video/webm','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
Object.assign(mime, {
  '.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.onnx':'application/octet-stream',
  '.jpg':'image/jpeg','.zip':'application/zip','.mp4':'video/mp4',
});
http.createServer(async (req,res) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) throw new Error('path');
    const file = (await stat(path)).isDirectory() ? resolve(path,'index.html') : path;
    const extension = extname(file);
    if(extension==='.mp4'){
      const {size}=await stat(file);
      const range=req.headers.range;
      let start=0,end=size-1;
      if(range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(range);
        if(match&&(match[1]||match[2])){
          start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
          end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
        }else start=size;
        if(start>=size||start>end){
          res.writeHead(416,{'Content-Range':'bytes */'+size});res.end();return;
        }
        res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
      }
      res.writeHead(range?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes',
        'Content-Length':end-start+1,'Cache-Control':'no-cache'});
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(file,{start,end});
      res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);return;
    }
    const data = await readFile(file);
    if (extension === '.zip') res.setHeader('Content-Disposition', 'attachment');
    res.writeHead(200, {'Content-Type':mime[extension] || 'text/plain; charset=utf-8','Cache-Control':'no-cache'}); res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT' && req.url.split('?')[0] === '/study-photos/bohai/catalog.json') {
      res.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-cache'});
      res.end('[]');
      return;
    }
    res.writeHead(404); res.end('Not found');
  }
}).listen(Number(process.env.PORT || 4180),'127.0.0.1',() => console.log('RobotCoach: http://127.0.0.1:' + (process.env.PORT || 4180)));
