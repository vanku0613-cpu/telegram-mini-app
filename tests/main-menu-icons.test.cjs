const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'main-v2', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'main-v2', 'main.css'), 'utf8');

test('every photo-backed main menu card has one compact vector icon', () => {
  assert.equal((html.match(/class="card-corner-icon"/g) || []).length, 8);
  assert.equal((html.match(/class="card pressable(?: compact expanded-label)?"/g) || []).length, 8);
  assert.match(html, /class="people zags-icon"[^>]*>[\s\S]*?<svg/);
  assert.doesNotMatch(html, /🏛/);
});

test('main menu artwork uses a restrained dark treatment and calm icon palette', () => {
  assert.match(css, /\.card-photo\s*\{[\s\S]*?brightness\(\.82\)/);
  assert.match(css, /\.card-overlay\s*\{[\s\S]*?linear-gradient/);
  assert.match(css, /\.card-corner-icon\s*\{[\s\S]*?color:#b8ecff/);
  assert.match(css, /\.card-corner-icon\s*\{[\s\S]*?width:clamp\(17px,4\.8cqw,23px\)/);
  assert.match(css, /\.card-copy\s*\{[\s\S]*?padding-left:clamp\(12px,3\.5cqw,16px\)/);
  assert.match(css, /\.card-copy\{left:17% !important;right:10% !important;padding-left:0;text-align:left\}/);
  assert.match(css, /\.card-corner-icon svg\s*\{/);
  assert.match(css, /\.search-real\s*\{[\s\S]*?border-color:rgba\(119,190,226,\.56\)/);
  assert.match(css, /\.weather-panel,[\s\S]*?\.currency-panel\s*\{[\s\S]*?border-color:rgba\(119,190,226,\.46\)/);
});
