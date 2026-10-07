const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const interiorPages = [
  'bessarabia-online/index.html',
  'communal-services/index.html',
  'health-care/index.html',
  'our-groups-menu/index.html',
  'products-food/index.html',
  'recreation/index.html',
  'services-masters/index.html',
  'soglashenie/index.html',
  'transport/index.html',
  'transport/bus-schedule/index.html',
  'transport/city-schedule/index.html',
  'transport/odessa-schedule/index.html',
  'ukrytia/index.html',
  'zags/index.html',
];

test('all public interior folders load screenshot branding while the main menu stays clean', () => {
  for (const file of interiorPages) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /brand-watermark\.css\?v=1/, file);
  }

  for (const file of ['index.html', 'main-v2/index.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(html, /brand-watermark\.css/, file);
  }
});

test('watermark identifies the directory without intercepting taps', () => {
  const css = fs.readFileSync(path.join(root, 'brand-watermark.css'), 'utf8');
  const data = css.match(/data:image\/svg\+xml,([^"]+)/);
  assert.ok(data, 'embedded watermark SVG');
  const svg = decodeURIComponent(data[1]);
  assert.match(svg, /СПРАВОЧНИК ИЗМАИЛ/);
  assert.match(svg, /@SPRAVOCHNIK_IZMAIL/);
  assert.match(css, /pointer-events:\s*none/);
  assert.match(css, /position:\s*fixed/);
});
