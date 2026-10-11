const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('published Odessa schedules preserve short workings on phone and desktop',async()=>{
 const server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
  res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');
  res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',r=>r.abort());
  for(const [label,width,height] of [['mobile',390,844],['desktop',1280,900]]){
   await page.setViewportSize({width,height});
   const base=`http://127.0.0.1:${server.address().port}/transport/odessa-schedule/`;
   await page.goto(base+'?group=trolleybus&route=7');
   await page.locator('#schedulePanel .operator-stop').first().waitFor();
   const text=await page.locator('#schedulePanel').innerText();
   assert.match(text,/до депо — 22:26/);assert.match(text,/до депо — 21:54/);
   assert.match(text,/Первые отправления/);assert.match(text,/Последние отправления/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync(path.join(root,'output/schedule-audit-20261011'),{recursive:true});
   await page.screenshot({path:path.join(root,`output/schedule-audit-20261011/trolleybus-${label}.png`),fullPage:true});
   await page.goto(base+'?group=bus&route=C4');
   await page.locator('#schedulePanel .departure').first().waitFor();
   assert.match(await page.locator('#schedulePanel').innerText(),/Понедельник–пятница/);
   assert.match(await page.locator('#schedulePanel').innerText(),/08:30К/);
   assert.match(await page.locator('#schedulePanel').innerText(),/К — рейс до Западного кладбища/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.goto(base+'?group=bus&route=C6');
   await page.locator('#schedulePanel .route-name').waitFor();
   assert.match(await page.locator('#schedulePanel').innerText(),/временно приостановлен/);
   assert.equal(await page.locator('#schedulePanel .departure').count(),0);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
