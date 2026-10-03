const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('desktop exchange title, both rates and date stay readable inside the tile',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    let name=new URL(req.url,'http://localhost').pathname;
    if(name.endsWith('/'))name+='index.html';
    const file=path.join(root,name);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.webp')?'image/webp':'text/html');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const viewport of [{width:1280,height:720},{width:800,height:600},{width:1024,height:768},{width:1366,height:768}]){
      const page=await browser.newPage({viewport,serviceWorkers:'block'});
      await page.route('https://**',route=>route.abort());
      await page.goto(`http://127.0.0.1:${server.address().port}/main-v2/`);
      await page.waitForTimeout(500);
      const layout=await page.evaluate(()=>{
        const box=element=>{const r=element.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const panel=document.querySelector('.currency-panel');
        return {panel:box(panel),parts:[...panel.querySelectorAll('.info-title,.rate,.rates-updated')].filter(element=>getComputedStyle(element).display!=='none').map(box),rates:[...panel.querySelectorAll('.rate')].map(row=>[...row.children].map(box)),values:[...panel.querySelectorAll('#usdRate,#eurRate')].map(element=>({width:element.clientWidth,scroll:element.scrollWidth}))};
      });
      if(process.env.CURRENCY_PREVIEW&&viewport.width===1280)await page.screenshot({path:process.env.CURRENCY_PREVIEW});
      const p=layout.parts;
      for(let i=0;i<p.length;i++){
        assert.ok(p[i].top>=layout.panel.top+2&&p[i].bottom<=layout.panel.bottom-2,`part ${i} outside currency tile ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
        if(i)assert.ok(p[i].top>=p[i-1].bottom+1,`parts ${i-1},${i} touch at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
      }
      for(const [label,value] of layout.rates)assert.ok(label.right+2<=value.left||label.bottom<=value.top,`currency label touches rate at ${viewport.width}x${viewport.height}`);
      assert.ok(layout.values.every(value=>value.scroll<=value.width+1),`rate digits are clipped at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
      await page.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
