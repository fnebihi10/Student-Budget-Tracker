const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.env.E2E_AUTHENTICATED === '1' ? 'dist-test' : 'dist-demo');
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let filename = path.resolve(root, `.${relative}`);
  if (!filename.startsWith(root + path.sep) && filename !== root) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) filename = path.join(root,'index.html');
  res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
  fs.createReadStream(filename).pipe(res);
}).listen(4173, '127.0.0.1', () => console.log('Pocketwise test server http://127.0.0.1:4173'));
