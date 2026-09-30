const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('services and masters follow the source category hierarchy and keep contacts in their subcategory', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : /\.(jpe?g)$/i.test(file) ? 'image/jpeg' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/services-masters/`);
    assert.equal(await page.title(), 'Услуги и мастера — Справочник Измаил');
    assert.deepEqual((await page.locator('[data-section]').allTextContents()).map(t => t.replace(/\s+/g, ' ').trim()), ['🛠️ Мастера', '🧰 Услуги']);
    assert.equal(await page.locator('.home-back').count(), 2);
    assert.deepEqual(await page.locator('.category strong').allTextContents(), ['Электрик / сантехник','Строительство / ремонт','Услуги по дому / участку','Бытовая техника','Окна и двери','Авто / мототехника','IT и техника']);
    assert.equal(await page.getByText('Мебель', { exact: true }).count(), 0, 'empty furniture source category is omitted');
    assert.equal(await page.locator('.category img, .subcat img').count(), 0, 'service and master buttons are photo-free');
    const masterTiles = await page.locator('.category').evaluateAll(items => items.map(item => ({height:item.getBoundingClientRect().height,font:parseFloat(getComputedStyle(item.querySelector('strong')).fontSize)})));
    assert.ok(masterTiles.every(tile => tile.height === masterTiles[0].height && tile.font >= 14), 'master buttons share a large, uniform size');
    const coverOrder = await page.evaluate(() => ({ art: document.querySelector('.cover-art').getBoundingClientRect().top, title: document.querySelector('.cover h1').getBoundingClientRect().top, home: document.querySelector('.home-back').getBoundingClientRect().top }));
    assert.ok(coverOrder.art < coverOrder.title && coverOrder.title < coverOrder.home, 'cover artwork appears before title and return navigation');

    await page.getByRole('button', { name: /Строительство \/ ремонт/ }).click();
    assert.equal(await page.locator('.subcat').count(), 16, 'construction and repair services remain individually selectable');
    assert.equal(await page.locator('.subcat img').count(), 0, 'specialization buttons contain no added photos');
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.equal(await page.locator('[data-back]').nth(1).textContent(), '← Вернуться в раздел');
    for(const nav of await page.locator('.paired-nav').all()){const row=await nav.locator('button,a').evaluateAll(items=>items.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().top));assert.equal(row[0],row[1],'section and home navigation share one row')}
    await page.locator('[data-back]').first().click();

    await page.getByRole('button', { name: /Электрик \/ сантехник/ }).click();
    assert.deepEqual(await page.locator('.subcat strong').allTextContents(), ['Электрик','Сантехник','Чистка канализации']);
    await page.getByRole('button', { name: /Электрик/ }).last().click();
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.equal(await page.locator('.contact h3').first().textContent(), 'Василий');
    assert.ok((await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(a => a.getAttribute('href')))).includes('tel:+380688481795'));
    assert.equal(await page.getByText('Афанасий', { exact: true }).count(), 0, 'contacts from other trade posts do not leak into this electrical list');
    await page.locator('[data-back]').first().click();
    assert.equal(await page.locator('.subcat').count(), 3);
    await page.locator('[data-back]').first().click();

    for (const categoryName of ['Услуги по дому / участку','Бытовая техника','Окна и двери','Авто / мототехника','IT и техника']) {
      await page.getByRole('button', { name: new RegExp(categoryName) }).click();
      assert.ok(await page.locator('.subcat').count() > 0, `${categoryName} has selectable specializations`);
      assert.equal(await page.locator('.subcat img').count(), 0, `${categoryName} buttons have no photos`);
      await page.locator('[data-back]').first().click();
    }

    await page.locator('[data-section="services"]').click();
    assert.ok(await page.locator('.category').count() > 0);
    assert.equal(await page.locator('.category').count(), 9);
    assert.equal(await page.locator('.category img').count(), 0, 'service buttons have no photos');
    await page.getByRole('button', { name: /Ассенизатор/ }).click();
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.deepEqual(await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(a => a.getAttribute('href'))), ['tel:+380972212131']);

    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no horizontal overflow at ${width}px`);
    }
    assert.match(fs.readFileSync(path.join(root, 'settings.js'), 'utf8'), /"Услуги и мастера":\s*"\.\/services-masters\/"/);
    assert.match(fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8'), /"Услуги и мастера":\s*"\.\.\/services-masters\/"/);
    assert.equal(fs.existsSync(path.join(root,'services-masters','photos')),false,'downloaded category photos were removed');
    assert.equal(fs.existsSync(path.join(root,'services-masters','repair-underway.jpg')),false,'the remaining category photo was removed too');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
