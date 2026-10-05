const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

test('cities and villages show every matching regional route without duplicate cards', async () => {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());

    await page.goto(`${base}/transport/city-schedule/?city=izmail`);
    assert.equal(await page.locator('.type-card').count(), 2);
    assert.equal(await page.getByRole('link', { name: /Городские автобусы/ }).count(), 1);
    await page.getByRole('button', { name: /Все направления · Измаил/ }).click();
    const izmailLabels = await page.locator('#routes .route').allTextContents();
    assert.ok(izmailLabels.includes('Утконосовка'));
    assert.ok(izmailLabels.includes('Болград'));
    assert.equal(new Set(izmailLabels).size, izmailLabels.length, 'Izmail route cards must be unique');

    await page.goto(`${base}/transport/city-schedule/?city=odesa`);
    await page.getByRole('button', { name: /Все направления · Одесса/ }).click();
    const odesaLabels = await page.locator('#routes .route').allTextContents();
    assert.ok(odesaLabels.includes('Измаил') || odesaLabels.includes('Килия'));
    assert.equal(new Set(odesaLabels).size, odesaLabels.length, 'Odesa route cards must be unique');

    await page.goto(`${base}/transport/city-schedule/?city=villages`);
    await page.getByRole('button', { name: 'Расписание Утконосовка' }).click();
    assert.deepEqual(await page.locator('#routes .route').allTextContents(), ['Измаил']);
    await page.getByRole('button', { name: 'Все сёла' }).click();
    await page.getByRole('button', { name: 'Расписание Новосёловка' }).click();
    assert.deepEqual((await page.locator('#routes .route').allTextContents()).sort(), ['Измаил', 'Килия']);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
