const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('our groups page shows all verified community links and return buttons', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.webp') ? 'image/webp' : /\.jpe?g$/i.test(file) ? 'image/jpeg' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/our-groups-menu/`);
    assert.deepEqual(await page.locator('main > *').evaluateAll(items => items.map(item => item.className || item.tagName.toLowerCase()).slice(0, 3)), ['hero', 'home-back', 'section-heading']);
    const groups = page.locator('.item');
    assert.equal(await groups.count(), 7);
    assert.deepEqual(await groups.evaluateAll(items => items.map(item => item.href)), [
      'https://t.me/SPRAVOCHNIK_IZMAIL',
      'https://t.me/Vkusny_Chat_Izmail',
      'https://t.me/AVTO_IZMAIL_ODESSA',
      'https://t.me/rabota_v_izmaile',
      'https://t.me/Izmail_CHAT_24_7',
      'https://t.me/IZMAIL_GAZ_SVET_VODA',
      'https://t.me/buro_nahodok_izmail'
    ]);
    assert.deepEqual(await page.locator('.home-back').evaluateAll(items => items.map(item => item.getAttribute('data-main-back') !== null)), [true, true]);
    await page.locator('.avatar img').evaluateAll(items => items.forEach(item => { item.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.avatar img')].every(img => img.complete && img.naturalWidth > 0));
    assert.deepEqual(await page.locator('.avatar img').evaluateAll(items => items.map(img => img.getAttribute('src'))), [
      '../assets/group-avatar-directory.jpg?v=1',
      '../assets/group-avatar-market.jpg?v=1',
      '../assets/group-avatar-auto.jpg?v=1',
      '../assets/group-avatar-work.jpg?v=1',
      '../assets/group-avatar-zoo.jpg?v=1',
      '../assets/group-avatar-utilities.jpg?v=1',
      '../assets/group-avatar-lost-found.jpg?v=1'
    ]);
    assert.equal(await page.locator('.avatar.is-fallback').count(), 0);
    assert.match(await groups.first().evaluate(el=>getComputedStyle(el).backgroundImage),/rgb\(32, 60, 87\)/,'direct group destinations use the calm blue-graphite surface');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 768, height: 900 });
    assert.equal(await page.locator('.grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
