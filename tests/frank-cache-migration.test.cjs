const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

test('old installed NBU page upgrades to Frank without manual refresh', async () => {
  const root = path.resolve(__dirname, '..');
  const legacy = {};
  for (const file of ['index.html', 'settings.js', 'main-v2/index.html', 'main-v2/settings.js', 'main-v2/sw.js']) {
    legacy['/' + file] = execFileSync('git', ['show', '1f3a7de:' + file], { cwd: root, maxBuffer: 5000000 });
  }
  let upgraded = false;
  let staleOpening = false;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let name = url.pathname;
    if (name.endsWith('/')) name += 'index.html';
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.json') ? 'application/json' : 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    const old = legacy[name];
    if (old && (!upgraded || (name.endsWith('index.html') && staleOpening && !url.searchParams.has('frank_revision')))) {
      if (upgraded) staleOpening = false;
      return res.end(old);
    }
    const file = path.join(root, name);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.end(fs.readFileSync(file));
  });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const context = await browser.newContext();
    await context.route('https://**', route => route.abort());
    const initial = await context.newPage();
    await initial.goto(origin + '/main-v2/');
    await initial.evaluate(() => navigator.serviceWorker.ready);
    await initial.waitForFunction(() => !!navigator.serviceWorker.controller);
    assert.equal(await initial.locator('#currencyPanel .info-title').textContent(), 'Курс НБУ');
    await initial.close();

    upgraded = true;
    staleOpening = true;
    const reopened = await context.newPage();
    reopened.on('console', message => { if (message.text().includes('Service Worker')) console.log(message.text()); });
    const navigations = [];
    reopened.on('framenavigated', frame => { if (frame === reopened.mainFrame()) navigations.push(frame.url()); });
    await reopened.goto(origin + '/main-v2/');
    // The old settings call registration.update() themselves at load time.
    try { await reopened.waitForURL('**frank_revision=3', { timeout: 15000 }); }
    catch (error) {
      console.log(await reopened.evaluate(async () => ({ url: location.href, caches: await caches.keys(), registrations: (await navigator.serviceWorker.getRegistrations()).map(r => ({ active: r.active?.state, installing: r.installing?.state, waiting: r.waiting?.state })) })));
      throw error;
    }
    await reopened.waitForFunction(() => document.getElementById('usdRate').textContent.includes(' / ') && !document.getElementById('usdRate').textContent.includes('—'));
    assert.equal(await reopened.locator('#currencyPanel a').getAttribute('href'), 'https://t.me/frankexange');
    const keys = await reopened.evaluate(() => caches.keys());
    assert.ok(!keys.includes('izmail-main-v2-v1'));
    assert.ok(keys.includes('izmail-main-v2-frank-v3'));
    assert.equal(navigations.filter(url => url.includes('frank_revision=3')).length, 1, 'single automatic upgrade, no reload loop');
    await context.close();

    // Root HTML has no service worker, but legacy HTML loads fresh settings.
    const rootContext = await browser.newContext();
    await rootContext.route('https://**', route => route.abort());
    const rootPage = await rootContext.newPage();
    staleOpening = true;
    await rootPage.goto(origin + '/');
    await rootPage.waitForURL('**frank_revision=3');
    await rootPage.waitForFunction(() => document.getElementById('usdRate').textContent.includes(' / ') && !document.getElementById('usdRate').textContent.includes('—'));
    assert.equal(await rootPage.locator('#currencyPanel a').textContent(), 'FRANK EXCHANGE');
    await rootContext.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
