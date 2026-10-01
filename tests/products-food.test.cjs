const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('food and delivery directory switches sections and keeps contact links unique', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/products-food/`);

    assert.equal(await page.title(), 'Продукты питания — Справочник Измаил');
    assert.deepEqual(await page.locator('main > *').evaluateAll(items => items.slice(0, 3).map(item => item.className || item.tagName.toLowerCase())), ['cover', 'section-nav', 'chooser']);
    assert.equal(await page.locator('nav.tabs .tab[data-tab]').count(), 5);
    assert.deepEqual(await page.locator('.home-back').evaluateAll(items => items.map(item => item.getAttribute('data-main-back') !== null)), [true, true]);
    assert.equal(await page.locator('.tabs').isVisible(), true);
    assert.equal(await page.locator('.panel:visible').count(), 0, 'category details stay closed until a button is selected');
    assert.equal(await page.locator('#sectionBack').isVisible(), false);
    assert.equal(await page.locator('#sectionBackBottom').isVisible(), false);
    assert.equal(await page.locator('input[type="search"]').count(), 0);
    assert.equal(await page.locator('.unverified').count(), 0, 'small source and verification disclaimers are omitted from food listings');
    assert.equal(await page.locator('.hint').count(), 0, 'unneeded source explanation is omitted');
    assert.equal(await page.locator('.footer-note').count(), 0, 'unneeded footer disclaimer is omitted');
    const pageText = (await page.locator('main').innerText()).toLocaleLowerCase('ru');
    assert.equal(/публикац|публичн(?:ого)? справочник|телефоны заведений/.test(pageText), false, 'source and phone-origin explanations are omitted');
    const supportingTextSizes=await page.locator('.contact-note, .phone span, .tag, .links a, .subtypes span').evaluateAll(items=>items.map(item=>({text:item.textContent.trim(),size:parseFloat(getComputedStyle(item).fontSize)})));
    assert.ok(supportingTextSizes.every(item=>item.size>=12),'supporting text and actions remain comfortably readable: '+JSON.stringify(supportingTextSizes.filter(item=>item.size<12)));

    await page.locator('.tab[data-tab="restaurants"]').click();
    assert.equal(await page.locator('#restaurants').isVisible(), true);
    assert.equal(await page.locator('#fastfood').isVisible(), false);
    assert.equal(await page.locator('.tabs').isVisible(), false, 'the category grid leaves the screen when a category opens');
    assert.equal(await page.locator('#sectionBack').isVisible(), true);
    assert.equal(await page.locator('#sectionBackBottom').isVisible(), true);
    assert.equal(await page.locator('#sectionBack').textContent(), '← Вернуться в раздел');
    assert.equal(await page.locator('#sectionBackBottom').textContent(), '← Вернуться в раздел');
    await page.setViewportSize({width:320,height:844});
    const returnLabel=await page.locator('#sectionBack').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{whiteSpace:getComputedStyle(el).whiteSpace,lines:range.getClientRects().length}});
    assert.deepEqual(returnLabel,{whiteSpace:'nowrap',lines:1},'section-return label stays on one line on narrow phones');
    await page.setViewportSize({width:390,height:844});
    assert.match(await page.locator('#sectionBack').evaluate(e=>getComputedStyle(e).backgroundImage), /linear-gradient/);
    for(const nav of await page.locator('.section-nav').all()){const row=await nav.locator('button,a').evaluateAll(items=>items.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().top));assert.equal(row[0],row[1],'section return and main-menu buttons share one row at both ends')}
    await page.locator('#sectionBack').click();
    assert.equal(await page.locator('.tabs').isVisible(), true);
    await page.locator('nav.tabs .tab[data-tab="groceries"]').click();
    assert.equal(await page.locator('#groceries').isVisible(), true);
    assert.equal(await page.locator('#restaurants').isVisible(), false);
    await page.locator('#sectionBackBottom').click();
    await page.locator('.tab[data-tab="basics"]').click();
    assert.equal(await page.locator('#basics').isVisible(), true);
    await page.locator('#sectionBack').click();
    await page.locator('.tab[data-tab="gifts"]').click();
    assert.equal(await page.locator('#gifts').isVisible(), true);
    assert.deepEqual(await page.locator('#gifts a.phone[href^="tel:"]').evaluateAll(items => items.map(item => item.getAttribute('href'))), ['tel:+380976143819', 'tel:+380971798587']);
    assert.match(await page.locator('#gifts').innerText(), /Фрукты и клубника в шоколаде[\s\S]*Зефирные цветы/);
    await page.locator('#sectionBack').click();
    await page.locator('nav.tabs .tab[data-tab="groceries"]').click();

    const phones = await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(item => item.getAttribute('href')));
    assert.equal(phones.length, new Set(phones).size, 'telephone links must not be duplicated');
    assert.ok(phones.includes('tel:+380684919192'));
    assert.ok(phones.includes('tel:+380639993132'));
    assert.ok(await page.locator('a[href="https://dostavochka.in.ua/catalog"]').count() >= 1);
    assert.equal(await page.locator('a[href="https://capofood.choiceqr.com/section:menyu/burgeri-333"]').count(), 1);
    assert.equal(await page.locator('a[href*="t.me/SPRAVOCHNIK_IZMAIL"]').count(), 0, 'food cards do not link back to source posts');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 320, height: 780 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 768, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('#groceries .cards').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);

    assert.match(fs.readFileSync(path.join(root, 'settings.js'), 'utf8'), /"Продукты питания":\s*"\.\/products-food\/"/);
    assert.match(fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8'), /"Продукты питания":\s*"\.\.\/products-food\/"/);
    await page.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
    await page.waitForFunction(() => document.querySelector('.card[data-title="Продукты питания"]')?.getAttribute('data-nav') === '../products-food/');
    assert.ok(await page.locator('.card-copy strong').evaluateAll(items=>items.every(el=>parseFloat(getComputedStyle(el).fontSize)>=11.5)),'home menu labels use a more readable type size');
    assert.ok(await page.locator('.card-copy strong').evaluateAll(items=>items.every(el=>getComputedStyle(el).whiteSpace==='nowrap')),'home menu labels remain on one line');
    assert.ok(parseFloat(await page.locator('#shelterBtn .shelter-label').evaluate(el=>getComputedStyle(el).fontSize))>=13,'shelter label is enlarged');
    assert.equal(await page.locator('#shelterBtn .shelter-label').evaluate(el=>getComputedStyle(el).textAlign),'center','shelter label is centered');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
