import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const configuration = await readFile(join(dist, '_headers'), 'utf8');
const expected = new Map(configuration.split('\n').filter(line => /^  [A-Za-z][A-Za-z-]+:/.test(line))
  .map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()]; }));
for (const directive of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src 'none'", "frame-ancestors 'none'", "form-action 'none'"]) {
  assert(expected.get('content-security-policy').split(';').map(value => value.trim()).includes(directive), `Missing CSP directive: ${directive}`);
}
assert(!/unsafe-inline|unsafe-eval|https?:\/\//.test(expected.get('content-security-policy')), 'CSP must not permit inline/eval or external resources');
assert.equal(expected.get('x-content-type-options'), 'nosniff');
assert.equal(expected.get('x-frame-options'), 'DENY');
assert.equal(expected.get('referrer-policy'), 'no-referrer');
assert.equal(expected.get('strict-transport-security'), 'max-age=31536000');

const publicFiles = [];
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = prefix + entry.name;
    assert(!entry.isSymbolicLink(), `Unexpected public symlink: ${file}`);
    if (entry.isDirectory()) await walk(join(directory, entry.name), file + '/');
    else publicFiles.push(file);
  }
}
await walk(dist);
const allowedTopLevel = new Set(['index.html', 'styles.css', 'app.js', 'content.js', 'schedule.js', '_headers']);
for (const file of publicFiles) {
  assert(allowedTopLevel.has(file) || /^assets\/[a-z0-9-]+\.(jpg|png)$/.test(file) || /^assets\/fonts\/[a-z0-9-]+\.woff2$/.test(file) || /^assets\/fonts\/(barlowcondensed|dmsans|lobster)-OFL\.txt$/.test(file), `Unexpected public file: ${file}`);
}
const html = await readFile(join(dist, 'index.html'), 'utf8');
const css = await readFile(join(dist, 'styles.css'), 'utf8');
assert(!/\son\w+\s*=|\sstyle\s*=|<iframe\b|<form\b/i.test(html), 'Unexpected inline code, iframe, or form');
assert(!/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html), 'Unexpected inline script');
const resources = [...html.matchAll(/\bsrc="([^"]+)"/g)].map(match => match[1]);
resources.push(...[...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match => match[1]));
assert(!/@import\b/.test(css), 'External CSS imports are not allowed');
for (const file of resources) {
  assert(publicFiles.includes(file), `Missing or external resource: ${file}`);
}
console.log(`Security checks passed: strict CSP, ${publicFiles.length} public files, ${resources.length} local resource references.`);

if (process.argv.includes('--live')) {
  const origin = 'https://waterloo-louisville.pages.dev';
  const response = await fetch(origin, { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, 'Website is unavailable');
  for (const [name, value] of expected) assert.equal(response.headers.get(name), value, `Unexpected live header: ${name}`);
  assert.equal(response.headers.get('access-control-allow-origin'), null, 'Unexpected cross-origin resource sharing');
  assert.equal(await response.text(), html, 'Live HTML does not match the local build');
  const redirect = await fetch(origin.replace('https:', 'http:') + '/', { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  assert([301, 302, 307, 308].includes(redirect.status), 'HTTP did not redirect');
  assert.equal(redirect.headers.get('location'), origin + '/', 'HTTP did not redirect to HTTPS');
  for (const file of publicFiles.filter(file => file !== '_headers')) {
    const result = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(20000) });
    assert.equal(result.status, 200, `Unavailable live asset: ${file}`);
    assert.deepEqual(Buffer.from(await result.arrayBuffer()), await readFile(join(dist, file)), `Live asset differs: ${file}`);
  }
  console.log('Live checks passed: HTTPS redirect, security headers, and all public assets match the build.');
}
