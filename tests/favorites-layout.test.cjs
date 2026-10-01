const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

test('favorites reuse the compact services phone card',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.join(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const origin=`http://127.0.0.1:${server.address().port}/health-care/`;
    await page.goto(origin+'#search/'+encodeURIComponent('стоматолог'));
    await page.locator('.contact').first().waitFor();
    await page.locator('[data-favorite]').first().click();
    await page.goto(origin+'?favorites-card=1#favorites');
    await page.locator('.favorite-phone').first().waitFor();
    await page.waitForTimeout(500);
    const phone=page.locator('.favorite-phone').first();
    assert.deepEqual(await phone.evaluate(el=>{const style=getComputedStyle(el),number=el.querySelector('strong').getBoundingClientRect(),label=el.querySelector('span').getBoundingClientRect();return{background:style.backgroundColor,direction:style.flexDirection,labelOnRight:label.left>number.left}}),{background:'rgb(10, 41, 69)',direction:'row',labelOnRight:true});
    assert.ok(await page.locator('.contact').first().evaluate(el=>el.getBoundingClientRect().height<220),'favorite contact follows its content instead of keeping the old fixed height');
    assert.equal(await page.locator('.contact').evaluateAll(items=>new Set(items.map(item=>Math.round(item.getBoundingClientRect().left))).size),1);
    const star=page.locator('.favorite-phone-action>.favorite-toggle').first();
    assert.equal(await phone.evaluate((el,star)=>{const phoneBox=el.getBoundingClientRect(),starBox=star.getBoundingClientRect();return Math.round(phoneBox.top+phoneBox.height/2)===Math.round(starBox.top+starBox.height/2)},await star.elementHandle()),true);
    await phone.dispatchEvent('pointerdown');await page.waitForTimeout(180);assert.match(await phone.evaluate(el=>getComputedStyle(el).boxShadow),/rgba?\(0, (?:167|110), 255/);
    await star.dispatchEvent('pointerdown');await page.waitForTimeout(180);assert.match(await star.evaluate(el=>getComputedStyle(el).boxShadow),/rgba?\(0, (?:167|110), 255/);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
