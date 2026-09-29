const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('both pages: buy/sell, link, five-minute refresh, offline cache, unchanged geometry', async () => {
  const root = path.resolve(__dirname, '..');
  const originals = Object.fromEntries(['index.html', 'main-v2/index.html'].map(file => [file,
    require('node:child_process').execFileSync('git', ['show', 'HEAD:' + file], { cwd: root, maxBuffer: 5000000 }).toString()
  ]));
  for (const [file, original] of Object.entries(originals)) {
    const current = fs.readFileSync(path.join(root, file), 'utf8');
    assert.deepEqual(current.match(/<style>[\s\S]*?<\/style>/g), original.match(/<style>[\s\S]*?<\/style>/g), 'all existing CSS is unchanged');
  }
  const server = http.createServer((req, res) => {
    let name = new URL(req.url, 'http://localhost').pathname;
    if (name.endsWith('/')) name += 'index.html';
    const file = path.join(root, name);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const entry of ['/', '/main-v2/']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      await context.addInitScript(() => { window.EventSource = undefined; });
      await context.route('https://**', route => route.abort());
      let data = JSON.parse(fs.readFileSync(path.join(root, 'data/frank-rates.json')));
      let fail = false;
      let requests = 0;
      let releaseFirst;
      const firstResponse = new Promise(resolve => { releaseFirst = resolve; });
      await context.addInitScript(() => { if (!localStorage.getItem('izmail_frank_rates_v1')) localStorage.setItem('izmail_frank_rates_v1', JSON.stringify({
        sourceUrl: 'https://t.me/frankexange', fetchedAt: '2026-01-01T00:00:00Z',
        usd: { buy: 40, sell: 41 }, eur: { buy: 42, sell: 43 }
      })); });
      await context.route('**/data/frank-rates.json?*', async route => {
        requests++;
        if (requests === 1) await firstResponse;
        return fail ? route.abort() : route.fulfill({ json: data });
      });
      const page = await context.newPage();
      await page.clock.install();
      await page.goto(origin + entry);
      await page.waitForFunction(() => document.querySelector('script[src*="frank-rates.js"]'));
      assert.equal(await page.locator('#usdRate').textContent(), '— / —', 'do not flash obsolete local rates before the fresh response');
      releaseFirst();
      await page.waitForFunction(() => document.getElementById('usdRate').textContent === '44.70 / 45.20');
      assert.equal(await page.locator('#eurRate').textContent(), '51.00 / 51.70');
      assert.equal(await page.locator('#currencyPanel a').getAttribute('href'), 'https://t.me/frankexange');
      const box = await page.locator('#currencyPanel').boundingBox();
      const fits = await page.locator('#currencyPanel').evaluate(el => {
        const panel = el.getBoundingClientRect();
        return [...el.querySelectorAll('.rate span, .info-title a')].every(item => {
          const rect = item.getBoundingClientRect();
          return rect.left >= panel.left && rect.right <= panel.right && rect.bottom <= panel.bottom;
        });
      });
      assert.equal(fits, true, 'buy/sell text fits the existing panel');
      data.usd.buy = 44.8;
      data.fetchedAt = new Date(Date.now() + 1000).toISOString();
      const before = requests;
      await page.clock.fastForward(290000);
      assert.equal(requests, before);
      await page.clock.fastForward(10000);
      await page.waitForFunction(() => document.getElementById('usdRate').textContent === '44.80 / 45.20');
      fail = true;
      await page.reload();
      await page.waitForFunction(() => document.getElementById('usdRate').textContent === '44.80 / 45.20');
      fail = false;
      data.usd = { buy: 100, sell: 1 };
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await page.waitForResponse('**/data/frank-rates.json?*');
      assert.equal(await page.locator('#usdRate').textContent(), '44.80 / 45.20');
      const unchanged = await page.locator('#currencyPanel').boundingBox();
      assert.deepEqual(unchanged, box);
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
