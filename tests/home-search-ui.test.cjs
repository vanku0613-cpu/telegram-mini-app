const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('home weather and currency stay readable inside their panels', () => {
  const html = read('main-v2/index.html');
  const css = read('home-info.css');
  assert.match(html, /<div class="info-title">Погода в Измаиле<\/div>/);
  assert.match(html, /class="weather-reading"><div class="weather-mini"[^>]*>[^<]+<\/div><div class="temp"/);
  assert.match(css, /\.weather-panel \.info-title,#app \.weather-panel \.condition\{[^}]*white-space:nowrap/);
  assert.match(css, /\.currency-panel \.info-title\{[^}]*font-size:[^}]*font-weight:950/);
  assert.match(css, /\.currency-panel \.rate\{[^}]*font-size:[^}]*font-weight:900/);
});

test('search hints are quiet and disappear on focus throughout the app', () => {
  const script = read('search-hints.js');
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /field\.placeholder = ""/);
  assert.match(script, /field\.placeholder = field\.dataset\.searchHint/);
  for (const file of ['main-v2/index.html', 'health-care/index.html', 'transport/index.html', 'ukrytia/index.html']) {
    assert.match(read(file), /search-hints\.js\?v=1/, `${file} does not load shared search behavior`);
  }
  const sharedCss = read('interior-polish.css');
  const homeCss = read('home-info.css');
  assert.match(sharedCss, /input::placeholder\s*\{[^}]*opacity:\s*\.58/);
  assert.match(sharedCss, /input:focus::placeholder\s*\{[^}]*opacity:\s*0/);
  assert.match(homeCss, /\.search-real::placeholder\{[^}]*rgba\(205,226,240,\.52\)/);
});
