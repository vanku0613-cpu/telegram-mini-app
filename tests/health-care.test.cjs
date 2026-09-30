const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=require('../health-care/data.json');

test('all source categories, phone numbers and media are transferred with provenance',()=>{
  assert.equal(data.cityOrder[0],'Измаил');
  for(const city of ['Винница','Вилково','Шевченково','Львов'])assert.ok(!data.cityOrder.includes(city));
  const original=require('../health-care/research/telegram.json');
  assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
  for(const c of original){
    const category=data.categories.find(x=>x.id===c.id);assert.ok(category,c.id);
    const phones=new Set(data.records.filter(r=>(r.sourceCategories||r.categories||[r.category]).includes(c.id)).flatMap(r=>r.phones));
    for(const match of c.text.matchAll(/(?<!\d)(?:\+?38[\s-]*)?(0\d{9})(?!\d)/g))assert.ok(phones.has(match[1]),`${c.id}: ${match[1]}`);
    assert.equal(category.media.length,c.media.length||1);
    for(const m of category.media){assert.ok(fs.existsSync(path.join(root,'health-care',m.src)));assert.ok(fs.existsSync(path.join(root,'health-care',m.poster)));}
  }
  for(const r of data.records){assert.ok(data.sources[r.source]);assert.ok(data.categories.some(c=>c.id===r.category));for(const p of r.phones)assert.match(p,/^(0\d{9}|1677)$/);if(r.source==='doctors')assert.match(r.phoneLabel,/Регистратура/);}
});


