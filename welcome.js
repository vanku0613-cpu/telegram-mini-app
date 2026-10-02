(() => {
  'use strict';
  const viewer=document.querySelector('.viewer'),parent=document.querySelector('#app .ui'),shelter=document.getElementById('shelterBtn');
  if(!viewer||!parent)return;
  const key='izmail-welcomed-session-v1';
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch(_){}
  let name='';
  try{
    const user=window.Telegram?.WebApp?.initDataUnsafe?.user;
    const data=new URLSearchParams(location.hash.slice(1)).get('tgWebAppData');
    const provided=user||(data?JSON.parse(new URLSearchParams(data).get('user')||'null'):null);
    if(typeof provided?.first_name==='string')name=provided.first_name.trim().slice(0,40);
  }catch(_){}
  const greeting=document.createElement('span');greeting.className='welcome-greeting';
  greeting.textContent=name?'Добро пожаловать, '+name+'!':'Добро пожаловать!';
  greeting.title=greeting.textContent;
  greeting.style.cssText='position:absolute;pointer-events:none;box-sizing:border-box;padding:5px 8px;border:1px solid rgba(143,213,229,.28);border-radius:10px;background:linear-gradient(135deg,rgba(6,38,63,.88),rgba(3,25,42,.72));box-shadow:0 2px 8px rgba(0,0,0,.2);color:#effff8;font-size:clamp(12px,3.2cqw,14px);line-height:1.2;font-weight:700;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;transition:opacity .45s ease';
  parent.appendChild(greeting);
  function place(){
    const box=viewer.getBoundingClientRect(),frame=parent.getBoundingClientRect();
    const scale=frame.width/parent.clientWidth||1;
    const edge=shelter?shelter.getBoundingClientRect():frame;
    greeting.style.left=(box.right-frame.left+7)/scale+'px';
    greeting.style.top=(Math.min(box.top+box.height/2-6,edge.top-19)-frame.top)/scale+'px';
    greeting.style.transform='translateY(-100%)';
    greeting.style.width=Math.max(0,(edge.right-box.right-7)/scale)+'px';
  }
  const observer=new MutationObserver(place);observer.observe(viewer,{attributes:true,attributeFilter:['style']});
  window.addEventListener('resize',place);place();
  const fade=setTimeout(()=>{greeting.style.opacity='0';},6000);
  const remove=setTimeout(()=>{greeting.remove();observer.disconnect();window.removeEventListener('resize',place);},6500);
  window.addEventListener('pagehide',()=>{clearTimeout(fade);clearTimeout(remove);greeting.remove();observer.disconnect();window.removeEventListener('resize',place);},{once:true});
})();
