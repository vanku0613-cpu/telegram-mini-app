const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('communal services page is reachable, organized, and uses unique callable contacts', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', path.extname(file) === '.css' ? 'text/css' : path.extname(file) === '.js' ? 'text/javascript' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/communal-services/`);

    assert.equal(await page.title(), 'Коммунальные службы — Справочник Измаил');
    assert.deepEqual(await page.locator('main > *').evaluateAll(items => items.slice(0, 3).map(item => item.className)), ['cover', 'home-back', 'jump']);
    assert.deepEqual(await page.locator('.service').evaluateAll(items => items.map(item => item.id)), ['light', 'water', 'gas', 'heat', 'housing']);
    assert.deepEqual(await page.locator('.home-back').evaluateAll(items => items.map(item => item.getAttribute('data-main-back') !== null)), [true, true]);
    const phones = await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(item => item.getAttribute('href')));
    assert.equal(phones.length, new Set(phones).size, 'telephone links must not be duplicated');
    assert.ok(phones.includes('tel:104'));
    assert.equal(await page.locator('a[href="https://t.me/DTEKOdeskiElektromerezhiBot"]').count(), 1);
    assert.equal(await page.locator('a[href="https://t.me/OdessaGasDistributionBot"]').count(), 1);
    assert.equal(await page.locator('.unverified').count(), 0);
    assert.doesNotMatch(await page.locator('main').innerText(), /из предоставленного списка|свежего подтверждения|не подтверждены/i);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    const oldShelterText = fs.readFileSync(path.join(root, 'ukrytia', 'index.html'), 'utf8');
    assert.equal(oldShelterText.includes('Ещё 3 адреса из публикации от 9 марта 2022 года'), false);
    assert.equal(oldShelterText.includes('legacy-shelters'), false);
    const home = fs.readFileSync(path.join(root, 'main-v2', 'index.html'), 'utf8');
    assert.match(home, /\.weather-panel \.info-title[\s\S]*?text-align:\s*center/);
    assert.match(home, /\.weather-panel \.temp[\s\S]*?text-align:\s*center/);
    assert.match(home, /\.weather-panel \.condition[\s\S]*?text-align:\s*center/);
    assert.match(fs.readFileSync(path.join(root, 'settings.js'), 'utf8'), /"Коммунальные службы":\s*"\.\/communal-services\/"/);
    assert.match(fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8'), /"Коммунальные службы":\s*"\.\.\/communal-services\/"/);

    await page.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
    assert.equal(await page.locator('#weatherPanel .info-title').evaluate(el => getComputedStyle(el).textAlign), 'center');
    assert.equal(await page.locator('#weatherPanel .temp').evaluate(el => getComputedStyle(el).textAlign), 'center');
    assert.equal(await page.locator('#weatherPanel .condition').evaluate(el => getComputedStyle(el).textAlign), 'center');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
