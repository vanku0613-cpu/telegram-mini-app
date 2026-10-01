const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('communal services page is reachable, organized, and uses unique callable contacts', async () => {
  const root = path.resolve(__dirname, '..');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404);
      return res.end();
    }
    res.setHeader('Content-Type', path.extname(file) === '.css' ? 'text/css' : path.extname(file) === '.js' ? 'text/javascript' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/communal-services/`);

    assert.equal(await page.title(), 'Коммунальные службы — Справочник Измаил');
    assert.deepEqual(await page.locator('main > *').evaluateAll(items => items.slice(0, 3).map(item => item.className)), ['cover', 'communal-nav', 'jump']);
    assert.deepEqual(await page.locator('.cover').evaluate(el=>Array.from(el.children).map(child=>child.classList.contains('cover-art')?'image':child.classList.contains('cover-copy')?'text':'other')),['image','text'],'utility illustration sits above the text in the same cover');
    assert.equal(await page.locator('.cover-art').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.cover-copy').getBoundingClientRect().top),true,'utility illustration is above its title and description');
    assert.deepEqual(await page.locator('.service').evaluateAll(items => items.map(item => item.id)), ['light', 'water', 'gas', 'heat', 'housing']);
    assert.deepEqual(await page.locator('.home-back').evaluateAll(items => items.map(item => item.getAttribute('data-main-back') !== null)), [true, true]);
    assert.equal(await page.locator('.service:visible').count(), 0, 'utility information remains closed until its category is opened');
    assert.equal(await page.locator('.jump').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,'utility buttons use the two-column home grid');
    assert.match(await page.locator('.jump').evaluate(el=>getComputedStyle(el).backgroundImage),/linear-gradient/,'utility menu uses the same framed directory surface');
    const tileHeights=await page.locator('.communal-tab').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().height));
    assert.ok(tileHeights.every(height=>height===tileHeights[0]),'utility buttons share a consistent height');
    assert.ok(await page.locator('.communal-tab').first().evaluate(item=>item.getBoundingClientRect().width>=170),'utility buttons use the same full card width as services and masters');
    const communalTile=await page.locator('.communal-tab').first().evaluate(item=>{const style=getComputedStyle(item);const rect=item.getBoundingClientRect();return{width:rect.width,height:rect.height,background:style.backgroundImage,border:style.borderColor,shadow:style.boxShadow}});
    assert.deepEqual({width:communalTile.width,height:communalTile.height},{width:172.5,height:90},'utility tiles match the services and masters card dimensions');
    assert.equal(await page.locator('.jump').evaluate(el=>Math.round(el.querySelector('.communal-tab').getBoundingClientRect().left-el.getBoundingClientRect().left)),6,'the frame sits as close to the utility tiles as in services and masters');
    assert.match(communalTile.background,/rgb\(12, 66, 111\).*rgb\(8, 45, 84\).*rgb\(6, 30, 59\)/,'utility tiles keep the services and masters blue surface');
    assert.equal(communalTile.border,'rgba(79, 165, 219, 0.8)');
    assert.ok(await page.locator('.communal-copy strong').evaluateAll(items=>items.every(item=>parseFloat(getComputedStyle(item).fontSize)>=17)),'utility names stay large and readable');
    await page.locator('[data-open="water"]').click();
    await page.locator('#water').waitFor({state:'visible'});
    assert.equal(await page.locator('#water').isVisible(),true);
    assert.equal(await page.locator('#light').isVisible(),false);
    assert.equal(await page.locator('.jump').isVisible(),false);
    assert.equal(await page.locator('#communalBack').isVisible(),true);
    assert.equal(await page.locator('#communalBackBottom').isVisible(),true);
    assert.equal(await page.locator('#communalBack').textContent(),'← Вернуться в раздел');
    assert.equal(await page.locator('#communalBackBottom').textContent(),'← Вернуться в раздел');
    const waterActions=await page.locator('#water .contact').first().locator('.links a').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().top));
    assert.equal(new Set(waterActions.map(top=>Math.round(top))).size,1,'water service actions share one row');
    const favoriteButton=page.locator('#water .favorite-toggle').first();
    const callButton=page.locator('#water .phone').first();
    assert.deepEqual(await callButton.evaluate(el=>{const style=getComputedStyle(el);return{minHeight:style.minHeight,padding:style.padding,borderRadius:style.borderRadius,background:style.backgroundColor}}),{minHeight:'48px',padding:'7px 8px',borderRadius:'11px',background:'rgb(10, 41, 69)'},'call buttons match the services and masters visual style');
    assert.deepEqual(await callButton.evaluate(el=>{const style=getComputedStyle(el),number=el.querySelector('strong').getBoundingClientRect(),label=el.querySelector('span').getBoundingClientRect();return{direction:style.flexDirection,align:style.alignItems,labelOnRight:label.left>number.left}}),{direction:'row',align:'center',labelOnRight:true},'phone number stays left and call action stays right');
    await favoriteButton.dispatchEvent('pointerdown');
    await page.waitForTimeout(220);
    assert.match(await favoriteButton.evaluate(el=>getComputedStyle(el).boxShadow),/rgba?\(0, (?:167|110), 255/,'favorite star uses the same electric-blue press rim');
    await page.setViewportSize({width:320,height:844});
    const returnLabel=await page.locator('#communalBack').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{whiteSpace:getComputedStyle(el).whiteSpace,lines:range.getClientRects().length}});
    assert.deepEqual(returnLabel,{whiteSpace:'nowrap',lines:1},'section-return label stays on one line on narrow phones');
    await page.setViewportSize({width:390,height:844});
    for(const nav of await page.locator('.communal-nav').all()){const row=await nav.locator('button,a').evaluateAll(items=>items.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().top));assert.equal(row[0],row[1],'section and home navigation share one row')}
    await page.locator('#communalBackBottom').click();
    await page.locator('.jump').waitFor({state:'visible'});
    await page.locator('[data-open="light"]').click();
    await page.locator('#light').waitFor({state:'visible'});
    const dtekActions=await page.locator('#light .contact').filter({hasText:'ДТЕК Одеські електромережі'}).locator('.links a').evaluateAll(items=>items.map(item=>Math.round(item.getBoundingClientRect().top)));
    assert.equal(new Set(dtekActions).size,2,'DTEK actions use a balanced two-by-two grid');
    await page.locator('#communalBack').click();
    await page.locator('.jump').waitFor({state:'visible'});
    assert.equal(await page.locator('.jump').isVisible(),true);
    await page.locator('[data-open="gas"]').click();
    await page.locator('#gas').waitFor({state:'visible'});
    assert.equal(await page.locator('#gas').isVisible(),true);
    assert.equal(await page.locator('#water').isVisible(),false);
    for(const links of await page.locator('#gas .links').all()){
      const positions=await links.locator('a').evaluateAll(items=>items.map(item=>Math.round(item.getBoundingClientRect().top)));
      assert.equal(new Set(positions).size,1,'gas app and website buttons share one compact row');
    }
    assert.equal(await page.locator('#gas .phone span').first().textContent(),'Позвонить');
    assert.deepEqual(await page.locator('#gas .phone').first().evaluate(el=>{const style=getComputedStyle(el);return{minHeight:style.minHeight,padding:style.padding,borderRadius:style.borderRadius,background:style.backgroundColor}}),{minHeight:'48px',padding:'7px 8px',borderRadius:'11px',background:'rgb(10, 41, 69)'},'gas call buttons keep the shared services and masters style');
    await page.locator('#communalBack').click();
    await page.locator('.jump').waitFor({state:'visible'});
    const phones = await page.locator('a.phone[href^="tel:"]').evaluateAll(items => items.map(item => item.getAttribute('href')));
    assert.equal(phones.length, new Set(phones).size, 'telephone links must not be duplicated');
    assert.ok(phones.includes('tel:104'));
    assert.equal(await page.locator('a[href="https://t.me/DTEKOdeskiElektromerezhiBot"]').count(), 1);
    assert.equal(await page.locator('a[href="https://t.me/OdessaGasDistributionBot"]').count(), 1);
    assert.equal(await page.locator('.unverified').count(), 0);
    assert.doesNotMatch(await page.locator('main').innerText(), /из предоставленного списка|свежего подтверждения|не подтверждены/i);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    const oldShelterText = fs.readFileSync(path.join(root, 'ukrytia', 'index.html'), 'utf8');
    assert.equal(oldShelterText.includes('Ещё 3 адреса из публикации от 9 марта 2022 года'), false);
    assert.equal(oldShelterText.includes('legacy-shelters'), false);
    assert.match(fs.readFileSync(path.join(root, 'settings.js'), 'utf8'), /"Коммунальные службы":\s*"\.\/communal-services\/\?v=utility-cards-6"/);
    assert.match(fs.readFileSync(path.join(root, 'main-v2', 'settings.js'), 'utf8'), /"Коммунальные службы":\s*"\.\.\/communal-services\/\?v=utility-cards-6"/);

    await page.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
    assert.equal(await page.locator('#weatherPanel .info-title').evaluate(el => getComputedStyle(el).textAlign), 'center');
    assert.equal(await page.locator('#weatherPanel .temp').evaluate(el => getComputedStyle(el).textAlign), 'center');
    assert.equal(await page.locator('#weatherPanel .condition').evaluate(el => getComputedStyle(el).textAlign), 'center');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
