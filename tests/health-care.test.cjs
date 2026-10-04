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
  for(const city of ['Винница','Вилково','Шевченково','Львов','Татарбунары'])assert.ok(!data.cityOrder.includes(city));
  const original=require('../health-care/research/telegram.json');
  assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
  const schoolPhone=data.records.filter(r=>r.phones.includes('0938302578'));
  assert.equal(schoolPhone.length,1,'shared school/care number stays in one contact record');
  for(const category of ['96211','96219','96221','96204'])assert.ok((schoolPhone[0].categories||[]).includes(category),'shared number remains in the right category '+category);
  const kindergartenPhone=data.records.find(r=>r.phones.includes('0964353909'));
  assert.ok(kindergartenPhone&&!kindergartenPhone.categories?.includes('96211'),'the separate childcare contact is not attached to the kindergarten/speech-therapy number');
  assert.equal(fs.readFileSync(path.join(root,'health-care/index.html'),'utf8').includes('Дата просмотра источника не означает'),false);
  for(const c of original){
    if(c.id==='96323')continue;
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
    await open('');assert.equal(await page.locator('.branch-card').count(),3);
    assert.deepEqual(await page.locator('.branch-copy h2').allTextContents(),['Врачи и здоровье','Красота и уход','Помощь и уход']);
    for(const width of [320,390,768]){await page.setViewportSize({width,height:844});const layout=await page.locator('.branch-card').evaluateAll(items=>items.map(e=>({height:e.getBoundingClientRect().height,fit:e.scrollWidth<=e.clientWidth})));assert.ok(layout.every(item=>item.height===(width<=350?86:90)&&item.fit),`health buttons match the shared directory grid at ${width}px: ${JSON.stringify(layout)}`)}
    await page.setViewportSize({width:390,height:844});
    await page.locator('.branch-card.doctors').click();await page.locator('.city-tab').first().waitFor();
    assert.equal(await page.locator('.city-tab[aria-current=true]').count(),0);
    assert.equal(await page.locator('.category-tile, .contact').count(),0);
    assert.equal(await page.locator('.city-heading').innerText(),'Выберите город');
    assert.ok(parseFloat(await page.locator('.city-tab span').first().evaluate(e=>getComputedStyle(e).fontSize))>=16,'city labels should be very easy to read');
    assert.equal(await page.locator('.city-tab span').first().evaluate(e=>getComputedStyle(e).whiteSpace),'nowrap','city names stay on one line');
    assert.equal(await page.locator('#search').getAttribute('placeholder'),'Поиск врачей');
    assert.equal(await page.locator('#search').evaluate(e=>getComputedStyle(e).appearance),'none','the search field suppresses the browser-native search glyph');
    await page.locator('#searchToggle').click();
    assert.equal(await page.locator('#search').evaluate(e=>e===document.activeElement),true,'the search control focuses the input without showing a second native search icon');
    assert.equal(await page.locator('#search').evaluate(e=>getComputedStyle(e).outlineStyle),'none','the search field relies on the visible focus glow of its container');
    for(const viewport of [{width:320,height:568},{width:390,height:664},{width:768,height:768}]){
      await page.setViewportSize(viewport);
      const pageHeight=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight,height:innerHeight,content:document.querySelector('#cityNavigation').getBoundingClientRect().height}));
      assert.equal(pageHeight.scroll<=pageHeight.height,true,JSON.stringify(viewport)+' '+JSON.stringify(pageHeight));
      const horizontalOverflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,body:document.body.getBoundingClientRect().toJSON(),page:document.querySelector('.page').getBoundingClientRect().toJSON(),search:document.querySelector('.search-box').getBoundingClientRect().toJSON(),focus:document.activeElement?.id,items:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,className:typeof e.className==='string'?e.className:'',right:Math.round(e.getBoundingClientRect().right),scroll:e.scrollWidth,client:e.clientWidth,text:(e.innerText||'').slice(0,40)})).filter(e=>e.right>innerWidth+1||e.scroll>e.client+1).slice(0,8)}));
      assert.equal(horizontalOverflow.scroll<=horizontalOverflow.width,true,JSON.stringify(viewport)+' '+JSON.stringify(horizontalOverflow));
      const cityFit=await page.locator('.city-tab span').evaluateAll(items=>items.map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth,font:getComputedStyle(e).fontSize})));
      const cityLayout=await page.evaluate(()=>({width:innerWidth,doctors:document.body.dataset.doctors,columns:getComputedStyle(document.querySelector('.city-tabs')).gridTemplateColumns}));
      assert.ok(cityFit.every(item=>item.scroll<=item.width),'city labels fit inside the existing buttons: '+JSON.stringify(cityLayout)+' '+JSON.stringify(cityFit));
    }
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:900});
      const boxes=await page.locator('.city-tab').evaluateAll(es=>es.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}}));
      assert.equal(boxes.length,6);assert.equal(boxes[0].y,boxes[1].y);assert.ok(boxes[2].y>boxes[0].y);assert.ok(boxes.every(b=>Math.abs(b.w-boxes[0].w)<1&&Math.abs(b.h-boxes[0].h)<1));
      for(const img of await page.locator('.city-tab img').all()){await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
    }
    await page.setViewportSize({width:390,height:900});

    assert.equal(await page.evaluate(()=>document.querySelector('#cityNavigation').getBoundingClientRect().top>=document.querySelector('.finder').getBoundingClientRect().bottom),true);
    await page.locator('#search').fill('стомат');assert.equal(await page.locator('.city-tab').count(),6);assert.ok(await page.locator('.contact').count()>0);assert.ok(new Set(await page.locator('.location').allTextContents()).size>1);await page.locator('#clear').click();
    await page.evaluate(()=>window.scrollTo(0,100));
    const initialScroll=await page.evaluate(()=>scrollY);
    assert.equal(initialScroll,0);
    await page.locator('.city-tab').filter({hasText:/^Измаил$/}).click();await page.locator('.category-tile').first().waitFor();
    assert.equal(await page.evaluate(()=>scrollY),initialScroll);
    await page.locator('#cityListToggle').click();assert.equal(await page.locator('#cityListToggle').getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.city-tab').count(),6);await page.locator('#cityListToggle').click();assert.equal(await page.locator('#cityListToggle').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.city-tab').count(),1);
    // Short/empty city lists must not move the city controls or clamp scroll to the top.
    await page.locator('#cityNavigation').scrollIntoViewIfNeeded();
    for(const city of [...data.cityOrder.slice(1),'Измаил']){
      const before=await page.locator('#cityNavigation').boundingBox();
      const scroll=await page.evaluate(()=>scrollY);
      if(!await page.locator('.city-tab').filter({hasText:new RegExp('^'+city+'$')}).isVisible())await page.locator('#cityListToggle').click();
      await page.getByRole('link',{name:city,exact:true}).click();
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),city);
        assert.equal(await page.locator('.city-tab').count(),1,'other cities remain tucked away after choosing '+city);
      assert.equal(await page.locator('#search').getAttribute('placeholder'),'Поиск врачей по '+({'Измаил':'Измаилу','Килия':'Килии','Болград':'Болграду','Рени':'Рени','Одесса':'Одессе','Киев':'Киеву'}[city]));
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
    await open('#city/'+encodeURIComponent('Киев')+'/category/96260');assert.equal(await page.locator('[data-record="r50"]').count(),1);assert.match(await page.locator('[data-record="r50"] h2').innerText(),/Филипчук/);
    await page.locator('#topNav .secondary').click();await page.locator('.category-tile').first().waitFor();assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),'Киев');
    await page.goBack();await page.locator('[data-record="r50"]').waitFor();assert.match(await page.locator('[data-record="r50"] h2').innerText(),/Филипчук/);
    await open('#category/96319');assert.equal(await page.locator('.city-tab[aria-current=true]').innerText(),'Килия');
    await open('#beauty');assert.equal(await page.locator('.category-tile').count(),8);assert.equal(await page.locator('.city-tab').count(),0);
    await open('#city/'+encodeURIComponent('Одесса')+'/category/96306');
    assert.equal(await page.locator('[data-record="r91"]').count(),1);
    await page.locator('[data-record="r91"] [data-favorite]').click();
    await open('#city/'+encodeURIComponent('Одесса')+'/category/96311');
    assert.equal(await page.locator('[data-record="r91"] [data-favorite]').getAttribute('aria-pressed'),'true');
    await open('#favorites');assert.equal(await page.locator('.contact').count(),1);assert.equal(await page.locator('.finder').isVisible(),false,'favorites contact list does not show an unnecessary search');
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
    assert.equal(await page.locator('.contact').evaluateAll(items=>new Set(items.map(item=>Math.round(item.getBoundingClientRect().left))).size),1,'favorite contacts use one full-width column');
    while(await page.locator('[data-favorite]').count())await page.locator('[data-favorite]').first().click();
    assert.equal(await page.locator('.contact').count(),0);
    await open('#category/96046');
    assert.equal(await page.locator('.finder').isVisible(),false,'phone folders do not show an unnecessary search');
    assert.equal(await page.evaluate(()=>{const y=s=>document.querySelector(s).getBoundingClientRect().top;return y('#profileMedia')<y('#topNav')&&y('#topNav')<y('#content')}),true);
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const boxes=await page.locator('.contact').evaluateAll(a=>a.slice(0,2).map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width})));const sameRow=Math.round(boxes[0].y)===Math.round(boxes[1].y);if(sameRow)assert.ok(boxes[1].x>boxes[0].x);else{assert.ok(boxes[1].y>boxes[0].y);assert.equal(Math.round(boxes[0].x),Math.round(boxes[1].x));assert.equal(Math.round(boxes[0].w),Math.round(boxes[1].w));}
      for(const selector of ['#topNav','#bottomNav']){
        const links=page.locator(selector+' a');assert.deepEqual(await links.allTextContents(),['Вернуться в раздел','Вернуться в главное меню']);
        const sectionLabel=await links.first().evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{whiteSpace:getComputedStyle(el).whiteSpace,lines:range.getClientRects().length}});
        assert.deepEqual(sectionLabel,{whiteSpace:'nowrap',lines:1},'section-return label stays on one line on narrow phones');
        const rects=await links.evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height,fits:e.scrollWidth<=e.clientWidth})));
        assert.equal(rects[0].y,rects[1].y);assert.equal(rects[0].h,rects[1].h);assert.ok(rects.every(r=>r.fits));
      }
      const nav=await page.locator('#topNav .back-btn, #bottomNav .back-btn').evaluateAll(a=>a.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert.deepEqual(nav.slice(0,2),nav.slice(2));
    }
    await open('#education');assert.equal(await page.locator('.finder').isVisible(),false,'education directory has no search box');
    await open('#category/96204');assert.equal(await page.locator('.finder').isVisible(),false,'tutor folders have no search box');assert.equal(await page.locator('.category-tile img').count(),0,'education subcategory buttons contain no photos');
    await open('#category/96292');await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),1);await page.locator('.reviews summary').first().click();assert.equal(await page.locator('.reviews[open]').count(),0);
    await open('#city/'+encodeURIComponent('Измаил'));
    assert.equal(await page.locator('.city-tab img').count()>0,true,'city buttons keep their city photos');
    for(const img of await page.locator('.city-tab img').all()){await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));}
    assert.equal(await page.locator('.category-tile img').count(),0,'doctor category buttons contain no photos');
    await open('#beauty');assert.equal(await page.locator('.category-tile img').count(),0,'beauty category buttons contain no photos');
    await open('#education');assert.equal(await page.locator('.category-tile img').count(),0,'education category buttons contain no photos');
    assert.equal(await page.locator('.category-tile.has-children strong').first().textContent(),'Репетиторы','categories leading to another menu use the submenu style');
    assert.equal(await page.locator('.category-tile:not(.has-children) strong').first().textContent(),'Образование и обучение','categories leading to contacts use the direct-contact style');
    const nestedBackground=await page.locator('.category-tile.has-children').first().evaluate(el=>getComputedStyle(el).backgroundImage);
    const directBackground=await page.locator('.category-tile:not(.has-children)').first().evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.notEqual(nestedBackground,directBackground,'education category colors distinguish a submenu from a direct contact list');
    const educationTiles=await page.locator('.category-tile').evaluateAll(items=>items.map(item=>({height:item.getBoundingClientRect().height,font:parseFloat(getComputedStyle(item.querySelector('strong')).fontSize)})));
    assert.ok(educationTiles.every(tile=>tile.height===educationTiles[0].height&&tile.font>=14),'education buttons share a large uniform size');
    for(const hash of ['#city/'+encodeURIComponent('Измаил'),'#beauty','#education']){
      await open(hash);
      assert.equal(await page.locator('video').count(),0);
      await page.setViewportSize({width:320,height:900});const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,items:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,class:e.className?.baseVal||e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+1).slice(0,8)}));assert.equal(overflow.scroll<=overflow.width,true,hash+' '+JSON.stringify(overflow));
      assert.match(await page.locator('#topNav a:not(.secondary)').innerText(),/главное меню/);
    }
    await open('#category/96211');
    assert.equal(await page.locator('.contact').count(),3,'the separate education contact is not duplicated as an unrelated 96211 profile');
    const carePhones=await page.locator('.phone-number').evaluateAll(es=>es.map(e=>e.getAttribute('href')).sort());
    assert.deepEqual(carePhones,['+380982328913','+380689346716','+380938302578','+380978430369'].map(p=>'tel:'+p).sort());
    assert.equal(await page.locator('[data-record="r68"]').count(),0,'kindergarten/speech-therapy number is not misfiled as childcare');
    const sharedSchoolCare=data.records.find(r=>r.phones.includes('0938302578'));
    assert.ok(sharedSchoolCare.categories.includes('96211')&&sharedSchoolCare.categories.includes('96219'),'the same public number remains searchable in both source categories without a duplicate record');
    assert.equal(await page.locator('#topNav .secondary').getAttribute('href'),'#');
    assert.deepEqual(videos,[]);assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(r=>server.close(r));}
});

