const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const folders=[
  '/','/main-v2/','/health-care/','/transport/','/transport/bus-schedule/',
  '/transport/city-schedule/?city=izmail','/transport/odessa-schedule/',
  '/services-masters/','/products-food/','/communal-services/','/recreation/',
  '/our-groups-menu/','/zags/','/ukrytia/','/bessarabia-online/','/soglashenie/'
];

test('every active folder opens as a usable desktop page',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    let name=new URL(req.url,'http://localhost').pathname;
    if(name.endsWith('/'))name+='index.html';
    const file=path.join(root,name);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const ext=path.extname(file);
    res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':ext==='.webp'?'image/webp':'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'});
    await context.addInitScript(()=>{window.EventSource=undefined});
    await context.route('https://**',route=>route.abort());
    const page=await context.newPage();
    for(const folder of folders){
      const errors=[];
      const onError=error=>errors.push(error.message);
      page.on('pageerror',onError);
      const response=await page.goto(origin+folder,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200,`${folder} must return HTTP 200`);
      assert.match(response.headers()['content-type']||'',/text\/html/,`${folder} must open as HTML`);
      await page.waitForTimeout(120);
      const state=await page.evaluate(()=>({
        title:document.title.trim(),
        text:document.body.innerText.trim(),
        width:document.documentElement.scrollWidth,
        viewport:innerWidth
      }));
      assert.ok(state.title.length>1,`${folder} needs a page title`);
      assert.ok(state.text.length>20,`${folder} needs visible information`);
      assert.doesNotMatch(state.text,/^\s*<!doctype|^\s*<html/i,`${folder} must not expose source as page content`);
      assert.ok(state.width<=state.viewport+1,`${folder} must not overflow the computer screen horizontally`);
      assert.deepEqual(errors,[],`${folder} must not throw browser errors`);
      page.off('pageerror',onError);
    }
    await context.close();
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
