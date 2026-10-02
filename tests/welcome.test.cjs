const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const http=require('node:http');const {chromium}=require('playwright');
test('welcome is personal, main-menu only, fades after six seconds and appears once per session',async()=>{
 const root=path.resolve(__dirname,'..');const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('https://**',r=>r.abort());
  const page=await context.newPage();await page.clock.install({time:0});await page.clock.pauseAt(1000);
  const hash='#tgWebAppData='+encodeURIComponent(new URLSearchParams({user:JSON.stringify({first_name:'Оля'})}).toString());
  await page.goto(base+'/main-v2/'+hash);await page.locator('.welcome-greeting').waitFor();
  assert.equal(await page.locator('.welcome-greeting').innerText(),'Добро пожаловать, Оля!');
  assert.equal(await page.locator('.welcome-greeting').count(),1);
  const boxes=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};};return {welcome:r('.welcome-greeting'),views:r('.viewer'),app:r('#app'),shelter:r('#shelterBtn')};});
  assert.ok(boxes.welcome.left>=boxes.views.right,'beside views');assert.ok(boxes.welcome.right<=boxes.app.right,'inside app');assert.ok(Math.abs(boxes.welcome.right-boxes.shelter.right)<2,'extends to shelter right edge');assert.ok(boxes.welcome.bottom<boxes.shelter.top-15,'above shelter and presence badge');
  if(process.env.WELCOME_PREVIEW)await page.screenshot({path:process.env.WELCOME_PREVIEW});
  await page.clock.runFor(5900);assert.equal(await page.locator('.welcome-greeting').evaluate(e=>e.style.opacity),'1');
  await page.clock.runFor(100);assert.equal(await page.locator('.welcome-greeting').evaluate(e=>e.style.opacity),'0');
  await page.clock.runFor(600);assert.equal(await page.locator('.welcome-greeting').count(),0);
  await page.goto(base+'/health-care/');assert.equal(await page.locator('.welcome-greeting').count(),0);
  await page.goto(base+'/main-v2/');assert.equal(await page.locator('.welcome-greeting').count(),0);
  const second=await browser.newContext({viewport:{width:320,height:700}});await second.route('https://**',r=>r.abort());const another=await second.newPage();
  const otherHash='#tgWebAppData='+encodeURIComponent(new URLSearchParams({user:JSON.stringify({first_name:'Андрей'})}).toString());
  await another.goto(base+'/main-v2/'+otherHash);assert.equal(await another.locator('.welcome-greeting').innerText(),'Добро пожаловать, Андрей!');
  const generic=await browser.newContext();await generic.route('https://**',r=>r.abort());const normal=await generic.newPage();await normal.goto(base+'/main-v2/');assert.equal(await normal.locator('.welcome-greeting').innerText(),'Добро пожаловать!');
  await context.close();await second.close();await generic.close();
 }finally{await browser.close();await new Promise(r=>server.close(r));}
});
