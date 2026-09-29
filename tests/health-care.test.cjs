const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=require('../health-care/data.json');

test('all source categories, phone numbers and media are transferred with provenance',()=>{
  const original=require('../health-care/research/telegram.json');
  assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
  for(const c of original){
    const category=data.categories.find(x=>x.id===c.id);assert.ok(category,c.id);
    const phones=new Set(data.records.filter(r=>r.category===c.id).flatMap(r=>r.phones));
    for(const match of c.text.matchAll(/(?<!\d)(?:\+?38[\s-]*)?(0\d{9})(?!\d)/g))assert.ok(phones.has(match[1]),`${c.id}: ${match[1]}`);
    assert.equal(category.media.length,c.media.length||1);
    for(const m of category.media){assert.ok(fs.existsSync(path.join(root,'health-care',m.src)));assert.ok(fs.existsSync(path.join(root,'health-care',m.poster)));}
  }
  for(const r of data.records){assert.ok(data.sources[r.source]);assert.ok(data.categories.some(c=>c.id===r.category));for(const p of r.phones)assert.match(p,/^(0\d{9}|1677)$/);if(r.source==='doctors')assert.match(r.phoneLabel,/Регистратура/);}
});

test('preview: routes, search, city filter, calls, navigation, video and mobile layout',async()=>{
  const server=http.createServer((req,res)=>{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';file=path.join(root,file);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.mp4':'video/mp4'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],videos=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('.mp4'))videos.push(r.url());});
    const origin=`http://127.0.0.1:${server.address().port}/health-care/`;
    await page.goto(origin);await page.locator('.branch-card').first().waitFor();
    assert.equal(await page.locator('.branch-card').count(),2);
    assert.equal(await page.locator('#topNav a[href="../main-v2/"]').count(),1);
    assert.equal(await page.locator('#bottomNav a[href="../main-v2/"]').count(),1);
    await page.locator('a.branch-card.doctors').click();await page.locator('.category-tile').first().waitFor();
    assert.equal(await page.locator('.category-tile').count(),data.categories.filter(c=>c.branch==='doctors').length);
    await page.locator('#search').fill('стомат');await page.waitForFunction(()=>document.querySelectorAll('.contact').length>0);
    assert.ok((await page.locator('#resultStatus').innerText()).includes('Найдено'));
    await page.locator('#clear').click();
    await page.locator('.category-tile[href="#category/96259"]').click();await page.locator('.contact').first().waitFor();
    assert.ok(await page.locator('.other-city').count()>0);assert.equal(await page.locator('[data-city]').count(),0);
    await page.locator('#topNav a[href="#doctors"]').click();await page.locator('.category-tile').first().waitFor();
    await page.goBack();await page.locator('.contact').first().waitFor();assert.match(await page.locator('#title').innerText(),/Хирург/);
    for(const c of data.categories){
      await page.goto(origin+'#category/'+c.id);
      await page.waitForFunction(name=>document.getElementById('title').textContent===name,c.name);
      assert.equal(await page.locator('.contact').count(),c.count);
      assert.equal(await page.locator('#topNav .secondary').count(),1);assert.equal(await page.locator('#bottomNav .secondary').count(),1);
      for(const href of await page.locator('.call').evaluateAll(a=>a.map(a=>a.getAttribute('href'))))assert.match(href,/^tel:(\+380\d{9}|1677)$/);
    }
    await page.goto(origin+'#category/96046');await page.locator('#profileMedia video').waitFor();
    assert.equal(await page.locator('.call').first().getAttribute('href'),'tel:+380635575126');
    await page.waitForFunction(()=>document.querySelector('#profileMedia video').currentTime>0);
    assert.equal(await page.locator('#profileMedia video').evaluate(v=>v.muted&&v.loop&&v.playsInline&&!v.controls),true);
    assert.equal(await page.evaluate(()=>{const y=s=>document.querySelector(s).getBoundingClientRect().top;return y('#profileMedia')<y('#topNav')&&y('#topNav')<y('.finder')}),true);
    for(const width of [320,390,768]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const boxes=await page.locator('.contact').evaluateAll(a=>a.slice(0,2).map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));assert.equal(boxes[0].y,boxes[1].y);assert.ok(boxes[1].x>boxes[0].x);for(const a of await page.locator('.call').all()){const b=await a.boundingBox();assert.ok(b.width>=40&&b.height>=40);}}
    await page.locator('#search').fill('099 533 83 11');assert.equal(await page.locator('.contact').count(),1);assert.match(await page.locator('.contact h2').innerText(),/Виктория/);
    await page.locator('#search').fill('несуществующийконтакт');assert.equal(await page.locator('.contact').count(),0);assert.match(await page.locator('.empty').innerText(),/Ничего не найдено/);
    await page.goto(origin+'#category/96046');await page.reload();await page.locator('[data-favorite]').first().waitFor();
    const star=page.locator('[data-favorite]').first();await star.click();assert.equal(await star.getAttribute('aria-pressed'),'true');
    await page.reload();await page.locator('[data-favorite][aria-pressed="true"]').waitFor();
    assert.equal(await page.locator('#favoritesLink').count(),0);await page.goto(origin+'#favorites');await page.waitForFunction(()=>document.getElementById('title').textContent==='Избранное');
    assert.equal(await page.locator('.contact').count(),1);await page.locator('[data-favorite]').click();assert.equal(await page.locator('.contact').count(),0);
    await page.goto(origin+'#city/'+encodeURIComponent('Килия'));await page.locator('.contact').first().waitFor();
    for(const t of await page.locator('.location').allTextContents())assert.ok(t.includes('Килия'));
    await page.goto(origin+'#doctors');await page.locator('.category-tile').first().waitFor();assert.equal(await page.locator('.quick-links a[href="#category/96230"]').count(),0);
    assert.equal(await page.locator('#subtitle, #filters, .contact details').count(),0);
    const nav=await page.locator('#topNav .back-btn, #bottomNav .back-btn').evaluateAll(a=>a.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert.deepEqual(nav.slice(0,2),nav.slice(2));
    assert.equal(await page.locator('.veterinary').count(),3);
    assert.match(await page.locator('#topNav a').first().innerText(),/главное меню/);
    assert.equal(await page.locator('.city-options').isVisible(),false);
    await page.locator('.city-picker summary').click();assert.equal(await page.locator('.city-options').isVisible(),true);
    await page.locator('.city-options a').filter({hasText:'Килия'}).click();await page.waitForFunction(()=>document.getElementById('title').textContent==='Килия');
    assert.equal(await page.locator('.city-picker[open]').count(),0);
    await page.goto(origin+'#category/96292');await page.locator('.reviews').first().waitFor();
    await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),1);
    await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),0);
    await page.goto(origin);await page.locator('.branch-visual').first().waitFor();assert.deepEqual(await page.locator('.cover-title').allTextContents(),['Врачи и здоровье','Красота и уход']);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(r=>server.close(r));}
});

test('new published phones are unique and every category has local media',()=>{const previous=JSON.parse(require('node:child_process').execFileSync('git',['show','664c670:health-care/data.json'],{encoding:'utf8'}));const old=new Set(previous.records.flatMap(r=>r.phones));const fresh=data.records.flatMap(r=>r.phones).filter(p=>!old.has(p));assert.equal(new Set(fresh).size,fresh.length);for(const c of data.categories){assert.ok(c.media.length);for(const m of c.media)assert.ok(fs.existsSync(path.join(root,'health-care',m.src)))}for(const r of data.records){for(const id of r.additionalSources||[])assert.ok(data.sources[id]);if(r.review)assert.match(r.review.url,/^https:\/\//)}});
