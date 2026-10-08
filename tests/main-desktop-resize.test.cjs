const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('desktop app can be resized while the phone layout stays fixed',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    let name=new URL(req.url,'http://localhost').pathname;
    if(name.endsWith('/'))name+='index.html';
    const file=path.join(root,name);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}
    res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.webp')?'image/webp':'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const desktop=await browser.newPage({viewport:{width:1280,height:720}});
    await desktop.addInitScript(()=>{window.EventSource=undefined});
    await desktop.route('https://**',route=>route.abort());
    await desktop.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
    const desktopBefore=await desktop.locator('#app').boundingBox();
    const desktopStyle=await desktop.locator('#app').evaluate(element=>({
      resize:getComputedStyle(element).resize,
      handle:getComputedStyle(document.getElementById('desktopResizeHandle')).display
    }));
    assert.equal(desktopStyle.resize,'both');
    assert.equal(desktopStyle.handle,'block');
    const handle=desktop.locator('#desktopResizeHandle');
    await handle.hover();
    await desktop.mouse.down();
    await desktop.mouse.move(desktopBefore.x+desktopBefore.width-180,desktopBefore.y+desktopBefore.height-40,{steps:10});
    await desktop.mouse.up();
    const desktopAfter=await desktop.locator('#app').boundingBox();
    assert.ok(desktopAfter.width<desktopBefore.width-100,'desktop width should accept a smaller user-selected size');
    assert.ok(desktopAfter.width>=900&&desktopAfter.height>=650,'desktop resizing keeps the directory professionally usable');
    assert.ok(desktopAfter.width<=1268&&desktopAfter.height<=712,'desktop resizing must stay inside the viewport');
    const desktopOverflow=await desktop.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert.ok(desktopOverflow.width<=desktopOverflow.viewport,'resizing must not create page-level horizontal overflow');
    await desktop.close();

    const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await phone.addInitScript(()=>{window.EventSource=undefined});
    await phone.route('https://**',route=>route.abort());
    await phone.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
    const phoneState=await phone.locator('#app').evaluate(element=>({
      resize:getComputedStyle(element).resize,
      handle:getComputedStyle(document.getElementById('desktopResizeHandle')).display,
      width:element.getBoundingClientRect().width,
      height:element.getBoundingClientRect().height
    }));
    assert.equal(phoneState.resize,'none');
    assert.equal(phoneState.handle,'none');
    assert.ok(Math.abs(phoneState.width-390)<1,'phone width must remain unchanged');
    assert.ok(Math.abs(phoneState.height-695.37)<2,'phone height must remain unchanged');
    await phone.close();
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
