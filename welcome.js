(() => {
  'use strict';
  const viewer=document.querySelector('.viewer'),parent=document.querySelector('#app .ui');
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
  greeting.style.cssText='position:absolute;pointer-events:none;box-sizing:border-box;padding:2px 5px;border-radius:7px;background:rgba(1,14,30,.35);color:#e3f5ef;font-size:clamp(8px,2cqw,10px);line-height:1.25;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;transition:opacity .45s ease';
  parent.appendChild(greeting);
  function place(){
    const box=viewer.getBoundingClientRect(),frame=parent.getBoundingClientRect();
    const scale=frame.width/parent.clientWidth||1;
    greeting.style.left=(box.right-frame.left+7)/scale+'px';
    greeting.style.top=(box.top-frame.top+box.height/2)/scale+'px';
    greeting.style.transform='translateY(-50%)';
    greeting.style.maxWidth=Math.max(0,(frame.right-box.right-14)/scale)+'px';
  }
  const observer=new MutationObserver(place);observer.observe(viewer,{attributes:true,attributeFilter:['style']});
  window.addEventListener('resize',place);place();
  const fade=setTimeout(()=>{greeting.style.opacity='0';},4000);
  const remove=setTimeout(()=>{greeting.remove();observer.disconnect();window.removeEventListener('resize',place);},4500);
  window.addEventListener('pagehide',()=>{clearTimeout(fade);clearTimeout(remove);greeting.remove();observer.disconnect();window.removeEventListener('resize',place);},{once:true});
})();
