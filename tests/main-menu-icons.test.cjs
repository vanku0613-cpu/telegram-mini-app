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
  assert.match(html, /class="people zags-icon menu-action-icon"[^>]*>[\s\S]*?<svg/);
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

test('desktop bottom navigation stays equal and labels fit their buttons', () => {
  const js = fs.readFileSync(path.join(root, 'main-v2', 'main.js'), 'utf8');
  const infoCss = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
  assert.match(js, /var navLabels=/);
  assert.match(js, /label\.style\.fontSize=Math\.max\(9,/);
  assert.match(infoCss, /@media \(min-width:700px\), \(hover:hover\) and \(pointer:fine\)/);
  assert.match(infoCss, /#app \.currency-panel\{background:rgba\(2,22,43,\.62\)/);
});

test('secondary menu actions use one vector icon system while favorite stays intact', () => {
  assert.equal((html.match(/menu-action-icon/g) || []).length, 4);
  assert.match(html, /id="zagsBtn"[\s\S]*?menu-action-icon[\s\S]*?<svg/);
  assert.match(html, /id="groupsBtn"[\s\S]*?menu-action-icon[\s\S]*?<svg/);
  assert.match(html, /id="homeBtn"[\s\S]*?menu-action-icon[\s\S]*?<svg/);
  assert.match(html, /id="adsBtn"[\s\S]*?menu-action-icon[\s\S]*?<svg/);
  assert.match(html, /id="favBtn"><span class="nav-icon">☆<\/span>/);
  assert.match(css, /\.menu-action-icon\{[\s\S]*?color:#b8ecff/);
});
