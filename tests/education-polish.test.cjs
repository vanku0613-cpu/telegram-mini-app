const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

test('education cover, navigation and hierarchy match the polished directory style',async()=>{
  const server=http.createServer((req,res)=>{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(file.endsWith('/'))file+='index.html';
    file=path.join(root,file);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const origin='http://127.0.0.1:'+server.address().port;
    await page.goto(origin+'/health-care/#education');
    await page.locator('.education-tile').first().waitFor();
    assert.deepEqual(await page.locator('#topNav a').allTextContents(),['Вернуться в главное меню']);
    assert.deepEqual(await page.locator('#bottomNav a').allTextContents(),['Вернуться в главное меню']);
    const cover=page.locator('.education-cover img');
    await cover.evaluate(img=>img.decode());
    assert.match(await cover.getAttribute('src'),/education-development-cover-v1\.webp/);
    assert.equal(await cover.evaluate(img=>img.naturalWidth>0),true);
    assert.equal(await page.locator('.education-tile').count(),4);
    assert.equal(await page.locator('.education-tile-icon').count(),4);
    const colors=await page.locator('.education-tile').evaluateAll(items=>items.map(item=>getComputedStyle(item).backgroundImage));
    assert.ok(new Set(colors).size>1,'folders and direct contact buttons use distinct surfaces');
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:844});
      const layout=await page.locator('.education-tile').evaluateAll(items=>items.map(item=>({height:item.getBoundingClientRect().height,fits:item.scrollWidth<=item.clientWidth})));
      const expectedHeight=width<=350?86:90;
      assert.ok(layout.every(item=>item.height===expectedHeight&&item.fits),width+'px: '+JSON.stringify(layout));
    }
    await page.goto(origin+'/health-care/#category/96216');
    await page.locator('.contact').first().waitFor();
    assert.equal(await page.locator('.education-phone-action').count(),await page.locator('.phone-number').count());
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:844});
      const phones=await page.locator('.education-phone strong').evaluateAll(items=>items.map(item=>({whiteSpace:getComputedStyle(item).whiteSpace,fits:item.scrollWidth<=item.clientWidth})));
      assert.ok(phones.every(phone=>phone.whiteSpace==='nowrap'&&phone.fits),width+'px: '+JSON.stringify(phones));
    }
    await page.locator('.favorite-toggle').first().click();
    await page.goto(origin+'/health-care/#favorites');
    const favoritesArt=page.locator('.favorites-cover-art');
    await favoritesArt.evaluate(img=>img.decode());
    assert.equal(await page.locator('body').getAttribute('data-view'),'favorites');
    assert.match(await favoritesArt.getAttribute('src'),/favorites-cover-v1\.webp/);
    const favoriteButton=page.locator('.favorite-toggle').first();
    await favoriteButton.dispatchEvent('pointerdown');
    await page.waitForTimeout(220);
    assert.match(await favoriteButton.evaluate(el=>getComputedStyle(el).boxShadow),/rgba?\(0, (?:167|110), 255/);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});

test('main labels fit and service favorites show the same neon press feedback',async()=>{
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
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const origin='http://127.0.0.1:'+server.address().port;
    await page.goto(origin+'/main-v2/');
    for(const width of [320,390,768,1200]){
      await page.setViewportSize({width,height:900});
      await page.waitForFunction(()=>{const el=document.querySelector('#groupsBtn .groups-title');return el&&el.scrollWidth<=el.clientWidth+1;});
      const fit=await page.locator('#groupsBtn .groups-title').evaluate(el=>({fits:el.scrollWidth<=el.clientWidth+1,stroke:getComputedStyle(el).webkitTextStrokeColor}));
      assert.equal(fit.fits,true,width+'px');
      assert.match(fit.stroke,/rgba?\(0, 0, 0/);
    }
    await page.goto(origin+'/services-masters/');
    await page.locator('.section-tab[data-section="services"]').click();
    await page.locator('#view .category').first().click();
    const star=page.locator('#view .favorite-toggle').first();
    await star.dispatchEvent('pointerdown');
    assert.equal(await star.evaluate(el=>el.classList.contains('tap-lit')),true);
    await page.waitForTimeout(220);
    assert.match(await star.evaluate(el=>getComputedStyle(el).boxShadow),/rgba?\(0, (?:167|110), 255/);
    await page.goto(origin+'/zags/');
    const zagsCover=page.locator('.cover-art img');
    await zagsCover.evaluate(img=>img.decode());
    assert.match(await zagsCover.getAttribute('src'),/zags-cover-v1\.webp/);
    assert.equal(await zagsCover.evaluate(img=>img.naturalWidth>0),true);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
