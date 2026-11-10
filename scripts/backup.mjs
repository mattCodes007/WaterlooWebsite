import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = join(root, 'backups', timestamp);
await mkdir(destination, { recursive: true });
// Explicit editable sources only: never copy credentials, dependencies, or Git metadata.
const files = ['index.html', 'styles.css', 'app.js', 'content.js', 'schedule.js', '_headers',
  'menu-edits.json', 'photo-menus.json', 'package.json', 'server.mjs', 'wrangler.jsonc',
  '.gitignore', 'README.md', 'SECURITY.md', 'scripts'];
for (const file of files) await cp(join(root, file), join(destination, 'source', file), { recursive: true });
await cp(join(root, 'dist'), join(destination, 'dist'), { recursive: true });
await cp(join(root, 'dist', 'assets'), join(destination, 'source', 'assets'), { recursive: true });
await writeFile(join(destination, 'backup.json'), JSON.stringify({ createdAt: timestamp, site: 'https://waterloo-louisville.pages.dev', sourceFiles: files }, null, 2) + '\n');
console.log(`Local source and deployment backup saved: ${destination}`);
