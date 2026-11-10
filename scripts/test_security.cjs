const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'waterloo-security-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const project = path.join(directory, 'project');
  await fs.mkdir(project);
  for (const file of ['index.html', 'styles.css', 'app.js', 'content.js', 'schedule.js', '_headers', 'assets']) {
    await fs.cp(path.join(root, file), path.join(project, file), { recursive: true });
  }
  await fs.mkdir(path.join(project, 'scripts'));
  await fs.copyFile(path.join(__dirname, 'build.mjs'), path.join(project, 'scripts', 'build.mjs'));
  await fs.mkdir(path.join(project, 'dist'));
  await fs.writeFile(path.join(project, 'dist', 'previous-build.txt'), 'preserve this build');
  return { directory, project };
}

test('menu photo paths cannot publish private files or destroy a previous build', async t => {
  const { project } = await fixture(t);
  await fs.writeFile(path.join(project, 'private.env'), 'PRIVATE_FIXTURE_ONLY');
  await fs.writeFile(path.join(project, 'content.js'), 'window.WATERLOO_DATA = { food: [{ items: [{ image: { src: "../private.env" } }] }] };');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: project, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid public photo path/);
  assert.deepEqual(await fs.readdir(path.join(project, 'dist')), ['previous-build.txt']);
});

test('a photo symlink cannot expose a file outside the project', async t => {
  const { project, directory } = await fixture(t);
  const privateFile = path.join(directory, 'private.env');
  await fs.writeFile(privateFile, 'PRIVATE_FIXTURE_ONLY');
  await fs.symlink(privateFile, path.join(project, 'assets', 'leak.jpg'));
  await fs.writeFile(path.join(project, 'content.js'), 'window.WATERLOO_DATA = { food: [{ items: [{ image: { src: "assets/leak.jpg" } }] }] };');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: project, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Public asset points outside the project/);
  assert.deepEqual(await fs.readdir(path.join(project, 'dist')), ['previous-build.txt']);
});
