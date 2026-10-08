const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

test('interior directories remain readable without changing their responsive grid', async () => {
  const server = http.createServer((request, response) => {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.join(root, pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      response.writeHead(404);
      return response.end();
    }
    const types = { '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
    response.setHeader('Content-Type', types[path.extname(file)] || 'text/html; charset=utf-8');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const directories = [
      '/health-care/', '/services-masters/', '/communal-services/', '/products-food/',
      '/recreation/', '/transport/', '/our-groups-menu/', '/zags/', '/ukrytia/', '/soglashenie/'
    ];
    for (const width of [390, 1180]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      await page.route('https://**', route => route.abort());
      for (const directory of directories) {
        await page.goto(origin + directory, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${directory} has no horizontal overflow at ${width}px`);
        assert.match(await page.locator('link[href*="interior-polish.css"]').getAttribute('href'), /v=12$/, `${directory} loads the current shared interior styles`);
      }
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await page.route('https://**', route => route.abort());
    const contactViews = [
      ['/services-masters/', '[data-item="0"]'],
      ['/communal-services/', '[data-open="light"]'],
      ['/products-food/', '[data-tab="fastfood"]'],
      ['/recreation/', '[data-tab="bases"]'],
      ['/transport/', '[data-content="stations"]']
    ];
    for (const [directory, selector] of contactViews) {
      await page.goto(origin + directory, { waitUntil: 'domcontentloaded' });
      await page.locator(selector).first().click();
      const phones = page.locator('a.phone[href^="tel:"]');
      assert.ok(await phones.count() > 0, `${directory} exposes telephone actions`);
      assert.equal(await phones.evaluateAll(items => items.every(item => {
        const number = item.querySelector('strong,.phone-number');
        return number && parseFloat(getComputedStyle(number).fontSize) >= 13 && number.scrollWidth <= number.clientWidth + 2;
      })), true, `${directory} keeps every visible phone number large and uncut`);
    }
    await page.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
