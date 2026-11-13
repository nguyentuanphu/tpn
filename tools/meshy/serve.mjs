// A small static file server for the auditor (faster than python -m http.server under load).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const ROOT = normalize(process.argv[2]), PORT = +process.argv[3] || 8765;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.webp': 'image/webp', '.txt': 'text/plain' };
createServer(async (q, r) => {
  try {
    const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); let f = normalize(join(ROOT, p));
    if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
    const b = await readFile(f); r.writeHead(200, { 'Content-Type': T[extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); r.end(b);
  } catch { r.writeHead(404); r.end(); }
}).listen(PORT, () => console.log('serving', ROOT, PORT));
