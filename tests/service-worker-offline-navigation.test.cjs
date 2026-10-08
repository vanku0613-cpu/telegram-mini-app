const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

function createServer(root){
  return http.createServer((req,res)=>{
    let pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname.endsWith('/'))pathname+='index.html';
    const file=path.join(root,pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const ext=path.extname(file);
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':ext==='.webp'?'image/webp':'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
}

test('desktop folder navigation keeps the correct document when the network drops',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=createServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  let serverOpen=true;
  try{
    const context=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'allow'});
    const page=await context.newPage();
    await page.goto(origin+'/main-v2/',{waitUntil:'load'});
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));

    await new Promise(resolve=>server.close(resolve));
    serverOpen=false;

    await page.goto(origin+'/services-masters/?offline-check=1',{waitUntil:'domcontentloaded'});
    assert.match(await page.title(),/Услуги и мастера/);
    assert.equal(await page.locator('#app').count(),0,'home document was injected under a folder URL');
    assert.match(await page.locator('body').innerText(),/Услуги|Мастера/);
    await context.close();
  }finally{
    await browser.close();
    if(serverOpen)await new Promise(resolve=>server.close(resolve));
  }
});
