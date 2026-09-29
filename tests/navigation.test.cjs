const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('home, current buttons, nested returns and future delegated buttons', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let name = new URL(req.url, 'http://localhost').pathname;
    if (name.endsWith('/')) name += 'index.html';
    const file = path.join(root, name);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.json') ? 'application/json' : 'text/html');
    res.end(fs.readFileSync(file));
  });
  const browser = await chromium.launch({
    headless: true, channel: process.env.BROWSER_CHANNEL || undefined,
    ignoreDefaultArgs: ['--disable-back-forward-cache']
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const externalServer = http.createServer((req, res) => { res.end('External destination'); });
  await new Promise(resolve => externalServer.listen(0, '127.0.0.1', resolve));
  const externalOrigin = `http://127.0.0.1:${externalServer.address().port}`;
  try {
    for (const home of ['/', '/main-v2/']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
      await context.addInitScript(() => { window.EventSource = undefined; });
      await context.route('https://**', route => {
        const url = route.request().url();
        if (url.includes('open-meteo.com')) return route.fulfill({ json: { current: {
          weather_code: 0, temperature_2m: 22, apparent_temperature: 22, wind_speed_10m: 2, relative_humidity_2m: 50
        } } });
        if (url.includes('abacus.')) return route.fulfill({ json: { value: 42 } });
        return route.fulfill({ contentType: 'text/html', body: '<p>External destination</p>' });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + home);
      await page.waitForFunction(() => window.IZMAIL_NAV_READY && document.getElementById('weatherTemp').textContent === '22°C');
      await page.waitForFunction(() => {
        const search = document.querySelector('.search-wrap').getBoundingClientRect();
        const cards = document.querySelector('.cards').getBoundingClientRect();
        const groups = document.querySelector('.groups').getBoundingClientRect();
        return Math.abs((groups.top - cards.bottom) - (cards.top - search.bottom)) < .5;
      });
      for (const selector of ['#weatherPanel', '#currencyPanel', '#homeBtn', '#adsBtn', '#favBtn', '.search-wrap', '.card']) {
        const control = page.locator(selector).first();
        const before = await control.boundingBox();
        await control.dispatchEvent('pointerdown', { button: 0 });
        assert.equal(await control.evaluate(el => el.classList.contains('tap-lit')), true);
        assert.match(await control.evaluate(el => getComputedStyle(el).boxShadow), /63, 148, 197/);
        assert.deepEqual(await control.boundingBox(), before, 'glowing borders do not move controls');
      }
      assert.match(await page.locator('#weatherPanel').getAttribute('href'), /meteoblue.*707308$/);
      await page.locator('#directorySearch').focus();
      assert.match(await page.locator('.search-wrap').evaluate(el => getComputedStyle(el).boxShadow), /63, 148, 197/);
      await page.locator('#directorySearch').blur();
      const getGeometry = () => page.evaluate(() => Object.fromEntries(['#bgMain', '.cards', '.groups', '.bottom', '.viewer'].map(selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return [selector, [r.x, r.y, r.width, r.height]];
      })));
      const geometry = await getGeometry();
      await page.evaluate(() => {
        window.documentToken = 'original';
        window.sceneMutations = 0;
        const observer = new MutationObserver(records => { window.sceneMutations += records.length; });
        for (const id of ['bgMain', 'bgBlur', 'sceneLayer']) observer.observe(document.getElementById(id), { attributes: true });
      });
      await page.locator('#homeBtn').tap();
      await page.evaluate(() => { for (let i = 0; i < 8; i++) document.getElementById('homeBtn').click(); });
      await page.waitForFunction(() => document.getElementById('usdRate').textContent.includes(' / '));
      assert.equal(await page.evaluate(() => window.documentToken), 'original', 'Home keeps the current document');
      assert.deepEqual(await getGeometry(), geometry, 'Home does not move the image or button groups');
      assert.equal(await page.evaluate(() => window.sceneMutations), 0, 'same weather does not restart the background');

      await page.locator('#favBtn').click();
      assert.equal(await page.locator('#toast').textContent(), 'Избранное пока пусто');
      await page.locator('#directorySearch').fill('Работа');
      assert.equal(await page.locator('.card:visible').count(), 1);
      await page.locator('#directorySearch').fill('');
      await page.locator('#directorySearch').blur();
      for (const selector of ['#groupsBtn', '#shelterBtn', '#agreement']) {
        const destination = selector === '#groupsBtn' ? '/our-groups-menu/' : selector === '#shelterBtn' ? '/ukrytia/' : '/soglashenie/';
        await page.locator(selector).click();
        await page.waitForURL(origin + destination);
        assert.equal(await page.evaluate(() => history.state.izmailNavigationV5.depth), 1);
        const back = selector === '#groupsBtn' ? '.back' : '.back-btn';
        await page.locator(back).first().click();
        await page.waitForURL(origin + home, { waitUntil: 'commit' });
        await page.waitForFunction(() => !!window.IZMAIL_NAV_READY);
        assert.equal(await page.evaluate(() => window.documentToken), 'original', 'return restores the existing home document');
      }

      // Future buttons are picked up dynamically; no new per-button listener.
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.id = 'futureButton';
        button.dataset.nav = './our-groups-menu/';
        button.dataset.nav = new URL('/our-groups-menu/', location.origin).href;
        button.textContent = 'Future';
        document.body.prepend(button);
        button.click(); button.click();
      });
      await page.waitForURL(origin + '/our-groups-menu/');
      assert.equal(await page.evaluate(() => history.state.izmailNavigationV5.depth), 1, 'double tap creates only one transition');
      await page.evaluate(() => {
        const button = document.createElement('div');
        button.id = 'nextSection'; button.tabIndex = 0; button.setAttribute('role', 'button');
        button.dataset.nav = '../soglashenie/'; button.textContent = 'Next';
        document.body.prepend(button); button.focus();
      });
      await page.keyboard.press('Enter');
      await page.waitForURL(origin + '/soglashenie/');
      assert.equal(await page.evaluate(() => history.state.izmailNavigationV5.depth), 2);
      await page.locator('.back-btn').first().click();
      await page.waitForURL(origin + home, { waitUntil: 'commit' });

      // External buttons keep their actual destinations and native anchor behavior.
      for (const [selector, target] of [
        ['#adsBtn', 'https://t.me/Vanku13'],
        ['.card[data-title="Работа / Вакансии"]', 'https://t.me/rabota_v_izmaile'],
        ['#mainLogoHotspot', 'https://t.me/SPRAVOCHNIK_IZMAIL']
      ]) {
        if (await page.locator(selector).getAttribute('target') === '_blank') {
          assert.equal(await page.locator(selector).getAttribute('href'), target);
          await page.locator(selector).evaluate(el => el.addEventListener('click', event => {
            window.nativeLink = { url: el.href, intercepted: event.defaultPrevented };
            event.preventDefault(); // Do not contact external services in this test.
          }, { once: true }));
          await page.locator(selector).click();
          assert.deepEqual(await page.evaluate(() => window.nativeLink), { url: target, intercepted: false });
        } else {
          assert.equal(await page.locator(selector).getAttribute('data-nav'), target);
          const external = externalOrigin + '/external-destination';
          await page.locator(selector).evaluate((el, url) => { el.dataset.nav = url; }, external);
          await page.locator(selector).click();
          await page.waitForURL(external, { waitUntil: 'commit' });
          await page.goBack({ waitUntil: 'commit' });
          await page.waitForURL(origin + home, { waitUntil: 'commit' });
        }
      }
      await page.locator('#currencyPanel a').evaluate(el => el.addEventListener('click', event => {
        window.nativeLink = { url: el.href, intercepted: event.defaultPrevented };
        event.preventDefault();
      }, { once: true }));
      await page.locator('#currencyPanel a').click();
      assert.deepEqual(await page.evaluate(() => window.nativeLink), { url: 'https://t.me/frankexange', intercepted: false });
      assert.equal(page.url(), origin + home);
      assert.deepEqual(errors, []);
      await context.close();
    }
    // Direct section links must not send users into unrelated browser history.
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route('https://**', route => route.abort());
    const direct = await context.newPage();
    await direct.goto(origin + '/soglashenie/');
    await direct.locator('.back-btn').first().click();
    await direct.waitForURL(origin + '/main-v2/');
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => externalServer.close(resolve));
  }
});
