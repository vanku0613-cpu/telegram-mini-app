const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
test('global directory search and uniform contact cards',async()=>{
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({serviceWorkers:'block'});await page.setViewportSize({width:390,height:844});await page.route('https://**',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const home of ['/','/main-v2/']){
 await page.goto(base+home);await page.locator('#directorySearch').fill('стоматолог');await page.locator('.directory-result').first().waitFor();
 const icons=await page.evaluate(()=>({clear:document.querySelector('#directorySearchClear').getBoundingClientRect().left,search:document.querySelector('#directorySearchToggle').getBoundingClientRect().left}));assert.ok(icons.clear<icons.search,'clear icon is on the left and magnifier is on the right');
 const text=await page.locator('#directoryResults').innerText();assert.match(text,/Измаил/);assert.match(text,/Одесса/);
 await page.locator('.directory-result').first().click();await page.locator('.contact').waitFor();assert.equal(await page.locator('.contact').count(),1);assert.ok(await page.locator('.call').count());
 await page.goto(base+home);await page.locator('#directorySearch').fill('Гонта');await page.locator('.directory-result').first().waitFor();assert.match(await page.locator('#directoryResults').innerText(),/Одесса/);
 await page.locator('#directorySearch').fill('маникюр');await page.waitForFunction(()=>document.querySelector('#directoryResults').textContent.includes('Контактов:'));assert.ok(await page.locator('.directory-result').count());
 for(const [phone,expected] of [['0976143819','Клубника'],['0484151673','Горсвет'],['0688481795','Электрик'],['0973388892','Дмитрий']]){await page.locator('#directorySearch').fill(phone);await page.locator('.directory-result').first().waitFor();const contact=page.locator('.directory-result').filter({hasText:expected}).first();await contact.waitFor();assert.match(await contact.getAttribute('href'),/^tel:/);assert.equal(await page.locator('.directory-result').count(),1,'one shared index result per unique phone');}
 await page.locator('[data-clear-search]').click();assert.equal(await page.locator('#directoryResults').isVisible(),false);
 await page.locator('#directorySearch').fill('стоматолог');await page.locator('.directory-result').first().waitFor();await page.locator('#homeBtn').click();assert.equal(await page.locator('#directorySearch').inputValue(),'');assert.equal(await page.locator('#directoryResults').isVisible(),false);assert.ok(await page.locator('.card:visible').count()>1,'Главное restores the unfiltered menu');
 }
 await page.goto(base+'/health-care/#search/'+encodeURIComponent('стоматолог'));await page.locator('.contact').first().waitFor();assert.match(await page.locator('#content').innerText(),/Одесса/);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});const sizes=await page.locator('.contact').evaluateAll(es=>es.map(e=>({w:Math.round(e.getBoundingClientRect().width),h:e.getBoundingClientRect().height})));assert.equal(new Set(sizes.map(s=>s.w)).size,1,JSON.stringify({width,sizes}));assert.ok(sizes.every(size=>size.h>=140&&size.h<=360),JSON.stringify({width,sizes}));const pageWidth=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth,overflow:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,cls:String(e.className||''),id:e.id,right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width),css:getComputedStyle(e).width,parent:e.parentElement?.className})).filter(e=>e.right>innerWidth+1).slice(0,8)}));assert.ok(pageWidth.scroll<=pageWidth.inner,JSON.stringify({width,pageWidth}));}
 await page.locator('.contact-description summary').first().click();const expandedHeight=await page.locator('.contact').first().evaluate(e=>e.getBoundingClientRect().height);assert.ok(expandedHeight>=140&&expandedHeight<=360);
 await page.locator('[data-favorite]').first().click();await page.goto(base+'/health-care/#favorites');await page.locator('.contact').waitFor();assert.equal(await page.locator('#topNav a').count(),1);assert.equal(await page.locator('#bottomNav a').count(),1);assert.match(await page.locator('#topNav').innerText(),/главное меню/);
 await page.goto(base+'/health-care/#city/'+encodeURIComponent('Измаил'));await page.locator('.category-tile').first().waitFor();assert.equal(await page.locator('#topNav a').count(),2);
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
});
