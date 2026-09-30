const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('global directory search and uniform contact cards',async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await page.route('https://**',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const home of ['/','/main-v2/']){
 await page.goto(base+home);await page.locator('#directorySearch').fill('стоматолог');await page.locator('.directory-result').first().waitFor();
 const text=await page.locator('#directoryResults').innerText();assert.match(text,/Измаил/);assert.match(text,/Одесса/);
 await page.locator('.directory-result').first().click();await page.locator('.contact').waitFor();assert.equal(await page.locator('.contact').count(),1);assert.ok(await page.locator('.call').count());
 await page.goto(base+home);await page.locator('#directorySearch').fill('Гонта');await page.locator('.directory-result').first().waitFor();assert.match(await page.locator('#directoryResults').innerText(),/Одесса/);
 await page.locator('#directorySearch').fill('маникюр');await page.waitForFunction(()=>document.querySelector('#directoryResults').textContent.includes('Контактов:'));assert.ok(await page.locator('.directory-result').count());
 await page.locator('[data-clear-search]').click();assert.equal(await page.locator('#directoryResults').isVisible(),false);
 }
 await page.goto(base+'/health-care/#search/'+encodeURIComponent('стоматолог'));await page.locator('.contact').first().waitFor();assert.match(await page.locator('#content').innerText(),/Одесса/);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});const sizes=await page.locator('.contact').evaluateAll(es=>es.map(e=>({w:Math.round(e.getBoundingClientRect().width),h:e.getBoundingClientRect().height})));assert.equal(new Set(sizes.map(s=>s.w)).size,1);assert.deepEqual([...new Set(sizes.map(s=>s.h))],[280]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.locator('.contact-description summary').first().click();assert.equal(await page.locator('.contact').first().evaluate(e=>e.getBoundingClientRect().height),280);
 await page.locator('[data-favorite]').first().click();await page.goto(base+'/health-care/#favorites');await page.locator('.contact').waitFor();assert.equal(await page.locator('#topNav a').count(),1);assert.equal(await page.locator('#bottomNav a').count(),1);assert.match(await page.locator('#topNav').innerText(),/главное меню/);
 await page.goto(base+'/health-care/#city/'+encodeURIComponent('Измаил'));await page.locator('.category-tile').first().waitFor();assert.equal(await page.locator('#topNav a').count(),2);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
});
