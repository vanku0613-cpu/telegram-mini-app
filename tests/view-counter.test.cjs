// NODE_PATH must include Playwright; run: node --test tests/view-counter.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright');
const source = fs.readFileSync(require('node:path').join(__dirname, '../view-counter.js'), 'utf8');
const timeKey = 'izmail_directory_global_view_last_time_hourly_20260930_v1';

test('both actual entry pages load the shared counter without changing other markup', async () => {
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.addInitScript(() => { window.EventSource = undefined; });
    let hits = 0;
    await context.route('https://abacus.jasoncameron.dev/**', route => {
      if (route.request().url().includes('/hit/')) hits++;
      return route.fulfill({ json: { value: 1234 } });
    });
    await context.route(/https:\/\/(?!abacus\.jasoncameron\.dev)/, route => route.abort());
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const entry of ['/', '/main-v2/']) {
      await page.goto(origin + entry);
      await page.waitForFunction(() => document.getElementById('viewCount').textContent.replace(/\s/g, '') === '1234');
      await page.waitForTimeout(100);
      const widths = await page.evaluate(() => ({
        innerWidth, clientWidth: document.documentElement.clientWidth, appWidth: document.querySelector('#app').offsetWidth, screenWidth: screen.width, dpr: devicePixelRatio,
        viewer: document.querySelector('.viewer').getBoundingClientRect().width,
        weather: document.querySelector('#weatherPanel').getBoundingClientRect().width,
        viewerOffset: document.querySelector('.viewer').offsetWidth,
        weatherOffset: document.querySelector('#weatherPanel').offsetWidth,
        row: getComputedStyle(document.querySelector('.top-row')).gridTemplateColumns,
        gridColumn: getComputedStyle(document.querySelector('#weatherPanel')).gridColumn,
        weatherComputed: getComputedStyle(document.querySelector('#weatherPanel')).width,
        viewerComputed: getComputedStyle(document.querySelector('.viewer')).width,
        viewerInlineWidth: document.querySelector('.viewer').style.getPropertyValue('width'),
        viewerInlinePriority: document.querySelector('.viewer').style.getPropertyPriority('width'),
        viewerMax: getComputedStyle(document.querySelector('.viewer')).maxWidth,
        rowWidth: document.querySelector('.top-row').offsetWidth,
        viewerScale: getComputedStyle(document.querySelector('.viewer')).scale,
        weatherScale: getComputedStyle(document.querySelector('#weatherPanel')).scale
      }));
      assert.ok(Math.abs(widths.viewer - widths.weather) < 1, JSON.stringify(widths));
      assert.ok(await page.locator('.card').count() > 0);
      assert.equal(await page.locator('#directorySearch').count(), 1);
    }
    assert.equal(hits, 1, 'both entry pages share the same device interval');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('shared counter: devices, concurrent tabs, one hour, streaming and failures', async () => {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<span id="viewCount">1</span>');
  });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let total = 40;
  let hits = 0;
  let loseResponse = false;
  let failReads = false;
  const contexts = [];
  async function device() {
    const context = await browser.newContext();
    contexts.push(context);
    await context.addInitScript(() => {
      window.EventSource = class {
        constructor() { window.counterStream = this; }
        close() {}
      };
    });
    await context.route('https://abacus.jasoncameron.dev/**', async route => {
      if (route.request().url().includes('/hit/')) {
        hits++;
        total++;
        if (loseResponse) return route.abort();
      } else if (failReads) {
        return route.fulfill({ status: 503, body: 'Unavailable' });
      }
      await route.fulfill({ json: { value: total } });
    });
    return context;
  }
  async function open(context) {
    const page = await context.newPage();
    await page.goto(origin);
    await page.addScriptTag({ content: source });
    return page;
  }
  async function displayed(page, expected) {
    await page.waitForFunction(n => document.getElementById('viewCount').textContent === String(n), expected);
  }
  async function restart(page) {
    await page.reload();
    await page.addScriptTag({ content: source });
  }
  try {
    const a = await device();
    const pageA = await open(a);
    await displayed(pageA, 41);
    await restart(pageA);
    await displayed(pageA, 41);
    assert.equal(hits, 1, 'reload does not increment');

    const b = await device();
    const pageB = await open(b);
    await displayed(pageB, 42);
    await pageA.evaluate(value => window.counterStream.onmessage({ data: JSON.stringify({ value }) }), total);
    await displayed(pageA, 42);
    assert.equal(hits, 2, 'another device increments immediately');
    await pageA.evaluate(() => window.counterStream.onmessage({ data: '{"value":1}' }));
    await displayed(pageA, 42);

    const c = await device();
    const tabs = await Promise.all(Array.from({ length: 6 }, () => open(c)));
    for (const page of tabs) await displayed(page, 43);
    assert.equal(hits, 3, 'simultaneous tabs count once');

    const countedAt = await pageA.evaluate(key => Number(localStorage.getItem(key)), timeKey);
    await pageA.clock.install({ time: new Date(countedAt + 3599000) });
    await pageA.addScriptTag({ content: source });
    await displayed(pageA, 43);
    assert.equal(hits, 3, 'less than one hour does not increment');
    await pageA.clock.fastForward(1000);
    await pageA.addScriptTag({ content: source });
    await displayed(pageA, 44);
    assert.equal(hits, 4, 'after one hour a new opening increments');

    loseResponse = true;
    const d = await device();
    const pageD = await open(d);
    await displayed(pageD, 45);
    await restart(pageD);
    await displayed(pageD, 45);
    assert.equal(hits, 5, 'lost HIT response must not cause duplicate increment');
    loseResponse = false;

    await pageB.evaluate(() => localStorage.setItem('izmail_directory_global_view_last_value_v1', '999999'));
    failReads = true;
    await restart(pageB);
    await pageB.waitForFunction(() => document.getElementById('viewCount').textContent === '—');
    assert.equal(hits, 5);
    failReads = false;
    await pageB.evaluate(() => window.dispatchEvent(new Event('online')));
    await displayed(pageB, 45);
    const stored = await pageA.evaluate(() => Object.keys(localStorage));
    assert.deepEqual(stored, [timeKey], 'only a timestamp is stored in localStorage');

    const e = await device();
    await e.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
    const pageE = await open(e);
    await displayed(pageE, 46);
    await restart(pageE);
    await displayed(pageE, 46);
    assert.equal(hits, 6, 'IndexedDB retains throttle when localStorage is blocked');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('live Abacus: independent devices see the same total via SSE', { skip: !process.env.LIVE_COUNTER_TEST }, async () => {
  // A separate key prevents test visits from inflating the application's total.
  const key = 'counter_test_' + Date.now();
  const liveSource = source.replace('spravochnik_izmail_main_v2_views', key);
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<span id="viewCount">1</span>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const a = await browser.newContext();
    const b = await browser.newContext();
    const pageA = await a.newPage();
    const pageB = await b.newPage();
    const events = [];
    // Observe actual EventSource delivery, not the fallback polling result.
    await a.addInitScript(() => {
      const Native = window.EventSource;
      window.EventSource = class extends Native {
        constructor(url) {
          super(url);
          this.addEventListener('message', event => console.log('counter-sse:' + event.data));
        }
      };
    });
    pageA.on('console', message => events.push(message.text()));
    await pageA.goto(origin);
    await pageA.addScriptTag({ content: liveSource });
    await pageA.waitForFunction(() => document.getElementById('viewCount').textContent === '1');
    await pageB.goto(origin);
    await pageB.addScriptTag({ content: liveSource });
    await pageB.waitForFunction(() => document.getElementById('viewCount').textContent === '2');
    await pageA.waitForFunction(() => document.getElementById('viewCount').textContent === '2');
    assert.ok(events.some(value => /counter-sse:.*"value":\s*2/.test(value)), 'real SSE delivered the second device view');
    await pageA.reload();
    await pageA.addScriptTag({ content: liveSource });
    await pageA.waitForFunction(() => document.getElementById('viewCount').textContent === '2');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
