const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const doctors=require('../health-care/data.json').records.filter(r=>r.id.startsWith('dovidka-20261008-'));
const buses=require('../transport/intercity.json').carriers;

test('new contacts are searchable on touch phones and computers, with fresh online data and offline fallback',async()=>{
 const server=http.createServer((req,res)=>{
  let file=path.join(root,new URL(req.url,'http://localhost').pathname);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});let serverOpen=true;
 try{
  for(const options of [{viewport:{width:390,height:844},isMobile:true,hasTouch:true},{viewport:{width:1366,height:768}}]){
   const context=await browser.newContext({...options,serviceWorkers:'block'}),page=await context.newPage();
   await page.route('https://**',r=>r.abort());await page.goto(base+'/main-v2/');
   const input=page.locator('#directorySearch');
   for(const doctor of doctors){
    await input.fill(doctor.name);
    const result=page.locator(`.directory-result[href$="#contact/${doctor.id}"]`);await result.waitFor();
    const shown=(await result.innerText()).replace(/\D/g,'');
    for(const phone of doctor.phones)assert.ok(shown.includes(phone),'New doctor phone is missing from search: '+doctor.name);
   }
   for(const carrier of buses)for(const phone of carrier.phones){
    await input.fill(phone);await page.locator('.directory-result[href*="#buses-"]').first().waitFor();
    assert.ok((await page.locator('#directoryResults').innerText()).includes(carrier.name));
   }
   for(const query of ['автобусы Киев','автобусы Одесса']){
    await input.fill(query);await page.locator('.directory-result[href*="#buses-"]').first().waitFor();
   }
   await input.fill('0971418797');assert.equal(await page.locator('.directory-result').count(),0,'Removed Dmitry contact must not return');
   await input.fill(doctors[0].name);await page.locator('.directory-result').first().click();await page.locator('.contact').waitFor();
   assert.ok(await page.locator('.call').count());
   await context.close();
  }
  const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
  await page.goto(base+'/main-v2/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const catalogs=['health-care/data.json?v=20261008-4','directory-search-extra.json?v=20261008-3'];
  for(const catalog of catalogs){
   const value=await page.evaluate(async catalog=>{
    const url=new URL('../'+catalog,location.href).href;
    const names=(await caches.keys()).filter(n=>n.startsWith('izmail-directory-runtime-'));
    for(const name of names)await (await caches.open(name)).put(url,new Response(JSON.stringify({records:[],stale:true}),{headers:{'Content-Type':'application/json'}}));
    return await (await fetch(url,{cache:'no-cache'})).json();
   },catalog);
   assert.ok(!value.stale&&value.records.length>0,'First online request must return current catalog: '+catalog);
  }
  await new Promise(r=>server.close(r));serverOpen=false;
  for(const catalog of catalogs){
   const value=await page.evaluate(async catalog=>await (await fetch(new URL('../'+catalog,location.href),{cache:'no-cache'})).json(),catalog);
   assert.ok(!value.stale&&value.records.length>0,'Offline request must retain last current catalog: '+catalog);
  }
  await context.close();
 }finally{await browser.close();if(serverOpen)await new Promise(r=>server.close(r));}
});
