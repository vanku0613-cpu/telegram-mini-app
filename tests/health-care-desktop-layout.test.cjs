const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('health directory expands into a desktop workspace without changing the phone grid',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try{
    const origin=`http://127.0.0.1:${server.address().port}/health-care/#pharmacies`;
    const desktop=await browser.newPage({viewport:{width:1366,height:768}});
    await desktop.route('https://**',route=>route.abort());
    await desktop.goto(origin);await desktop.locator('.pharmacy-contact').first().waitFor();
    const wide=await desktop.evaluate(()=>{const page=document.querySelector('.page').getBoundingClientRect();const cards=[...document.querySelectorAll('.pharmacy-contact')].slice(0,5).map(el=>{const box=el.getBoundingClientRect();return{x:box.x,y:box.y,right:box.right}});return{page,cards,scrollWidth:document.documentElement.scrollWidth}});
    assert.ok(wide.page.width>=1200,'desktop directory should use the monitor width');
    assert.equal(new Set(wide.cards.slice(0,4).map(card=>Math.round(card.y))).size,1,'four pharmacies share the desktop row');
    assert.ok(wide.cards[4].y>wide.cards[0].y,'the fifth pharmacy starts the next row');
    assert.ok(wide.cards.every(card=>card.x>=0&&card.right<=1366)&&wide.scrollWidth<=1366,'desktop cards remain fully visible and clickable');
    await desktop.close();

    const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await phone.route('https://**',route=>route.abort());
    await phone.goto(origin);await phone.locator('.pharmacy-contact').first().waitFor();
    const compact=await phone.locator('.pharmacy-contact').evaluateAll(items=>items.slice(0,3).map(el=>{const box=el.getBoundingClientRect();return{x:box.x,y:box.y}}));
    assert.equal(compact[0].y,compact[1].y,'phone keeps its existing two-card row');
    assert.ok(compact[2].y>compact[0].y,'phone keeps its existing second row');
    await phone.close();
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
