const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html','main-v2/index.html','zags/index.html','ukrytia/index.html','transport/index.html',
  'transport/odessa-schedule/index.html','transport/city-schedule/index.html',
  'transport/bus-schedule/index.html','recreation/index.html','communal-services/index.html',
  'health-care/index.html','products-food/index.html','our-groups-menu/index.html',
  'soglashenie/index.html','services-masters/index.html'
];

test('every public page has a restrictive baseline policy', () => {
  for (const file of pages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /Content-Security-Policy/, file);
    assert.match(html, /object-src 'none'/, file);
    assert.match(html, /base-uri 'self'/, file);
    assert.match(html, /form-action 'none'/, file);
    assert.match(html, /name="referrer" content="no-referrer"/, file);
  }
  const home = fs.readFileSync(path.join(root, 'main-v2/index.html'), 'utf8');
  assert.match(home, /script-src 'self';/);
  assert.doesNotMatch(home, /script-src 'self' 'unsafe-inline'/);
  assert.doesNotMatch(home, /document\.write/);
});

test('one application-wide worker provides fast cached fallback', () => {
  const settings = fs.readFileSync(path.join(root, 'main-v2/settings.js'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(settings, /register\("\.\.\/sw\.js", \{ scope: "\.\.\/" \}\)/);
  assert.match(settings, /registration\.unregister/);
  assert.match(worker, /networkWithTimeout\(request, 4500\)/);
  assert.match(worker, /staleWhileRevalidate/);
  assert.match(worker, /cacheFirst/);
});

test('large seasonal artwork is served in compact WebP form', () => {
  for (const name of ['autumn-day','autumn-night','autumn','summer-day','summer-night','winter-day','winter-night','winter']) {
    const file = path.join(root, 'assets', `izmail-home-${name}.webp`);
    assert.ok(fs.existsSync(file), name);
    assert.ok(fs.statSync(file).size < 400000, `${name} should remain below 400 KB`);
  }
});

test('weather, currency and night effects use the new visual rules', () => {
  const html = fs.readFileSync(path.join(root, 'main-v2/index.html'), 'utf8');
  const info = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  const weather = fs.readFileSync(path.join(root, 'home-weather.css'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'main-v2/main.js'), 'utf8');
  assert.equal((html.match(/class="currency-symbol"/g) || []).length, 2);
  assert.match(info, /border:1\.6px solid var\(--line\)!important/);
  assert.match(weather, /\.scene-layer\.strong-wind/);
  assert.match(weather, /\.scene-layer\.after-rain \.rainbow-layer/);
  assert.match(weather, /\.scene-layer\.fog\.morning \.moving-clouds/);
  assert.match(main, /var leafCount=Math\.min\(28/);
  assert.match(main, /NIGHT_SEASON_IMAGES/);
});
