const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../main-v2/index.html'),'utf8');
test('Home uses the original dependency order and starts loading visible artwork from HTML',()=>{
 const scripts=[...html.matchAll(/<script\b([^>]*)src="([^"]+)"([^>]*)><\/script>/g)].map(m=>({url:m[2],defer:/\bdefer\b/.test(m[1]+m[3])}));
 assert.deepEqual(scripts.filter(s=>!s.defer).map(s=>s.url),['./stage-lock.js?v=1','./settings.js?v=20261008-5','../weather-profile.js?v=2','../weather-source.js?v=2','./main.js?v=19','../welcome.js?v=2','../directory-search.js?v=32']);
 assert.ok(html.indexOf('id="app"')<html.indexOf('src="./main.js'));
 assert.match(html,/<img[^>]*id="bgMain"[^>]*src="\.\.\/assets\/izmail-home-summer-day\.webp"[^>]*fetchpriority="high"/);
 assert.match(html,/<img[^>]*id="bgBlur"[^>]*src="\.\.\/assets\/izmail-home-summer-day\.webp"/);
 assert.doesNotMatch(html,/startup\.js/);
 assert.match(html,/script-src 'self';/);
});
const main=fs.readFileSync(require.resolve('../main-v2/main.js'),'utf8');
const signalStart=main.indexOf('(function signalTelegramHomeReady(){');
assert.ok(signalStart>main.indexOf('guaranteeButtonNavigation(card,target)'),'menu handlers must be wired before display');
const signal=main.slice(signalStart,main.indexOf('/* Keep every main-card title',signalStart));
function runSignal(window){
 const events=[],attributes=new Map();
 const document={readyState:'loading',getElementById:()=>({}),documentElement:{setAttribute:(key,value)=>attributes.set(key,value)},addEventListener:()=>assert.fail('display must not wait for a document event')};
 window.parent=window.parent||window;
 vm.runInNewContext(signal,{window,document,JSON,requestAnimationFrame:()=>assert.fail('hidden native views may pause animation frames'),setTimeout:()=>assert.fail('display must not use a delay')});
 return attributes;
}
for(const platform of ['Android','iOS'])test(platform+' injected native proxy gets the ready event before page load',()=>{
 const events=[];const attributes=runSignal({TelegramWebviewProxy:{postEvent:(type,payload)=>events.push([type,JSON.parse(payload)])}});
 assert.deepEqual(events,[['web_app_ready','']]);assert.equal(attributes.get('data-native-ready'),'requested');
});
test('Desktop and Telegram Web use their native display transports',()=>{
 const events=[];
 runSignal({external:{notify:payload=>events.push(JSON.parse(payload))}});
 assert.deepEqual(events,[{eventType:'web_app_ready',eventData:''}]);
 const frames=[];
 runSignal({parent:{postMessage:(payload,origin)=>frames.push([JSON.parse(payload),origin])}});
 assert.deepEqual(frames,[[{eventType:'web_app_ready',eventData:''},'https://web.telegram.org']]);
});
test('An existing Telegram SDK takes priority without replacing it',()=>{
 const calls=[];const sdk={WebApp:{ready:()=>calls.push('sdk')}};
 const window={Telegram:sdk,TelegramWebviewProxy:{postEvent:()=>assert.fail('SDK transport already handled this')}};
 runSignal(window);assert.deepEqual(calls,['sdk']);assert.equal(window.Telegram,sdk);
 const bridge=[];runSignal({Telegram:{WebView:{postEvent:type=>bridge.push(type)}}});assert.deepEqual(bridge,['web_app_ready']);
});
test('Ordinary browsers and unavailable native bridges do not break the menu',()=>{
 assert.equal(runSignal({}).size,0);
 assert.equal(runSignal({TelegramWebviewProxy:{postEvent:()=>{throw Error('unavailable');}}}).size,0);
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
