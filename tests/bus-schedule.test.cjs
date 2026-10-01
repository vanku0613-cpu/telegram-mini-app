const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('bus schedule is local, complete, and grouped behind one folder', async () => {
  const root = path.resolve(__dirname, '..');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'transport/bus-schedule/schedule-data.json'), 'utf8'));
  assert.deepEqual(data.map(route => route.id), ['1','3','5','7','10','10-А','11','12','14','15','16','17','18','19','22','23']);
  assert.ok(data.every(route => route.schedules.length && route.maps.length), 'every route includes schedule and map data');
  assert.deepEqual(data.find(route => route.id === '17').schedules.map(item => item.label), ['Рабочие дни','Понедельник','Выходные дни']);

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
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/transport/bus-schedule/`);
    assert.equal(await page.getByRole('button', { name: /Автобусы Измаил — расписание/ }).count(), 1);
    assert.equal(await page.locator('.route:visible').count(), 0, 'old route folders are hidden from the section landing');
    assert.equal(await page.getByText('Открыть источник', { exact: false }).count(), 0, 'source links are not exposed');
    await page.getByRole('button', { name: /Автобусы Измаил — расписание/ }).click();
    await page.locator('.route').first().waitFor();
    assert.equal(await page.locator('.route').count(), 16);
    const routeLayout = await page.locator('.route').evaluateAll(items => ({
      columns: new Set(items.map(item => Math.round(item.getBoundingClientRect().left))).size,
      rows: new Set(items.map(item => Math.round(item.getBoundingClientRect().top))).size,
      maxHeight: Math.max(...items.map(item => item.getBoundingClientRect().height))
    }));
    assert.equal(routeLayout.columns, 4);
    assert.equal(routeLayout.rows, 4);
    assert.ok(routeLayout.maxHeight >= 54 && routeLayout.maxHeight <= 76, 'route buttons fill the phone screen without becoming oversized');
    assert.equal(await page.locator('#routeDetail').isVisible(), false);
    await page.getByRole('button', { name: 'Маршрут №1', exact: true }).click();
    assert.equal(await page.locator('.route:visible').count(), 0, 'route choices disappear while one schedule is open');
    assert.equal(await page.locator('#routeDetail').isVisible(), true);
    assert.equal(await page.getByRole('button', { name: 'К расписанию', exact: true }).isVisible(), true);
    assert.deepEqual(await page.locator('.day-tab').allTextContents(), ['Рабочие дни','Выходные дни','Карта']);
    assert.equal(await page.locator('.schedule-table tbody tr').count(), 47);
    const backWidth = await page.getByRole('button', { name: 'К расписанию', exact: true }).evaluate(item => item.getBoundingClientRect().width);
    const detailWidth = await page.locator('#routeDetail').evaluate(item => item.getBoundingClientRect().width);
    assert.ok(backWidth < detailWidth / 2, 'the schedule return is a compact separate button');
    await page.getByRole('button', { name: 'К расписанию', exact: true }).click();
    assert.equal(await page.locator('.route:visible').count(), 16);
    await page.getByRole('button', { name: 'Маршрут №17', exact: true }).click();
    assert.deepEqual(await page.locator('.day-tab').allTextContents(), ['Рабочие дни','Понедельник','Выходные дни','Карта']);
    await page.getByRole('button', { name: 'Выходные дни', exact: true }).click();
    assert.equal(await page.locator('.schedule-table tbody tr').count(), 77);
    await page.getByRole('button', { name: 'Карта', exact: true }).click();
    assert.equal(await page.locator('.map-card').count(), 2);
    assert.equal(await page.locator('a[href*="izzzzi.info"]').count(), 0);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
