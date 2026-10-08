const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=require('../health-care/data.json');
const manifest=require('../health-care/research/dovidka-import-20261008.json');
const buses=require('../transport/intercity.json');

test('doctor import preserves existing contacts and separates reception numbers from personal contacts',()=>{
 const old=JSON.parse(execFileSync('git',['show','21abb5c:health-care/data.json'],{cwd:root,encoding:'utf8'}));
 for(const r of old.records)assert.deepEqual(data.records.find(x=>x.id===r.id),r,'Existing contact changed: '+r.id);
 assert.equal(manifest.added.length,23);
 for(const entry of manifest.added){
  const r=data.records.find(x=>x.id===entry.id);
  assert.ok(r);assert.equal(data.sources[r.source].url,entry.url);
  assert.equal(r.city,'Измаил');assert.ok(r.phones.length);
  assert.doesNotMatch(r.name+' '+r.specialties,/массаж|масаж|реабил|реабіл|нутрици|нутріці/i);
  assert.ok(!r.phones.includes('0965934789'),'Hospital administration must not be labelled as doctor appointments');
  if(entry.contactType==='institution-reception'){
   assert.match(r.phoneLabel,/Регистратура|общий контакт/);
   assert.ok(r.additionalSources.length);
   if(entry.contactSourceRecord!=='berehynya')assert.deepEqual(r.phones,data.records.find(x=>x.id===entry.contactSourceRecord).phones);
  }
 }
 assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
});

test('intercity contacts are deduplicated, locally scoped and have source evidence',()=>{
 assert.equal(buses.carriers.length,4);
 assert.equal(new Set(buses.carriers.flatMap(c=>c.phones)).size,11);
 assert.equal(buses.carriers.filter(c=>c.id==='diamant').length,1);
 assert.ok(!buses.carriers.flatMap(c=>c.phones).includes('0681211123'));
 for(const c of buses.carriers){
  assert.ok(c.sources.length);assert.equal(new Set(c.phones).size,c.phones.length);
  for(const p of c.phones)assert.match(p,/^0\d{9}$/);
  for(const d of c.directions)assert.ok(buses.directions.some(x=>x.id===d));
 }
});

test('new doctors and bus directions open from global search and fit phone screens',async()=>{
 const server=http.createServer((req,res)=>{
  let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',r=>r.abort());
  for(const home of ['/','/main-v2/']){
   await page.goto(base+home);await page.locator('#directorySearch').fill('Іон Віра');
   const doctor=page.locator('.directory-result').filter({hasText:'Іон Віра'});await doctor.waitFor();
   await doctor.click();await page.locator('.contact').waitFor();
   assert.match(await page.locator('.contact h2').innerText(),/Іон Віра/);
   assert.equal(await page.locator('.call').getAttribute('href'),'tel:+380682744885');
   await page.goto(base+home);await page.locator('#directorySearch').fill('AUTOLINE Киев');
   const bus=page.locator('.directory-result').filter({hasText:'AUTOLINE'});await bus.waitFor();
   assert.equal(new URL(await bus.getAttribute('href')).pathname,'/transport/');
   await bus.click();await page.locator('#buses-kyiv').waitFor({state:'visible'});
   assert.equal(await page.locator('#buses-kyiv [data-carrier]').count(),1);
  }
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/transport/');
   await page.locator('[data-group="intercity"]').click();
   await page.locator('[data-content="buses-odesa"]').click();
   assert.equal(await page.locator('#buses-odesa [data-carrier]').count(),4);
   const phones=await page.locator('#buses-odesa .phone').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   assert.equal(phones.length,new Set(phones).size,'No duplicated phone in one direction');
   for(const p of phones)assert.match(p,/^tel:\+380\d{9}$/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width);
   const fit=await page.locator('#buses-odesa .phone strong').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth));assert.ok(fit);
   await page.locator('#sectionBack').click();assert.equal(await page.locator('[data-submenu="intercity"]').isVisible(),true);
   await page.locator('#sectionBack').click();assert.equal(await page.locator('#groupTabs').isVisible(),true);
  }
  await page.goto(base+'/transport/#buses-odesa');assert.equal(await page.locator('#buses-odesa').isVisible(),true);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
