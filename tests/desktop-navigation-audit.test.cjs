const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const publicOrigin='https://vanku0613-cpu.github.io';
const publicPrefix='/telegram-mini-app';

function createServer(root){
  return http.createServer((req,res)=>{
    let name=new URL(req.url,'http://localhost').pathname;
    if(name.endsWith('/'))name+='index.html';
    const file=path.join(root,name);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
    const ext=path.extname(file);
    res.setHeader('Content-Type',ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':ext==='.webp'?'image/webp':'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  });
}

async function fulfillPublicRoute(route,root){
  let pathname=new URL(route.request().url()).pathname;
  if(!pathname.startsWith(publicPrefix)){await route.abort();return;}
  pathname=pathname.slice(publicPrefix.length)||'/';
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.join(root,pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){await route.fulfill({status:404,body:''});return;}
  const ext=path.extname(file);
  await route.fulfill({
    status:200,
    contentType:ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':ext==='.webp'?'image/webp':'text/html; charset=utf-8',
    body:fs.readFileSync(file)
  });
}

const routes=[
  ['.card[data-title="Здоровье и уход"]','/health-care/'],
  ['.card[data-title="Транспорт / Такси"]','/transport/'],
  ['.card[data-title="Услуги и мастера"]','/services-masters/'],
  ['.card[data-title="Продукты питания"]','/products-food/'],
  ['.card[data-title="Коммунальные службы"]','/communal-services/'],
  ['.card[data-title="Образование и развитие"]','/health-care/'],
  ['.card[data-title="Отдых • Жильё • Море"]','/recreation/'],
  ['#zagsBtn','/zags/'],
  ['#groupsBtn','/our-groups-menu/'],
  ['#favBtn','/health-care/']
];

test('every desktop home button opens its folder and the folder returns home',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=createServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});
    await page.addInitScript(()=>{window.EventSource=undefined});
    await page.route('https://**',route=>route.abort());
    await page.route('https://vanku0613-cpu.github.io/telegram-mini-app/**',route=>fulfillPublicRoute(route,root));
    for(const [selector,pathname] of routes){
      await page.goto(origin+'/main-v2/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.IZMAIL_NAV_READY===true);
      await page.locator(selector).click();
      await page.waitForURL(url=>url.origin===publicOrigin&&url.pathname===publicPrefix+pathname,{waitUntil:'domcontentloaded'});
      assert.ok((await page.locator('body').innerText()).trim().length>20,`${selector} opened an empty folder`);
      const back=page.locator('a[href*="main-v2"]:visible,[data-main-back]:visible').first();
      assert.equal(await back.isVisible(),true,`${pathname} needs a visible return-to-main control`);
      await back.click();
      await page.waitForURL(url=>url.origin===publicOrigin&&url.pathname===publicPrefix+'/main-v2/',{waitUntil:'domcontentloaded'});
    }
    await page.close();
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});

test('desktop category buttons retain a direct fallback when shared navigation is unavailable',async()=>{
  const root=path.resolve(__dirname,'..');
  const server=createServer(root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'chrome'});
  try{
    const page=await browser.newPage({viewport:{width:1366,height:768},serviceWorkers:'block'});
    await page.addInitScript(()=>{window.EventSource=undefined});
    await page.route('**/navigation.js*',route=>route.abort());
    await page.route('https://**',route=>route.abort());
    await page.route('https://vanku0613-cpu.github.io/telegram-mini-app/**',route=>fulfillPublicRoute(route,root));
    await page.goto(origin+'/main-v2/',{waitUntil:'domcontentloaded'});
    await page.locator('.card[data-title="Услуги и мастера"]').click();
    await page.waitForURL(url=>url.origin===publicOrigin&&url.pathname===publicPrefix+'/services-masters/',{waitUntil:'domcontentloaded'});
    assert.match(await page.title(),/Услуги и мастера/);
    await page.close();
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
