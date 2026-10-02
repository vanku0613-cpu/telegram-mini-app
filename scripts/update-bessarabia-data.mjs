import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const file=path.join(root,'bessarabia-online','data.json');
const sources=[
  ['ferry','https://www.porom.org/schedule'],
  ['borderQueue','https://www.politiadefrontiera.ro/en/traficonline/?vw=1']
];

async function readSource([id,url]){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{'user-agent':'Izmail-Directory-Data-Check/1.0'}});
    if(!response.ok)throw new Error(`${id}: HTTP ${response.status}`);
    const text=await response.text();
    if(text.length<500)throw new Error(`${id}: response is too short`);
    return {id,url,checkedAt:new Date().toISOString(),ok:true,body:text};
  }finally{clearTimeout(timer)}
}

const current=JSON.parse(await fs.readFile(file,'utf8'));
if(!current?.sections?.border)throw new Error('Current ferry data is invalid; preserving it unchanged.');
const results=await Promise.allSettled(sources.map(readSource));
const checks=results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
const ferry=checks.find(item=>item.id==='ferry');
if(!ferry)throw new Error('The primary ferry source is unavailable; preserving the previous snapshot.');
const ferryText=ferry.body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ');
if(!/24\s*\/\s*7|цілодоб|круглосуточ/i.test(ferryText))throw new Error('Ferry schedule no longer confirms 24/7 operation; preserving the previous snapshot.');
const next=structuredClone(current);
next.updatedAt=new Date().toISOString();
next.sections.border.cards[0].status='Работает круглосуточно';
next.sourceChecks=Object.fromEntries(sources.map(([id,url],index)=>{
  const result=results[index];
  return [id,result.status==='fulfilled'?(({body,...item})=>item)(result.value):{id,url,checkedAt:new Date().toISOString(),ok:false}];
}));
const temp=file+'.tmp';
await fs.writeFile(temp,JSON.stringify(next,null,2)+'\n','utf8');
JSON.parse(await fs.readFile(temp,'utf8'));
await fs.rename(temp,file);
console.log(`Verified ${checks.length} of ${sources.length} official sources and safely preserved the last valid data.`);