test('all directory covers are static and removed videos cannot ship',()=>{
  assert.equal(fs.readdirSync(path.join(root,'health-care/media')).filter(p=>p.endsWith('.mp4')).length,0);
  for(const c of data.categories)for(const m of c.media){assert.equal(m.type,'image');assert.match(m.src,/cover-.+\.jpg$/)}
});

test('new published phones only repeat for documented shared receptions and every category has local media',()=>{const previous=JSON.parse(require('node:child_process').execFileSync('git',['show','664c670:health-care/data.json'],{encoding:'utf8'}));const old=new Set(previous.records.flatMap(r=>r.phones));const fresh=data.records.flatMap(r=>r.phones).filter(p=>!old.has(p));const repeated=[...new Set(fresh.filter((p,i)=>fresh.indexOf(p)!==i))].sort();assert.deepEqual(repeated,['0482309002','0949173422','0963881899']);for(const c of data.categories){assert.ok(c.media.length);for(const m of c.media)assert.ok(fs.existsSync(path.join(root,'health-care',m.src)))}for(const r of data.records){for(const id of r.additionalSources||[])assert.ok(data.sources[id]);if(r.review)assert.match(r.review.url,/^https:\/\//)}});


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
  for(const p of phones){const count=data.records.filter(r=>r.phones.includes(p)).length;assert.equal(count,p==='0963881899'?2:1,p);}
  const gonta=data.records.find(r=>r.phones.includes('0677472375'));
  assert.equal(gonta.name,'Гонта Ирина Анатольевна');assert.equal(gonta.favoriteName,'Гонта Ирина');assert.deepEqual(gonta.categories,['96306','96311']);
  const common=data.records.find(r=>r.phones.includes('0482630480'));
  assert.deepEqual(common.categories,['96297','96260']);assert.match(common.note,/Аствацатрян/);assert.match(common.note,/Мищенко/);

  const currentPhones=new Set(data.records.flatMap(r=>r.phones));
  for(const r of previous.records.filter(r=>r.city!=='Татарбунары'))for(const p of r.phones)assert.ok(currentPhones.has(p),'Lost published phone '+p);
  for(const r of data.records.filter(r=>r.workbookContacts)){
    for(const id of r.categories)assert.ok(data.categories.some(c=>c.id===id));
    for(const id of r.additionalSources||[])assert.ok(data.sources[id]);
  }
});

test('reviewed city additions retain provenance and introduce no duplicate phones',()=>{
 const additions=require('../health-care/research/city-additions-20260930.json');
 for(const city of ['Киев','Одесса','Рени','Болград','Килия'])assert.ok(data.records.some(r=>r.id.startsWith('web-')&&r.city===city));
 for(const candidate of additions){const r=data.records.find(r=>r.id===candidate.id);assert.ok(r);assert.equal(data.sources[r.source].url,candidate.url);for(const p of r.phones)assert.equal(data.records.filter(other=>other.phones.includes(p)).length,1,p);}
 assert.match(data.sources[data.records.find(r=>r.id==='web-reni').source].label,/2025/);
});
