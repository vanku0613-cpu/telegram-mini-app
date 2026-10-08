const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('desktop zoom keeps the counter and bottom navigation clear of adjacent rows',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.webp')?'image/webp':'text/html');res.end(fs.readFileSync(file))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    for(const viewport of [{width:1280,height:720},{width:800,height:600}]){
      const page=await browser.newPage({viewport});
      await page.addInitScript(()=>{window.EventSource=undefined});
      await page.route('https://**',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
      await page.waitForTimeout(400);
      const layout=await page.evaluate(()=>{const rect=selector=>{const value=document.querySelector(selector).getBoundingClientRect();return{top:value.top,bottom:value.bottom,left:value.left,right:value.right,width:value.width,height:value.height}};const art=document.querySelector('.bg-main');return{app:rect('#app'),art:{...rect('.bg-main'),naturalWidth:art.naturalWidth,naturalHeight:art.naturalHeight},logo:rect('#mainLogoHotspot'),viewer:rect('.viewer'),weather:rect('.top-row'),groups:rect('.groups-row'),bottom:rect('.bottom'),agreement:rect('.agreement'),cards:[...document.querySelectorAll('.cards .card')].map(item=>{const value=item.getBoundingClientRect();return{top:value.top,left:value.left,right:value.right,bottom:value.bottom,width:value.width,height:value.height}}),bottomItems:[...document.querySelectorAll('.bottom .nav')].map(item=>{const value=item.getBoundingClientRect();return{left:value.left,right:value.right,scroll:item.scrollWidth,client:item.clientWidth}})}});
      assert.ok(layout.app.width>=viewport.width-20&&layout.app.height>=viewport.height-20,`desktop app uses the available screen at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.cards.every(card=>card.left>=layout.app.left&&card.right<=layout.app.right&&card.bottom<=viewport.height),`all menu cards stay visible at ${viewport.width}x${viewport.height}`);
      assert.equal(new Set(layout.cards.slice(0,viewport.width>=900?4:2).map(card=>Math.round(card.top))).size,1,`first desktop card row is aligned at ${viewport.width}x${viewport.height}`);
      assert.ok(Math.abs(layout.art.width/layout.art.height-layout.art.naturalWidth/layout.art.naturalHeight)<.01,`desktop artwork keeps its original aspect ratio at ${viewport.width}x${viewport.height}`);
      assert.ok(Math.abs(layout.logo.width-layout.logo.height)<1,`desktop logo target stays circular at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.cards.every(card=>card.width/card.height<3.1),`desktop menu cards keep professional proportions at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.viewer.bottom<=layout.weather.top,`counter overlaps weather at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.groups.bottom<=layout.bottom.top,`bottom navigation overlaps group shortcuts at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.bottom.top-layout.groups.bottom>=5,`bottom navigation needs visible air above it at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.bottom.bottom<=layout.agreement.top,`agreement overlaps bottom navigation at ${viewport.width}x${viewport.height}`);
      for(let index=1;index<layout.bottomItems.length;index++)assert.ok(layout.bottomItems[index-1].right<=layout.bottomItems[index].left,`bottom navigation buttons overlap at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.bottomItems.every(item=>item.scroll<=item.client+1),`bottom navigation text is clipped at ${viewport.width}x${viewport.height}`);
      await page.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
