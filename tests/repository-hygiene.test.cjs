const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ignoredParts = new Set(['.git', '_site', 'node_modules', 'research', 'vendor']);

function walk(dir, extension) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredParts.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, extension));
    else if (!extension || full.endsWith(extension)) out.push(full);
  }
  return out;
}

function localTarget(owner, raw) {
  if (!raw || /^(?:[a-z]+:|#|\/\/)/i.test(raw)) return null;
  const clean = raw.split('#', 1)[0].split('?', 1)[0];
  if (!clean || clean.includes('${') || clean.includes('{{')) return null;
  let decoded;
  try { decoded = decodeURIComponent(clean); } catch { decoded = clean; }
  const target = decoded.startsWith('/')
    ? path.join(root, decoded.replace(/^\/+/, ''))
    : path.resolve(path.dirname(owner), decoded);
  return target;
}

test('all static HTML and CSS file references resolve inside the project', () => {
  const missing = [];
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.html' && ext !== '.css') continue;
    const source = fs.readFileSync(file, 'utf8');
    const values = [];
    if (ext === '.html') {
      for (const match of source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) values.push(match[1]);
    } else {
      for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) values.push(match[1]);
    }
    for (const value of values) {
      const target = localTarget(file, value);
      if (!target) continue;
      if (!target.startsWith(root + path.sep) && target !== root) {
        missing.push(`${path.relative(root, file)} -> outside project: ${value}`);
        continue;
      }
      const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory()
        ? path.join(target, 'index.html')
        : target;
      if (!fs.existsSync(resolved)) missing.push(`${path.relative(root, file)} -> ${value}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('HTML pages do not contain duplicate element ids', () => {
  const duplicates = [];
  for (const file of walk(root, '.html')) {
    const source = fs.readFileSync(file, 'utf8');
    const seen = new Set();
    for (const match of source.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) {
      if (seen.has(match[1])) duplicates.push(`${path.relative(root, file)} -> ${match[1]}`);
      seen.add(match[1]);
    }
  }
  assert.deepEqual(duplicates, []);
});

test('service worker shell contains only existing public files', () => {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const shell = worker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(shell, 'APP_SHELL list should exist');
  const missing = [];
  for (const match of shell[1].matchAll(/["'](\.\/?[^"']+)["']/g)) {
    const clean = match[1].split('?', 1)[0].replace(/^\.\//, '');
    const target = path.join(root, clean || 'index.html');
    const resolved = fs.existsSync(target) && fs.statSync(target).isDirectory()
      ? path.join(target, 'index.html')
      : target;
    if (!fs.existsSync(resolved)) missing.push(match[1]);
  }
  assert.deepEqual(missing, []);
  for (const largeData of ['health-care/data.json', 'directory-search-extra.json', 'transport/schedule-search.json']) {
    assert.equal(shell[1].includes(largeData), false, `${largeData} should load only when its feature opens`);
  }
  assert.equal((shell[1].match(/izmail-home-[^"']+\.webp/g) || []).length, 1, 'only the offline fallback background should be preloaded');
});

test('legacy heavyweight artwork is not kept beside optimized runtime media', () => {
  const forbidden = [
    'izmail-home-autumn-day.png', 'izmail-home-winter.png', 'izmail-home-winter-day.png',
    'izmail-home-autumn.png', 'izmail-home-winter-night.png', 'izmail-home-summer-day.png',
    'izmail-home-autumn-night.png', 'izmail-home-summer-night.png'
  ];
  for (const name of forbidden) {
    assert.equal(fs.existsSync(path.join(root, 'assets', name)), false, name);
  }
  assert.equal(fs.existsSync(path.join(root, 'health-care', 'media', 'beauty-cover.jpg')), false, 'unused beauty cover');
  const schedule = path.join(root, 'assets', 'schedule-cities');
  for (const name of fs.readdirSync(schedule)) {
    assert.ok(name === 'villages.jpg' || !name.endsWith('.jpg'), `legacy schedule image: ${name}`);
  }
});

test('Pages artifact excludes development and research material', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'update-frank-rates.yml'), 'utf8');
  for (const value of ['.gitignore', 'tests', 'tools', 'scripts', 'health-care/research', '*.md', '*.txt', '*.cjs', '*.mjs']) {
    assert.match(workflow, new RegExp(`--exclude='${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
});
