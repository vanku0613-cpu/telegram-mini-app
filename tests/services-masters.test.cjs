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
    assert.deepEqual((await page.locator('.section-tabs [data-section]').allTextContents()).map(t => t.replace(/\s+/g, ' ').trim()), ['Услуги', 'Мастера']);
    await page.locator('[data-section="masters"]').click();
    assert.equal(await page.locator('.home-back').count(), 2);
    assert.deepEqual(await page.locator('.category strong').allTextContents(), ['Электрик / сантехник','Строительство / ремонт','Услуги по дому / участку','Бытовая техника','Окна и двери','Авто / мототехника','IT и техника']);
    assert.equal(await page.getByText('Мебель', { exact: true }).count(), 0, 'empty furniture source category is omitted');
    assert.equal(await page.locator('.category img, .subcat img').count(), 0, 'service and master buttons are photo-free');
    const masterTiles = await page.locator('.category').evaluateAll(items => items.map(item => ({height:item.getBoundingClientRect().height,font:parseFloat(getComputedStyle(item.querySelector('strong')).fontSize)})));
    assert.ok(masterTiles.every(tile => tile.height === 90 && tile.font >= 11), 'master buttons share the compact, uniform directory size');
    const coverOrder = await page.evaluate(() => ({ art: document.querySelector('.cover-art').getBoundingClientRect().top, title: document.querySelector('.cover h1').getBoundingClientRect().top, home: document.querySelector('.home-back').getBoundingClientRect().top }));
    assert.ok(coverOrder.art < coverOrder.title && coverOrder.title < coverOrder.home, 'cover artwork appears before title and return navigation');

    const menuBackground=await page.locator('#view[data-section="masters"][data-level="categories"] .category').first().evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.match(menuBackground,/rgb\(12, 66, 111\)/,'buttons that open another folder use the saturated dark-blue surface');
    assert.ok(await page.locator('#view .category').evaluateAll(items=>items.every(item=>item.classList.contains('has-children'))),'buttons that open more folders use the folder color');
    await page.getByRole('button', { name: /Строительство \/ ремонт/ }).click();
    assert.match(await page.locator('#coverImage').getAttribute('src'),/masters-construction-cover-v1\.webp/,'the selected master folder gets its own meaningful cover');
    assert.equal(await page.locator('.subcat').count(), 16, 'construction and repair services remain individually selectable');
    assert.equal(await page.locator('.subcat img').count(), 0, 'specialization buttons contain no added photos');
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.equal(await page.locator('[data-back]').nth(1).textContent(), '← Вернуться в раздел');
    await page.setViewportSize({width:320,height:844});
    const returnLabel=await page.locator('[data-back]').first().evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{whiteSpace:getComputedStyle(el).whiteSpace,lines:range.getClientRects().length}});
    assert.deepEqual(returnLabel,{whiteSpace:'nowrap',lines:1},'section-return label stays on one line on narrow phones');
    await page.setViewportSize({width:390,height:844});
    const submenuBackground=await page.locator('#view[data-section="masters"][data-level="subcategories"] .subcat').first().evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.match(submenuBackground,/rgb\(32, 60, 87\)/,'buttons that open contacts use the calm blue-graphite surface');
    assert.notEqual(menuBackground,submenuBackground,'master categories and their specialization menu use distinct professional color surfaces');
    assert.ok(await page.locator('#view .subcat').evaluateAll(items=>items.every(item=>item.classList.contains('direct-entry'))),'buttons that open contacts use the direct-entry color');
    for(const nav of await page.locator('.paired-nav').all()){const row=await nav.locator('button,a').evaluateAll(items=>items.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().top));assert.equal(row[0],row[1],'section and home navigation share one row')}
    await page.locator('[data-back]').first().click();

    await page.getByRole('button', { name: /Электрик \/ сантехник/ }).click();
    assert.match(await page.locator('#coverImage').getAttribute('src'),/masters-electric-plumbing-cover-v1\.webp/);
    assert.deepEqual(await page.locator('.subcat strong').allTextContents(), ['Электрик','Сантехник','Чистка канализации']);
    await page.getByRole('button', { name: /Электрик/ }).last().click();
    assert.match(await page.locator('#coverImage').getAttribute('src'),/masters-electric-plumbing-cover-v1\.webp/,'contacts retain the selected parent-folder cover');
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.equal(await page.locator('.contact h3').first().textContent(), 'Василий');
    assert.ok((await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(a => a.getAttribute('href')))).includes('tel:+380688481795'));
    assert.equal(await page.getByText('Афанасий', { exact: true }).count(), 0, 'contacts from other trade posts do not leak into this electrical list');
    await page.locator('[data-back]').first().click();
    assert.equal(await page.locator('.subcat').count(), 3);
    await page.locator('[data-back]').first().click();

    const expectedCovers={
      'Услуги по дому / участку':'masters-home-yard-cover-v1.webp',
      'Бытовая техника':'masters-appliances-cover-v1.webp',
      'Окна и двери':'masters-windows-doors-cover-v1.webp',
      'Авто / мототехника':'masters-auto-moto-cover-v1.webp',
      'IT и техника':'masters-it-tech-cover-v1.webp'
    };
    for (const categoryName of Object.keys(expectedCovers)) {
      await page.getByRole('button', { name: new RegExp(categoryName) }).click();
      assert.ok((await page.locator('#coverImage').getAttribute('src')).includes(expectedCovers[categoryName]),`${categoryName} uses its own cover`);
      assert.ok(await page.locator('.subcat').count() > 0, `${categoryName} has selectable specializations`);
      assert.equal(await page.locator('.subcat img').count(), 0, `${categoryName} buttons have no photos`);
      if(categoryName==='Услуги по дому / участку'){
        await page.getByRole('button',{name:/Уход за садом/}).click();
        assert.deepEqual(await page.locator('a.phone[href^="tel:"]').evaluateAll(items=>items.map(a=>a.getAttribute('href'))),['tel:+380637563046','tel:+380973388892'],'Dmitry has two unique phones in one service card');
        await page.locator('[data-back]').first().click();
      }
      await page.locator('[data-back]').first().click();
    }

    await page.locator('[data-section="services"]').click();
    assert.ok(await page.locator('.category').count() > 0);
    assert.equal(await page.locator('.category').count(), 9);
    assert.ok(await page.locator('.category').evaluateAll(items=>items.every(item=>item.classList.contains('direct-entry'))),'service buttons that open contacts use the direct-entry color');
    assert.equal(await page.locator('.category img').count(), 0, 'service buttons have no photos');
    await page.getByRole('button', { name: /Ассенизатор/ }).click();
    assert.equal(await page.locator('[data-back]').first().textContent(), '← Вернуться в раздел');
    assert.deepEqual(await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(a => a.getAttribute('href'))), ['tel:+380972212131']);

    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `no horizontal overflow at ${width}px`);
    }
    assert.match(fs.readFileSync(path.join(root, 'settings.js'), 'utf8'), /"Услуги и мастера":\s*"\.\/services-masters\/\?v=contextual-covers-2"/);
    assert.match(fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8'), /"Услуги и мастера":\s*"\.\.\/services-masters\/\?v=contextual-covers-2"/);
    assert.equal(fs.existsSync(path.join(root,'services-masters','photos')),false,'downloaded category photos were removed');
    assert.equal(fs.existsSync(path.join(root,'services-masters','repair-underway.jpg')),false,'the remaining category photo was removed too');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