test('city directory: scoped specialties, stable favorites, static covers and mobile layout',async()=>{
  const server=http.createServer((req,res)=>{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(file.endsWith('/'))file+='index.html';file=path.join(root,file);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],videos=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('.mp4'))videos.push(r.url())});page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
    const origin='http://127.0.0.1:'+server.address().port+'/health-care/';
    let navigation=0;
    async function open(hash){await page.goto(origin+'?test='+(++navigation)+hash);await page.waitForFunction(()=>document.querySelector('#content .empty strong, .branch-card, .category-tile, .contact, .city-tab'));}
    await open('');assert.equal(await page.locator('.branch-card').count(),2);
    assert.deepEqual(await page.locator('.cover-title').allTextContents(),['Врачи и здоровье','Красота и уход']);
    await page.locator('.branch-card.doctors').click();await page.locator('.city-tab').first().waitFor();
    assert.equal(await page.locator('.city-tab[aria-current=true]').count(),0);
    assert.equal(await page.locator('.category-tile, .contact').count(),0);
    assert.equal(await page.locator('.city-heading').innerText(),'Выберите город');
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:900});
      const boxes=await page.locator('.city-tab').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}}));
      assert.equal(boxes.length,7);assert.equal(boxes[0].y,boxes[2].y);assert.ok(boxes[3].y>boxes[0].y);assert.ok(boxes[6].y>boxes[3].y);assert.ok(boxes.every(b=>Math.abs(b.w-boxes[0].w)<1&&Math.abs(b.h-boxes[0].h)<1));
      for(const img of await page.locator('.city-tab img').all()){await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
    }
    await page.setViewportSize({width:390,height:900});

    assert.equal(await page.evaluate(()=>document.querySelector('#cityNavigation').getBoundingClientRect().top>=document.querySelector('.finder').getBoundingClientRect().bottom),true);
    await page.locator('#search').fill('Килия');assert.equal(await page.locator('.city-tab').count(),1);await page.locator('#clear').click();
    await page.evaluate(()=>window.scrollTo(0,100));
    const initialScroll=await page.evaluate(()=>scrollY);
    assert.ok(initialScroll>0);
    await page.locator('.city-tab').filter({hasText:/^Измаил$/}).click();await page.locator('.category-tile').first().waitFor();
    assert.equal(await page.evaluate(()=>scrollY),initialScroll);
    // Short/empty city lists must not move the city controls or clamp scroll to the top.
    await page.locator('#cityNavigation').scrollIntoViewIfNeeded();
    for(const city of [...data.cityOrder.slice(1),'Измаил']){
      const before=await page.locator('#cityNavigation').boundingBox();
      const scroll=await page.evaluate(()=>scrollY);
      await page.getByRole('link',{name:city,exact:true}).click();
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),city);
      assert.ok(Math.abs((await page.locator('#cityNavigation').boundingBox()).y-before.y)<=1,city+' moved city controls');
      assert.ok(Math.abs((await page.evaluate(()=>scrollY))-scroll)<=1,city+' changed scroll');
    }
    assert.equal(await page.locator('.city-tab').first().innerText(),'Измаил');
    assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),'Измаил');
    assert.equal(await page.locator('.city-vet').count(),1);
    await page.locator('#search').fill('стомат');assert.ok(await page.locator('.contact').count()>0);
    for(const text of await page.locator('.location').allTextContents())assert.match(text,/Измаил|Украина/);
    // Every city offers specialty folders; every folder contains only this city's contacts.
    for(const city of data.cityOrder){
      await open('#city/'+encodeURIComponent(city));
      assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),city);
      assert.equal(await page.locator('.city-vet').count(),city==='Измаил'?1:0);
      const links=await page.locator('.category-tile').evaluateAll(a=>a.map(a=>a.getAttribute('href')));
      for(const href of links){
        await open(href);
        for(const text of await page.locator('.location').allTextContents())assert.ok(text.includes(city)||text.includes('Украина'),city+': '+text);
        assert.equal(await page.locator('#topNav .secondary').getAttribute('href'),'#city/'+encodeURIComponent(city));
        for(const href of await page.locator('.call').evaluateAll(a=>a.map(a=>a.getAttribute('href'))))assert.match(href,/^tel:(\+380\d{9}|1677)$/);
      }
    }
    // Concrete mapping regressions: combined legacy folders are split by specialty.
    await open('#city/'+encodeURIComponent('Килия')+'/category/96229');assert.equal(await page.locator('.contact').count(),12);
    await open('#city/'+encodeURIComponent('Килия')+'/category/96228');assert.equal(await page.locator('.contact').count(),4);
    await open('#city/'+encodeURIComponent('Татарбунары')+'/category/20125');assert.equal(await page.locator('.contact').count(),3);
    assert.ok((await page.locator('#profileMedia img').last().getAttribute('src')).includes('96323'));
    await open('#city/'+encodeURIComponent('Киев')+'/category/96260');assert.equal(await page.locator('.contact').count(),1);assert.match(await page.locator('.contact h2').innerText(),/Филипчук/);
    await page.locator('#topNav .secondary').click();await page.locator('.category-tile').first().waitFor();assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),'Киев');
    await page.goBack();await page.locator('.contact').waitFor();assert.match(await page.locator('.contact h2').innerText(),/Филипчук/);
    await open('#category/96319');assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),'Килия');
    await open('#category/96323');assert.equal(await page.locator('.contact').count(),3);
    await open('#beauty');assert.equal(await page.locator('.category-tile').count(),8);assert.equal(await page.locator('.city-tab').count(),0);
    await open('#city/'+encodeURIComponent('Одесса')+'/category/96306');
    assert.equal(await page.locator('[data-record="r91"]').count(),1);
    await page.locator('[data-record="r91"] [data-favorite]').click();
    await open('#city/'+encodeURIComponent('Одесса')+'/category/96311');
    assert.equal(await page.locator('[data-record="r91"] [data-favorite]').getAttribute('aria-pressed'),'true');
    await open('#favorites');assert.equal(await page.locator('.contact').count(),1);
    assert.equal(await page.locator('.contact h2').innerText(),'Гонта Ирина Анатольевна');
    await page.locator('[data-favorite]').click();
    await open('#city/'+encodeURIComponent('Одесса'));
    await page.locator('#search').fill('048 263 04 80');assert.equal(await page.locator('.contact').count(),1);
    assert.equal(await page.locator('.phone-number').count(),1);
        // Existing saved keys must survive the category/city migration.
    const favorite=data.records.find(r=>r.id==='r101');
    await page.evaluate(key=>localStorage.setItem('izmail.health.favorites.v1',JSON.stringify([key])),JSON.stringify([favorite.name,favorite.phones[0]]));
    await open('#favorites');assert.equal(await page.locator('.contact').count(),1);assert.match(await page.locator('.contact h2').innerText(),/Степаненко/);
    await open('#category/96046');await page.locator('[data-favorite]').first().click();
    await page.reload();await page.locator('[data-favorite][aria-pressed=true]').waitFor();
    await open('#favorites');assert.equal(await page.locator('.contact').count(),2);
    while(await page.locator('[data-favorite]').count())await page.locator('[data-favorite]').first().click();
    assert.equal(await page.locator('.contact').count(),0);
    await open('#category/96046');
    assert.equal(await page.evaluate(()=>{const y=s=>document.querySelector(s).getBoundingClientRect().top;return y('#profileMedia')<y('#topNav')&&y('#topNav')<y('.finder')}),true);
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const boxes=await page.locator('.contact').evaluateAll(a=>a.slice(0,2).map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));assert.equal(boxes[0].y,boxes[1].y);assert.ok(boxes[1].x>boxes[0].x);
      for(const selector of ['#topNav','#bottomNav']){
        const links=page.locator(selector+' a');assert.deepEqual(await links.allTextContents(),['Назад в раздел','Вернуться в главное меню']);
        const rects=await links.evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height,fits:e.scrollWidth<=e.clientWidth})));
        assert.equal(rects[0].y,rects[1].y);assert.equal(rects[0].h,rects[1].h);assert.ok(rects.every(r=>r.fits));
      }
      const nav=await page.locator('#topNav .back-btn, #bottomNav .back-btn').evaluateAll(a=>a.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert.deepEqual(nav.slice(0,2),nav.slice(2));
    }
    await page.locator('#search').fill('099 533 83 11');assert.equal(await page.locator('.contact').count(),1);assert.match(await page.locator('.contact h2').innerText(),/Виктория/);
    await page.locator('#search').fill('несуществующийконтакт');assert.equal(await page.locator('.contact').count(),0);
    await open('#category/96292');await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),1);await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),0);
    for(const hash of ['#city/'+encodeURIComponent('Измаил'),'#city/'+encodeURIComponent('Татарбунары'),'#beauty']){
      await open(hash);
      for(const img of await page.locator('.category-tile img:not(.visual-backdrop)').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
      assert.equal(await page.locator('video').count(),0);
      await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.match(await page.locator('#topNav a:not(.secondary)').innerText(),/главное меню/);
    }
    assert.deepEqual(videos,[]);assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(r=>server.close(r));}
});

