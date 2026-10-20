const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');

test('a saved section opens before a stalled network and refreshes its own document',async()=>{
 const handlers={},stored=new Map();let release;
 const cache={match:async r=>stored.get(r.url)?.clone(),put:async(r,v)=>stored.set(r.url,v)};
 const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,
  self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/app/'},addEventListener:(n,f)=>handlers[n]=f},
  caches:{open:async()=>cache},fetch:()=>new Promise(r=>release=r)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),ctx);
 const request={url:'https://example.test/app/services-masters/?v=links',method:'GET',mode:'navigate'};
 stored.set('https://example.test/app/services-masters/',new Response('saved services'));
 let response,background;
 handlers.fetch({request,respondWith:p=>response=p,waitUntil:p=>background=p});
 assert.equal(await Promise.race([response.then(r=>r.text()),new Promise(r=>setTimeout(()=>r('blocked by network'),100))]),'saved services');
 release(new Response('updated services'));await background;
 assert.equal(await stored.get('https://example.test/app/services-masters/').clone().text(),'updated services');
});

test('saved versioned code and styles do not start redundant network requests',async()=>{
 const handlers={};let requests=0;
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),{URL,Request,Response,AbortController,setTimeout,clearTimeout,
  self:{location:{origin:'https://example.test'},addEventListener:(n,f)=>handlers[n]=f},
  caches:{open:async()=>({match:async()=>new Response('current release')})},fetch:async()=>{requests++;return new Response('network')}});
 for(const file of ['navigation.js?v=8','main-v2/main.css?v=43']){
  let result;handlers.fetch({request:new Request('https://example.test/app/'+file),respondWith:p=>result=p});
  assert.equal(await (await result).text(),'current release');
 }
 assert.equal(requests,0);
});

test('decorations stop when idle or motion is reduced, and taps request a page immediately',async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'text/html');res.end(fs.readFileSync(file))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});
  await context.route('https://**',r=>r.abort());
  await context.addInitScript(()=>{
   const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:['2026-07-20T10:00:00Z']))}};
   const nativeFetch=window.fetch;
   window.fetch=(input,init)=>String(input.url||input).includes('open-meteo.com')
    ? Promise.resolve(new Response(JSON.stringify({current:{time:Date.now()/1000,weather_code:0,temperature_2m:20,wind_speed_10m:2}}),{headers:{'Content-Type':'application/json'}})) : nativeFetch(input,init);
   window.__clears=0;window.__sceneReads=0;
   const clear=CanvasRenderingContext2D.prototype.clearRect;
   CanvasRenderingContext2D.prototype.clearRect=function(...a){window.__clears++;return clear.apply(this,a)};
   const rect=Element.prototype.getBoundingClientRect;
   Element.prototype.getBoundingClientRect=function(){if(this.id==='sceneLayer')window.__sceneReads++;return rect.call(this)};
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const origin=`http://127.0.0.1:${server.address().port}`;
  await page.goto(origin+'/main-v2/');await page.waitForFunction(()=>document.getElementById('weatherTemp').textContent==='20°C');await page.waitForTimeout(200);
  await page.evaluate(()=>{window.__clears=window.__sceneReads=0});await page.waitForTimeout(250);
  assert.deepEqual(await page.evaluate(()=>[window.__clears,window.__sceneReads]),[0,0],'calm summer weather must not keep an empty drawing loop alive');
  await page.evaluate(()=>{
   window.izmailWeatherSource.load=()=>Promise.resolve({provider:'test fixture',current:{time:Date.now()/1000,weather_code:65,temperature_2m:20,wind_speed_10m:2}});
   dispatchEvent(new CustomEvent('izmail:refresh'));
  });
  await page.waitForFunction(()=>document.getElementById('sceneLayer').classList.contains('rain'));
  await page.evaluate(()=>{window.__clears=window.__sceneReads=0});await page.waitForTimeout(800);
  const counts=await page.evaluate(()=>[window.__clears,window.__sceneReads]);
  assert.ok(counts[0]>0&&counts[0]<=26,'rain renders at most 30 frames/second');
  assert.equal(counts[1],0,'animation frames never query layout geometry');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.getElementById('sceneLayer').classList.contains('effects-paused'),null,{timeout:3000});
  await page.evaluate(()=>window.__clears=0);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__clears),0,'reduced motion must stop drawing rather than clearing every frame');
  await page.evaluate(()=>document.querySelector('.cards .card').dataset.nav=location.origin+'/services-masters/');
  let targetRequest;await page.route(origin+'/services-masters/',route=>{targetRequest=Date.now();return route.abort()});
  const started=Date.now();await page.locator('.cards .card').first().evaluate(el=>el.click());
  await page.waitForTimeout(100);
  assert.ok(targetRequest&&targetRequest-started<150,'tap must start navigation without the old 260ms glow delay');
  assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r))}
});
