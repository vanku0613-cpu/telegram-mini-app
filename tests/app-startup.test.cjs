const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../main-v2/index.html'),'utf8');
test('Home uses the original dependency order and starts loading visible artwork from HTML',()=>{
 const scripts=[...html.matchAll(/<script\b([^>]*)src="([^"]+)"([^>]*)><\/script>/g)].map(m=>({url:m[2],defer:/\bdefer\b/.test(m[1]+m[3])}));
 assert.deepEqual(scripts.filter(s=>!s.defer).map(s=>s.url),['./stage-lock.js?v=1','./settings.js?v=20261008-5','../weather-profile.js?v=2','../weather-source.js?v=2','./main.js?v=18','../welcome.js?v=2','../directory-search.js?v=32']);
 assert.ok(html.indexOf('id="app"')<html.indexOf('src="./main.js'));
 assert.match(html,/<img[^>]*id="bgMain"[^>]*src="\.\.\/assets\/izmail-home-summer-day\.webp"[^>]*fetchpriority="high"/);
 assert.match(html,/<img[^>]*id="bgBlur"[^>]*src="\.\.\/assets\/izmail-home-summer-day\.webp"/);
 assert.doesNotMatch(html,/startup\.js/);
 assert.match(html,/script-src 'self';/);
});
test('Cached home opens while a stalled network refresh is still pending, then receives the new shell',async()=>{
 const handlers={},staticMap=new Map(),runtimeMap=new Map();let release,calls=0;
 const runtime={match:async r=>runtimeMap.get(r.url)?.clone(),put:async(r,v)=>runtimeMap.set(r.url,v)};
 const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/app/'},addEventListener:(n,f)=>handlers[n]=f},caches:{match:async()=>{throw Error('Unscoped cache search must not read obsolete app versions');},open:async name=>name.includes('runtime')?runtime:{match:async r=>staticMap.get(r.url)?.clone(),put:async(r,v)=>staticMap.set(r.url,v)}},fetch:()=>{calls++;return new Promise(r=>release=r);}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),ctx);
 const request={method:'GET',url:'https://example.test/app/main-v2/?launch=1',mode:'navigate'};staticMap.set('https://example.test/app/main-v2/',new Response('installed home'));let result,background;
 handlers.fetch({request,respondWith:p=>result=p,waitUntil:p=>background=p});
 const first=await result;assert.equal(await first.text(),'installed home');assert.equal(calls,1);release(new Response('fresh home'));await background;
 handlers.fetch({request,respondWith:p=>result=p,waitUntil:p=>background=p});assert.equal(await (await result).text(),'fresh home','runtime update wins over install-time HTML');release(new Response('next home'));await background;
});
test('An uncached interior page is still fetched under its own URL',async()=>{
 const handlers={},calls=[];
 const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/app/'},addEventListener:(n,f)=>handlers[n]=f},caches:{match:async()=>null,open:async()=>({put:async()=>{}})},fetch:async r=>{calls.push(r.url);return new Response('own section');}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),ctx);let result;handlers.fetch({request:{url:'https://example.test/app/health-care/',method:'GET',mode:'navigate'},respondWith:p=>result=p});assert.equal(await (await result).text(),'own section');assert.deepEqual(calls,['https://example.test/app/health-care/']);
});
test('Frank rates still wait for fresh data instead of showing a stale service-worker response',async()=>{
 const handlers={};let release;const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,self:{location:{origin:'https://example.test'},addEventListener:(n,f)=>handlers[n]=f},caches:{match:async()=>new Response('old rates'),open:async()=>({put:async()=>{}})},fetch:()=>new Promise(r=>release=r)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),ctx);let result,resolved=false;handlers.fetch({request:new Request('https://example.test/app/data/frank-rates.json'),respondWith:p=>{result=p;p.then(()=>resolved=true);},waitUntil(){}});await Promise.resolve();assert.equal(resolved,false);release(new Response('fresh rates'));assert.equal(await (await result).text(),'fresh rates');
});
