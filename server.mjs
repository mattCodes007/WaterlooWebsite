import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
// Mirror the global Pages headers locally so preview catches CSP regressions.
const securityHeaders = Object.fromEntries((await readFile(resolve(root, '_headers'), 'utf8'))
  .split('\n').filter(line => /^  [A-Za-z][A-Za-z-]+:/.test(line))
  .map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()]; }));
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep) || !Object.hasOwn(types, extname(path))) {
      response.writeHead(404).end('Not found');
      return;
    }
    const content = await readFile(path);
    response.writeHead(200, { ...securityHeaders, 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store' });
    response.end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`The Waterloo: http://localhost:${port}`));
