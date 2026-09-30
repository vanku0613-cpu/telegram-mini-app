const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('recreation directory includes the four numbered sections and fits mobile screens',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(file.endsWith('/'))file+='index.html';
    file=path.join(root,file);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://**',route=>route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/recreation/`);
    assert.equal(await page.title(),'Отдых • Жильё • Море — Справочник Измаил');
    assert.deepEqual(await page.locator('[role=tab]').allTextContents(),['🏖️Базы отдыха','♨️Сауны • Бани','🌿Беседки • Комплексы','🏊Бассейны']);
    assert.equal(await page.locator('.home-back').count(),2);
    assert.equal(await page.locator('.panel:visible').count(),0,'activity details are hidden until a category opens');
    assert.equal(await page.locator('.tabs').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2);
    const tileHeights=await page.locator('[role=tab]').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().height));
    assert.ok(tileHeights.every(height=>height===tileHeights[0]),'recreation buttons share one large-menu size');
    assert.equal(await page.getByText('Снять жильё',{exact:true}).count(),0,'the source category without listed contacts is omitted');
    const expected={bases:7,saunas:1,gazebos:3,pools:1};
    for(const [category,count] of Object.entries(expected)){
      await page.locator(`[data-tab="${category}"]`).click();
      const panel=page.locator(`#${category}`);
      assert.equal(await panel.isVisible(),true);
      assert.equal(await page.locator('.tabs').isVisible(),false,'the category chooser closes while details are shown');
      assert.equal(await page.locator('#sectionBack').isVisible(),true);
      assert.equal(await page.locator('#sectionBackBottom').isVisible(),true);
      assert.equal(await page.locator('#sectionBack').textContent(),'← Вернуться в раздел');
      assert.equal(await page.locator('#sectionBackBottom').textContent(),'← Вернуться в раздел');
      if(category==='bases'){
        await page.setViewportSize({width:320,height:844});
        const returnLabel=await page.locator('#sectionBack').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{whiteSpace:getComputedStyle(el).whiteSpace,lines:range.getClientRects().length}});
        assert.deepEqual(returnLabel,{whiteSpace:'nowrap',lines:1},'section-return label stays on one line on narrow phones');
        await page.setViewportSize({width:390,height:844});
      }
      for(const nav of await page.locator('.recreation-nav').all()){const row=await nav.locator('button,a').evaluateAll(items=>items.filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().top));assert.equal(row[0],row[1],'section and home navigation share one row')}
      const phones=await panel.locator('a.phone[href^="tel:"]').evaluateAll(items=>items.map(a=>a.getAttribute('href')));
      assert.equal(phones.length,count);
      assert.equal(new Set(phones).size,phones.length,category+' has no repeated phone numbers');
      assert.ok(phones.every(href=>/^tel:\+380\d{9}$/.test(href)));
      assert.equal(await panel.locator('.phone span').allTextContents().then(x=>x.every(t=>t==='Позвонить')),true);
      await page.locator('#sectionBackBottom').click();
      assert.equal(await page.locator('.tabs').isVisible(),true,'back returns to categories');
    }
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:800});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow at '+width+'px');
    }
    assert.match(fs.readFileSync(path.join(root,'settings.js'),'utf8'),/"Отдых • Жильё • Море":\s*"\.\/recreation\/"/);
    assert.match(fs.readFileSync(path.join(root,'main-v2','settings.js'),'utf8'),/"Отдых • Жильё • Море":\s*"\.\.\/recreation\/"/);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
