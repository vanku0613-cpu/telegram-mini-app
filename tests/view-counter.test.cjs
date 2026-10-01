const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const source = fs.readFileSync(path.join(__dirname, '../view-counter.js'), 'utf8');
const timeKey = 'izmail_directory_global_view_last_time_hourly_20260930_v1';

test('both actual entry pages load one shared counter without layout drift', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.webp') ? 'image/webp' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    let hits = 0;
    await context.route('https://abacus.jasoncameron.dev/**', route => {
      if (route.request().url().includes('/hit/')) hits++;
      return route.fulfill({ json: { value: 1234 } });
    });
    await context.route(/https:\/\/(?!abacus\.jasoncameron\.dev)/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      for (const entry of ['/', '/main-v2/']) {
        await page.goto(origin + entry);
        await page.waitForFunction(() => document.getElementById('viewCount').textContent.replace(/\s/g, '') === '1234');
        await page.waitForTimeout(450);
        const widths = await page.evaluate(() => {
          const viewer = document.querySelector('.viewer').getBoundingClientRect();
          const weather = document.querySelector('#weatherPanel').getBoundingClientRect();
          return { viewer: viewer.width, weather: weather.width, viewerCenter: viewer.left + viewer.width / 2, weatherCenter: weather.left + weather.width / 2 };
        });
        assert.ok(Math.abs(widths.viewer - widths.weather) < 1, JSON.stringify(widths));
        assert.ok(Math.abs(widths.viewerCenter - widths.weatherCenter) < 1, JSON.stringify(widths));
        assert.ok(await page.locator('.card').count() > 0);
      }
    }
    assert.equal(hits, 1, 'all home openings share the same device interval');
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('counter throttles tabs, keeps confirmed cache and avoids persistent streams', async () => {
  const server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<span id="viewCount">1</span>'); });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let total = 40, hits = 0, loseResponse = false, failReads = false;
  const contexts = [];
  async function device() {
    const context = await browser.newContext(); contexts.push(context);
    await context.route('https://abacus.jasoncameron.dev/**', async route => {
      if (route.request().url().includes('/hit/')) { hits++; total++; if (loseResponse) return route.abort(); }
      else if (failReads) return route.fulfill({ status: 503, body: 'Unavailable' });
      await route.fulfill({ json: { value: total } });
    });
    return context;
  }
  async function open(context) { const page = await context.newPage(); await page.goto(origin); await page.addScriptTag({ content: source }); return page; }
  async function displayed(page, expected) { await page.waitForFunction(n => document.getElementById('viewCount').textContent === String(n), expected); }
  async function restart(page) { await page.reload(); await page.addScriptTag({ content: source }); }
  try {
    const a = await device(); const pageA = await open(a); await displayed(pageA, 41);
    await restart(pageA); await displayed(pageA, 41); assert.equal(hits, 1);

    const b = await device(); const pageB = await open(b); await displayed(pageB, 42);
    await pageA.evaluate(() => dispatchEvent(new Event('online'))); await displayed(pageA, 42);

    const c = await device(); const tabs = await Promise.all(Array.from({ length: 6 }, () => open(c)));
    for (const page of tabs) await displayed(page, 43);
    assert.equal(hits, 3, 'simultaneous tabs count once');

    const countedAt = await pageA.evaluate(key => Number(localStorage.getItem(key)), timeKey);
    await pageA.clock.install({ time: new Date(countedAt + 3599000) });
    await pageA.addScriptTag({ content: source }); await displayed(pageA, 43); assert.equal(hits, 3);
    await pageA.clock.fastForward(1000); await pageA.addScriptTag({ content: source }); await displayed(pageA, 44); assert.equal(hits, 4);

    loseResponse = true;
    const d = await device(); const pageD = await open(d); await displayed(pageD, 45);
    await restart(pageD); await displayed(pageD, 45); assert.equal(hits, 5, 'lost response is never re-counted');
    loseResponse = false;

    failReads = true; await restart(pageB); await displayed(pageB, 42);
    failReads = false; await pageB.evaluate(() => dispatchEvent(new Event('online'))); await displayed(pageB, 45);

    const e = await device();
    await e.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    const pageE = await open(e); await displayed(pageE, 46);
    await restart(pageE); await displayed(pageE, 46); assert.equal(hits, 6, 'IndexedDB retains the throttle without localStorage');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('counter source uses bounded polling instead of one EventSource per visitor', () => {
  assert.doesNotMatch(source, /EventSource/);
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.match(source, /4 \* 60 \* 1000/);
  assert.match(source, /BroadcastChannel/);
});
