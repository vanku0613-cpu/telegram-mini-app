const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../main-v2/index.html'),'utf8'),startup=fs.readFileSync(require.resolve('../main-v2/startup.js'),'utf8');
test('Only the tiny viewport lock blocks parsing; functional dependencies precede ready()',()=>{
 const scripts=[...html.matchAll(/<script\b([^>]*)src="([^"]+)"([^>]*)><\/script>/g)].map(m=>({url:m[2],defer:/\bdefer\b/.test(m[1]+m[3])}));
 assert.deepEqual(scripts.filter(s=>!s.defer).map(s=>s.url),['./stage-lock.js?v=1']);
 for(const name of ['settings.js','navigation.js','weather-source.js','main.js'])assert.ok(scripts.findIndex(s=>s.url.includes(name))<scripts.findIndex(s=>s.url.includes('/startup.js')));
 assert.ok(scripts.findIndex(s=>s.url.includes('directory-search.js'))>scripts.findIndex(s=>s.url.includes('/startup.js')));
 assert.doesNotMatch(html,/<img[^>]*id="bg(?:Main|Blur)"[^>]*\bsrc=/);
 assert.match(html,/script-src 'self';/);
});
function fixture(platform){
 const events=[],attrs=new Map(),frames=[],handlers={},memory=new Map(),window={};window.parent=window;
 const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const document={getElementById:id=>id==='app'?{}:null,documentElement:{setAttribute:(k,v)=>attrs.set(k,v)},head:{appendChild(){}},createElement:()=>({style:{}})};
 const location={hash:'#tgWebAppVersion=8.0&tgWebAppPlatform='+platform},context={window,document,location,sessionStorage:storage,JSON,URLSearchParams,decodeURIComponent,encodeURIComponent,console:{log(){}},performance:{now:()=>25},Event:class{constructor(type){this.type=type;}},requestAnimationFrame:f=>frames.push(f),setTimeout:()=>0};
 window.addEventListener=(n,f)=>handlers[n]=f;window.dispatchEvent=e=>events.push(e.type);window.sessionStorage=storage;
 if(['android','ios'].includes(platform)){window.TelegramWebviewProxy={postEvent:(type,data)=>events.push(type)};context.TelegramWebviewProxy=window.TelegramWebviewProxy;}
 if(platform==='desktop')window.external={notify:data=>events.push(JSON.parse(data).eventType)};
 if(platform==='web'){window.parent={postMessage:data=>events.push(JSON.parse(data).eventType)};}
 return {context,events,frames,attrs};
}
for(const platform of ['android','ios','desktop','web'])test('Ready is sent through the official '+platform+' bridge before window.load or data requests',()=>{
 const f=fixture(platform);vm.runInNewContext(startup,f.context);assert.equal(f.frames.length,0,'hidden WebViews must not wait for requestAnimationFrame');assert.ok(f.events.includes('web_app_ready'));assert.equal(JSON.parse(f.attrs.get('data-home-ready')).ready,25);
 vm.runInNewContext(startup,f.context);assert.equal(f.frames.length,0,'readiness is not repeated');
});
test('Existing full Telegram SDK is used when it is already available',()=>{
 const f=fixture('android');f.context.window.Telegram={WebApp:{ready:()=>f.events.push('sdk-ready')}};vm.runInNewContext(startup,f.context);assert.ok(f.events.includes('sdk-ready'));assert.equal(f.events.includes('web_app_ready'),false);
});
test('Cached home opens while a stalled network refresh is still pending, then receives the new shell',async()=>{
 const handlers={},staticMap=new Map(),runtimeMap=new Map();let release,calls=0;
 const runtime={match:async r=>runtimeMap.get(r.url)?.clone(),put:async(r,v)=>runtimeMap.set(r.url,v)};
 const ctx={URL,Request,Response,AbortController,setTimeout,clearTimeout,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/app/'},addEventListener:(n,f)=>handlers[n]=f},caches:{match:async r=>staticMap.get(r.url)?.clone(),open:async()=>runtime},fetch:()=>{calls++;return new Promise(r=>release=r);}};
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
