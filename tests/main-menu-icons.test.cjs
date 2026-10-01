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

test('menu cards use a calm resting border and a readable label scrim', () => {
  assert.match(css, /\.cards \.card\{[\s\S]*?border-width:1\.25px;[\s\S]*?border-color:rgba\(116,181,216,\.60\)/);
  assert.match(css, /\.cards \.card-overlay\{[\s\S]*?rgba\(1,12,28,\.72\)/);
  assert.match(css, /\.cards \.card-copy strong\{[\s\S]*?color:#f7fbff/);
  assert.match(css, /\.groups-row \.groups\{[\s\S]*?border-width:1\.25px/);
  assert.match(css, /\.cards \.card:focus-visible,\.groups-row \.groups:focus-visible/);
});

test('group shortcuts and information panels share restrained professional surfaces', () => {
  const infoCss = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  assert.match(css, /#zagsBtn\{[\s\S]*?radial-gradient/);
  assert.match(css, /#groupsBtn\{[\s\S]*?radial-gradient/);
  assert.match(infoCss, /#app \.weather-panel\{[\s\S]*?rgba\(118,181,211,\.50\)/);
  assert.match(infoCss, /#app \.currency-panel\{[\s\S]*?rgba\(118,181,211,\.50\)/);
  assert.match(infoCss, /#app \.search-real\{[\s\S]*?rgba\(126,148,162,\.48\)/);
  assert.match(infoCss, /#app \.search-real::placeholder\{[\s\S]*?rgba\(232,236,239,\.76\)/);
});

test('desktop typography is capped without changing phone rules', () => {
  const infoCss = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  assert.match(css, /Desktop typography is intentionally capped/);
  assert.match(css, /#app \.cards \.card-copy strong\{font-size:clamp\(13px,3cqw,16px\)/);
  assert.match(css, /#app \.groups-row \.groups-title\{font-size:clamp\(12px,2\.75cqw,15px\)/);
  assert.match(infoCss, /Desktop-only fit/);
  assert.match(infoCss, /#app\{--info-growth:24px\}/);
  assert.match(infoCss, /#app \.weather-panel \.info-title\{height:auto;min-height:0;font-size:8\.7px!important/);
  assert.match(infoCss, /#app \.currency-panel \.info-title\{font-size:8\.6px!important/);
});

test('every main card description remains fully visible', () => {
  const js = fs.readFileSync(path.join(root, 'main-v2', 'main.js'), 'utf8');
  assert.match(css, /\.cards \.card-copy small\{[\s\S]*?width:125%;[\s\S]*?text-overflow:clip/);
  assert.match(js, /var subtitles=/);
  assert.match(js, /subtitle\.style\.fontSize=Math\.max\(6\.8,/);
  assert.match(html, /Свет • Вода • Газ • Интернет/);
  assert.doesNotMatch(html, /Найти работу • Разместить вакансию/);
});

test('all category arrows share one visible position', () => {
  assert.equal((html.match(/class="card-arrow"/g) || []).length, 8);
  assert.match(css, /#app \.cards \.card-arrow\{[\s\S]*?display:grid!important;[\s\S]*?right:3\.5%;top:50%/);
  assert.match(css, /#app \.cards \.card\.compact\.expanded-label \.card-copy\{right:14%!important\}/);
});

test('search and main card grid use compact professional vertical spacing', () => {
  const settings = fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8');
  assert.match(css, /\.search-wrap\s*\{[\s\S]*?top:34\.15%/);
  assert.match(css, /\.cards\s*\{[\s\S]*?top:40\.80%;[\s\S]*?height:39\.40%/);
  assert.match(settings, /searchTop: "42\.18%"/);
  assert.match(settings, /cardsTop: "50\.46%"/);
});
