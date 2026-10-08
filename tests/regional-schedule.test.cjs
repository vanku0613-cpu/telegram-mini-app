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

    await page.clock.setFixedTime(new Date('2026-10-08T12:00:00+03:00'));
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/transport/city-schedule/?city=izmail');
    assert.equal(await page.locator('.type-card').count(),4);
    await page.getByRole('button',{name:/По области и в сёла/}).click();
    await page.getByRole('button',{name:'Расписание Измаил — Каменка'}).click();
    assert.match(await page.locator('#schedulePanel').innerText(),/не подтверждено/);
    assert.equal(await page.locator('.departure').count(),0);
    await page.getByRole('button',{name:'К расписанию',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Расписание Измаил — Каменка'}).isVisible(),true);
    await page.goto(base+'/transport/city-schedule/?city=odesa');
    await page.getByRole('button',{name:/По Украине/}).click();
    await page.getByRole('button',{name:'Расписание Одесса — Киев'}).click();
    assert.ok(await page.locator('.departure').count()>5);
    assert.ok(await page.locator('.station-card').count()>0);
    assert.equal(await page.locator('#departureDate').inputValue(),'2026-10-08');
    await page.locator('#departureDate').selectOption('2026-10-09');
    assert.match(await page.locator('#schedulePanel').innerText(),/LikeBus/);
    assert.ok(await page.locator('.schedule-sources a').count()>0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:'output/schedule-audit-20261008/odesa-kyiv-mobile.png',fullPage:true});
    await page.goto(base+'/transport/city-schedule/?city=villages');
    await page.getByRole('button',{name:'Расписание Каменка',exact:true}).click();
    await page.getByRole('button',{name:'Расписание Каменка — Измаил'}).click();
    assert.match(await page.locator('#schedulePanel').innerText(),/не подтверждено/);
    await page.goto(base+'/transport/city-schedule/?city=kyiv');
    await page.getByRole('button',{name:/Автобусы/}).first().click();
    await page.locator('#routes .route').first().click();
    assert.equal(await page.locator('#urbanDate').inputValue(),'2026-10-08');
    assert.ok(await page.locator('.departure').count()>0);
    await page.goto(base+'/transport/city-schedule/?city=izmail');
    await page.setViewportSize({width:1280,height:900});
    await page.screenshot({path:'output/schedule-audit-20261008/izmail-folders-desktop.png',fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
