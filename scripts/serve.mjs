import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const request = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const base = request.startsWith('/evidence/') || request.startsWith('/tickets/') ? root : path.join(root, 'rendered');
  let target = path.resolve(base, '.' + request);
  if (!target.startsWith(base + path.sep) && target !== base) { res.writeHead(403).end(); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'text/plain; charset=utf-8' });
  fs.createReadStream(target).pipe(res);
});
server.listen(4173, '127.0.0.1', () => console.log('Local review: http://127.0.0.1:4173/kb/incidents/4471-analysis/'));
