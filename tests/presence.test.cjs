const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const crypto=require('node:crypto');
test('public badge stays small above shelter, layout fits',async()=>{
  const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
  const root=path.resolve(__dirname,'..');
  const site=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
  await new Promise(r=>site.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://**',r=>r.abort());
    await page.route('**/presence-config.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.IZMAIL_PRESENCE_URL='';"}));
    await page.goto('http://127.0.0.1:'+site.address().port+'/main-v2/');
    await page.evaluate(()=>{
      window.IZMAIL_PRESENCE_URL=location.origin+'/presence-test';
      const realFetch=window.fetch;
      window.fetch=(url,options)=>String(url).includes('/presence-test')?Promise.resolve(new Response(JSON.stringify({online:12}),{status:200})):realFetch(url,options);
      window.EventSource=class{addEventListener(){}close(){}};
    });
    await page.addScriptTag({url:'/presence.js'});

    await page.locator('.presence-badge').waitFor();
    assert.equal(await page.locator('.presence-badge').innerText(),'● 12');
    for(const width of [320,390,430,1024]){
      await page.setViewportSize({width,height:844});
      await page.waitForFunction(()=>{const gap=document.querySelector('.weather-panel').getBoundingClientRect().top-document.querySelector('.viewer').getBoundingClientRect().bottom;return gap>=1&&gap<=5;});
      const rects=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};return {badge:r('.presence-badge'),viewer:r('.viewer'),weather:r('.weather-panel'),shelter:r('#shelterBtn')};});
      assert.ok(rects.badge.height<=18&&rects.badge.width<45,'compact badge');
      assert.ok(rects.badge.bottom<=rects.shelter.top,'above shelter');assert.ok(Math.abs(rects.badge.right-rects.shelter.right)<=6,'aligned with shelter right edge');
      assert.ok(rects.weather.top-rects.viewer.bottom>=1 && rects.weather.top-rects.viewer.bottom<=5,'small gap above weather at '+width+': '+JSON.stringify(rects));
      assert.ok(rects.badge.bottom<=rects.weather.top,'does not overlap weather at '+width+': '+JSON.stringify(rects));
    }
    await page.setViewportSize({width:390,height:844});
    // Geometry is checked at four widths; no generated preview is saved in the repository.
  }finally{await browser.close();await new Promise(r=>site.close(r));}
});

test('hosted presence counts 0 → 1 → 2 → 0 and handles hidden tabs',async()=>{
  const {DatabaseSync}=require('node:sqlite');const {pathToFileURL}=require('node:url');const path=require('node:path');
  const worker=(await import(pathToFileURL(path.resolve(__dirname,'../services/presence/worker.mjs')).href)).default;
  const sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE presence (session TEXT PRIMARY KEY, visitor TEXT NOT NULL, expires INTEGER NOT NULL)');
  const DB={prepare(sql){return {bind(...values){return {async first(){return sqlite.prepare(sql).get(...values);},async run(){return sqlite.prepare(sql).run(...values);}};} };},async batch(statements){for(const s of statements)await s.run();}};
  const realNow=Date.now;let clock=1000;Date.now=()=>clock;
  const make=(route,body)=>worker.fetch(new Request('https://service.test'+route,{headers:{Origin:'https://vanku0613-cpu.github.io'},...(body?{method:'POST',body:JSON.stringify(body)}:{})}),{DB});
  const count=async()=> (await (await make('/online')).json()).online;
  try{
    const a={visitor:crypto.randomUUID(),session:crypto.randomUUID()},b={visitor:crypto.randomUUID(),session:crypto.randomUUID()};
    assert.equal(await count(),0);await make('/heartbeat',a);assert.equal(await count(),1);
    await make('/heartbeat',b);assert.equal(await count(),2);
    const tab={...a,session:crypto.randomUUID()};await make('/heartbeat',tab);assert.equal(await count(),2);
    await make('/leave',a);await make('/leave',tab);clock+=3001;assert.equal(await count(),1);
    await make('/leave',b);clock+=3001;assert.equal(await count(),0);
    await make('/heartbeat',b);assert.equal(await count(),1);clock+=25001;assert.equal(await count(),0);
    assert.equal((await make('/heartbeat',{visitor:'invalid',session:'bad'})).status,400);
  }finally{Date.now=realNow;sqlite.close();}
});
