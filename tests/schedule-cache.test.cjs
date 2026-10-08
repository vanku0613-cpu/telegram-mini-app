const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('schedule fetch replaces old cache immediately and falls back only offline', async()=>{
  const handlers={}, stored=new Map();let offline=false, calls=0;
  const context={URL,Request,Response,AbortController,setTimeout,clearTimeout,
    self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn},
    fetch:async()=>{calls++;if(offline)throw Error('offline');return new Response('{"date":"new"}');},
    caches:{match:async r=>stored.get(r.url)?.clone(),open:async()=>({put:async(r,response)=>stored.set(r.url,response)})}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../sw.js'),'utf8'),context);
  for(const file of ['city-schedule/data/regional-routes.json','city-schedule/data/kyiv.json','bus-schedule/schedule-data.json','odessa-schedule/schedule-data.json','schedule-search.json']){
    const request=new Request('https://example.test/transport/'+file+'?v=1');
    stored.set(request.url,new Response('{"date":"old"}'));
    let promise;
    handlers.fetch({request,respondWith:p=>promise=p,waitUntil:()=>{}});
    assert.deepEqual(await (await promise).json(),{date:'new'});
    offline=true;
    handlers.fetch({request,respondWith:p=>promise=p,waitUntil:()=>{}});
    assert.deepEqual(await (await promise).json(),{date:'new'});
    offline=false;
  }
  assert.equal(calls,10);
});
