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

test('desktop typography is readable without changing phone rules', () => {
  const infoCss = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  assert.match(css, /Computer presentation: use the extra card area for readable type/);
  assert.match(css, /font-size:clamp\(16px,1\.42vw,20px\)/);
  assert.match(css, /#app \.groups-row \.groups-title\{font-size:clamp\(16px,1\.28vw,18px\)/);
  assert.match(infoCss, /Readable computer information row/);
  assert.match(infoCss, /font-size:clamp\(12px,\.95vw,14px\)!important/);
  assert.match(infoCss, /font-size:clamp\(13px,1\.02vw,15px\)!important/);
});

test('every main card description remains fully visible', () => {
  const js = fs.readFileSync(path.join(root, 'main-v2', 'main.js'), 'utf8');
  assert.match(css, /#app \.cards \.card-copy small\{[\s\S]*?width:118%;[\s\S]*?font-size:clamp\(9px,2\.2cqw,11px\);[\s\S]*?font-weight:900/);
  assert.match(js, /var subtitles=/);
  assert.match(js, /var subtitleFloor=desktop \? 11 : 7\.2/);
  assert.match(js, /subtitle\.style\.fontSize=Math\.max\(subtitleFloor,/);
  assert.match(html, /Свет • Вода • Газ • Интернет/);
  assert.doesNotMatch(html, /Найти работу • Разместить вакансию/);
});

test('long main-card titles keep natural letter proportions', () => {
  const js = fs.readFileSync(path.join(root, 'main-v2', 'main.js'), 'utf8');
  assert.match(js, /querySelectorAll\("\.card-copy strong,\.groups-title"\)/);
  assert.match(js, /var compression=title\.closest\("\.expanded-label"\) \? \.86 : 1/);
  assert.match(css, /#app \.cards \.card\.compact\.expanded-label \.card-copy strong>span\{[\s\S]*?transform:scaleX\(\.86\)!important/);
  assert.match(html, /main\.css\?v=43/);
  assert.match(html, /main\.js\?v=16/);
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
  assert.match(settings, /groupsTop: "93\.01%"/);
  assert.match(settings, /bottomTop: "100\.23%"/);
});

test('weather and currency use the main-card gap without moving shelter', () => {
  const infoCss = fs.readFileSync(path.join(root, 'home-info.css'), 'utf8');
  assert.match(infoCss, /#app \.top-row\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) calc\(\(100% - 2\.3%\) \/ 3\);[\s\S]*?column-gap:\.75vw/);
  assert.match(html, /home-info\.css\?v=24/);
});

test('main destinations are present before scripts and have a navigation fallback', () => {
  const js = fs.readFileSync(path.join(root, 'main-v2', 'main.js'), 'utf8');
  assert.equal((html.match(/class="card pressable[^\"]*"[^>]*data-nav=/g) || []).length, 8);
  assert.match(html, /id="zagsBtn" data-nav="https:\/\/vanku0613-cpu\.github\.io\/telegram-mini-app\/zags\/"/);
  assert.match(html, /id="groupsBtn" data-nav="https:\/\/vanku0613-cpu\.github\.io\/telegram-mini-app\/our-groups-menu\/"/);
  assert.match(js, /var PUBLIC_APP_ROOT="https:\/\/vanku0613-cpu\.github\.io\/telegram-mini-app\/"/);
  assert.match(js, /target=publicAppUrl\(target\)/);
  assert.match(js, /function guaranteeButtonNavigation/);
  assert.match(js, /control\.setAttribute\("data-nav",target\)/);
  assert.match(js, /window\.setTimeout\(function\(\)\{/);
});
