import { cp, mkdir, readFile, realpath, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const files = ['index.html', 'styles.css', 'content.js', 'schedule.js', 'app.js', '_headers'];
const fonts = [
  'barlow-condensed-600-latin', 'barlow-condensed-600-latin-ext',
  'barlow-condensed-700-latin', 'barlow-condensed-700-latin-ext',
  'barlow-condensed-800-latin', 'barlow-condensed-800-latin-ext',
  'dm-sans-400-latin', 'dm-sans-400-latin-ext',
  'lobster-400-latin', 'lobster-400-latin-ext',
].map(name => `assets/fonts/${name}.woff2`);
const licenses = ['barlowcondensed', 'dmsans', 'lobster'].map(name => `assets/fonts/${name}-OFL.txt`);
const sandbox = { window: {} };
vm.runInNewContext(await readFile(join(root, 'content.js'), 'utf8'), sandbox);
const data = sandbox.window.WATERLOO_DATA;
const photos = new Set(['assets/waterloo-burger.jpg', 'assets/waterloo-logo.png', 'assets/favicon-32x32.png', 'assets/favicon-16x16.png', 'assets/apple-touch-icon.png', 'assets/waterloo-story.jpg', 'assets/waterloo-atmosphere.jpg']);
for (const section of data.food) {
  for (const item of section.items) if (item.image) photos.add(item.image.src);
}
// Validate every public file before replacing a previous build.
const publicFiles = [...files, ...photos, ...fonts, ...licenses];
for (const file of photos) {
  if (!/^assets\/[a-z0-9-]+\.(jpg|png)$/.test(file)) throw new Error(`Invalid public photo path: ${file}`);
}
const sourceRoot = await realpath(root);
for (const file of publicFiles) {
  const source = await realpath(join(root, file));
  if (!source.startsWith(sourceRoot + sep)) throw new Error(`Public asset points outside the project: ${file}`);
  await readFile(source);
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  await mkdir(dirname(join(output, file)), { recursive: true });
  await cp(join(root, file), join(output, file));
}
console.log(`Cloudflare Pages build: ${publicFiles.length} public files in dist/ (including security headers and local fonts).`);
console.log('Only public website assets are included.');