test('all directory covers are static and removed videos cannot ship',()=>{
  assert.equal(fs.readdirSync(path.join(root,'health-care/media')).filter(p=>p.endsWith('.mp4')).length,0);
  for(const c of data.categories)for(const m of c.media){assert.equal(m.type,'image');assert.match(m.src,/cover-.+\.jpg$/)}
});

test('new published phones are unique and every category has local media',()=>{const previous=JSON.parse(require('node:child_process').execFileSync('git',['show','664c670:health-care/data.json'],{encoding:'utf8'}));const old=new Set(previous.records.flatMap(r=>r.phones));const fresh=data.records.flatMap(r=>r.phones).filter(p=>!old.has(p));assert.equal(new Set(fresh).size,fresh.length);for(const c of data.categories){assert.ok(c.media.length);for(const m of c.media)assert.ok(fs.existsSync(path.join(root,'health-care',m.src)))}for(const r of data.records){for(const id of r.additionalSources||[])assert.ok(data.sources[id]);if(r.review)assert.match(r.review.url,/^https:\/\//)}});


test('workbook phones are complete, normalized and unique; specialty changes preserve favorites',()=>{
  const sourceFile=path.join(root,'health-care/research/workbook-20260930.json');
  const raw=fs.existsSync(sourceFile)?JSON.parse(fs.readFileSync(sourceFile,'utf8')):null;
  const imported=data.records.filter(r=>r.workbookContacts);
  const previous=JSON.parse(require('child_process').execFileSync('git',['show','407f77b:health-care/data.json'],{encoding:'utf8'}));
  const phones=raw?[...raw.sheets['Контакты_уникальные'].map(c=>c['Телефон E.164']),...raw.sheets['Требует_проверки'].map(c=>c['Найденный телефон']).filter(Boolean)].map(p=>p.replace(/\D/g,'').slice(-10)):imported.flatMap(r=>r.phones);
  assert.equal(new Set(phones).size,20);
  const oldPhones=new Set(previous.records.flatMap(r=>r.phones));
  assert.equal(phones.filter(p=>!oldPhones.has(p)).length,18);
  assert.equal(phones.filter(p=>oldPhones.has(p)).length,2);
  for(const p of phones)assert.equal(data.records.filter(r=>r.phones.includes(p)).length,1,p);
  const gonta=data.records.find(r=>r.phones.includes('0677472375'));
  assert.equal(gonta.name,'Гонта Ирина Анатольевна');assert.equal(gonta.favoriteName,'Гонта Ирина');assert.deepEqual(gonta.categories,['96306','96311']);
  const common=data.records.find(r=>r.phones.includes('0482630480'));
  assert.deepEqual(common.categories,['96297','96260']);assert.match(common.note,/Аствацатрян/);assert.match(common.note,/Мищенко/);

  const keys=new Set(data.records.flatMap(r=>r.phones.map(p=>JSON.stringify([r.favoriteName||r.name,p]))));
  for(const r of previous.records)for(const p of r.phones)assert.ok(keys.has(JSON.stringify([r.name,p])),'Lost favorite '+r.name);
  for(const r of data.records.filter(r=>r.workbookContacts)){
    for(const id of r.categories)assert.ok(data.categories.some(c=>c.id===id));
    for(const id of r.additionalSources||[])assert.ok(data.sources[id]);
  }
});

test('reviewed city additions retain provenance and introduce no duplicate phones',()=>{
 const additions=require('../health-care/research/city-additions-20260930.json');
 for(const city of ['Киев','Одесса','Татарбунары','Рени','Болград','Килия'])assert.ok(data.records.some(r=>r.id.startsWith('web-')&&r.city===city));
 for(const candidate of additions){const r=data.records.find(r=>r.id===candidate.id);assert.ok(r);assert.equal(data.sources[r.source].url,candidate.url);for(const p of r.phones)assert.equal(data.records.filter(other=>other.phones.includes(p)).length,1,p);}
 assert.match(data.records.find(r=>r.id==='web-reni').note,/2025/);
});
