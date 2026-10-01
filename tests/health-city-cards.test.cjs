const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'health-care', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'health-care', 'style.css'), 'utf8');

test('doctor city chooser uses refreshed city photography and medical icons', () => {
  assert.doesNotThrow(() => new Function(app));
  const cities = ['izmail', 'kiliya', 'bolgrad', 'reni', 'odesa', 'kyiv'];
  for (const city of cities) {
    assert.ok(fs.existsSync(path.join(root, 'assets', 'schedule-cities', `${city}-v2.webp`)), `${city} image is missing`);
  }
  assert.match(app, /schedule-cities\/['"]?\+cityImages\[c\]\+'-v2\.webp\?v=2/);
  assert.match(app, /class="city-tab-icon"/);
  assert.match(app, /class="city-tab-label"/);
  assert.match(app, /cityDirectoryIcon/);
});

test('doctor city names stay large and centered inside fixed cards', () => {
  assert.match(css, /\.city-tab \.city-tab-label\{[^}]*inset:0[^}]*place-items:center[^}]*font-size:clamp\(18px/);
  assert.match(css, /\.city-tab \.city-tab-icon\{[^}]*width:31px!important[^}]*height:31px!important/);
  assert.match(css, /\.city-tabs \.city-tab\{width:100%;height:68px;min-height:68px/);
});
