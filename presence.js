(() => {
  'use strict';
  const endpoint=window.IZMAIL_PRESENCE_URL;if(!endpoint)return;
  const api=endpoint.replace(/\/$/,'');
  let visitor;
  try{visitor=localStorage.getItem('izmail-presence-visitor');if(!/^[a-f0-9-]{36}$/i.test(visitor||'')){visitor=crypto.randomUUID();localStorage.setItem('izmail-presence-visitor',visitor);}}catch(_){visitor=crypto.randomUUID();}
  const session=crypto.randomUUID(),body={visitor,session};
  let heartbeat=null,indicator=null,updating=false,active=false,generation=0;
  const viewer=document.querySelector('.viewer');
  const shelter=document.getElementById('shelterBtn'),parent=document.querySelector('#app .ui');
  if(viewer){
    indicator=document.createElement('span');indicator.className='presence-badge';
    indicator.style.cssText='position:absolute;left:50%;bottom:calc(100% + 3px);transform:translateX(-50%);box-sizing:border-box;height:12px;min-width:25px;padding:0 4px;border:1px solid rgba(134,239,172,.2);border-radius:8px;background:rgba(1,14,30,.6);color:#86efac;font:inherit;font-size:8px;line-height:10px;white-space:nowrap';
    (parent||viewer).appendChild(indicator);showCount(null);
    function placeIndicator(){
      if(!shelter||!parent)return;
      const frame=parent.getBoundingClientRect(),button=shelter.getBoundingClientRect();
      const scale=frame.width/parent.clientWidth||1;
      indicator.style.left='auto';indicator.style.bottom='auto';indicator.style.transform='none';
      indicator.style.right=(frame.right-button.right+4)/scale+'px';
      indicator.style.top=(button.top-frame.top)/scale-15+'px';
    }
    window.addEventListener('resize',placeIndicator);
    if(window.ResizeObserver){const observer=new ResizeObserver(placeIndicator);observer.observe(parent||viewer);if(shelter)observer.observe(shelter);}
    placeIndicator();
  }
  function showCount(count){if(!indicator)return;indicator.textContent='● '+(count===null?'—':count);indicator.title=count===null?'Сервис присутствия недоступен':'Сейчас в приложении: '+count;indicator.setAttribute('aria-label',indicator.title);}
  async function request(path,data){const response=await fetch(api+path,{method:data?'POST':'GET',cache:'no-store',...(data?{headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(String(response.status));return response.json();}
  async function updateCount(){if(!indicator||updating||document.hidden)return;updating=true;try{const data=await request('/online');if(!Number.isSafeInteger(data.online)||data.online<0)throw new Error('Invalid count');showCount(data.online);}catch(_){showCount(null);}finally{updating=false;}}
  function leave(){if(!active)return;active=false;generation++;clearInterval(heartbeat);heartbeat=null;try{if(navigator.sendBeacon(api+'/leave',JSON.stringify(body)))return;}catch(_){}fetch(api+'/leave',{method:'POST',body:JSON.stringify(body),keepalive:true}).catch(()=>{});}
  async function pulse(){
    const current=generation;
    try{await request('/heartbeat',body);if(current!==generation||document.hidden){if(!active){try{navigator.sendBeacon(api+'/leave',JSON.stringify(body));}catch(_){}}return;}updateCount();}
    catch(_){showCount(null);}
  }
  function start(){if(active||document.hidden||!navigator.onLine)return;active=true;generation++;pulse();heartbeat=setInterval(pulse,10000);}
  document.addEventListener('visibilitychange',()=>{document.hidden?leave():start();});
  window.addEventListener('pagehide',leave);window.addEventListener('pageshow',start);window.addEventListener('online',start);window.addEventListener('offline',()=>{leave();showCount(null);});
  start();if(indicator)setInterval(updateCount,3000);
})();
