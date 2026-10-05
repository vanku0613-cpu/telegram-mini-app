const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

test('every interior main-menu return uses the services directory dimensions',async()=>{
  const server=http.createServer((req,res)=>{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(file.endsWith('/'))file+='index.html';
    file=path.join(root,file);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.route('https://**',route=>route.abort());
    const origin='http://127.0.0.1:'+server.address().port;
    const pages=[
      ['/services-masters/','services'],
      ['/health-care/#favorites','favorites'],
      ['/communal-services/','communal'],
      ['/products-food/','food'],
      ['/recreation/','recreation'],
      ['/transport/','transport'],
      ['/our-groups-menu/','groups'],
      ['/soglashenie/','agreement'],
      ['/ukrytia/','shelters'],
      ['/zags/','zags']
    ];
    let reference;
    for(const [url,label] of pages){
      await page.goto(origin+url,{waitUntil:'domcontentloaded'});
      await page.locator('[data-main-back]').first().waitFor();
      const values=await page.locator('[data-main-back]').evaluateAll(items=>items.filter(item=>getComputedStyle(item).display!=='none').map(item=>{
        const style=getComputedStyle(item),rect=item.getBoundingClientRect();
        return {width:Math.round(rect.width),height:Math.round(rect.height),padding:style.padding,borderRadius:style.borderRadius,fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight)};
      }));
      assert.ok(values.length>0,label+' has a visible return to the main menu');
      if(!reference)reference=values[0];
      for(const value of values)assert.deepEqual(value,reference,label+' uses the shared return-button dimensions');
    }
    assert.deepEqual({...reference,fontSize:0,lineHeight:0},{width:340,height:50,padding:'7px 8px',borderRadius:'15px',fontSize:0,lineHeight:0});
    assert.ok(reference.fontSize>=15&&reference.fontSize<=17,'return text is larger and remains responsive');
    assert.ok(Math.abs(reference.lineHeight-reference.fontSize*1.1)<.02,'return text keeps the shared compact line height');

    await page.goto(origin+'/transport/bus-schedule/',{waitUntil:'domcontentloaded'});
    await page.locator('[data-main-back]:visible').first().waitFor();
    const schedule=await page.locator('[data-main-back]:visible').first().evaluate(item=>{const style=getComputedStyle(item),rect=item.getBoundingClientRect();return{height:Math.round(rect.height),padding:style.padding,borderRadius:style.borderRadius,fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight)};});
    assert.deepEqual(schedule,{height:reference.height,padding:reference.padding,borderRadius:reference.borderRadius,fontSize:reference.fontSize,lineHeight:reference.lineHeight},'the paired bus-schedule return keeps the same height and typography');
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
