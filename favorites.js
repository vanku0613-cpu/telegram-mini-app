(()=>{
  'use strict';
  const savedKey='izmail.health.favorites.v1';
  const catalogKey='izmail.favorites.catalog.v1';
  const normalizePhone=value=>{
    const digits=String(value||'').replace(/\D/g,'');
    return digits.startsWith('380')&&digits.length===12?'0'+digits.slice(3):digits;
  };
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||fallback)}catch{return JSON.parse(fallback)}};
  const saved=()=>{const value=read(savedKey,'[]');return new Set(Array.isArray(value)?value.filter(item=>typeof item==='string'):[])};
  const catalog=()=>{const value=read(catalogKey,'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}};
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  function details(link){
    const contact=link.closest('.contact,.duty,.emergency,.panel')||document;
    const contactTitle=clean(contact.querySelector('h3')?.textContent);
    const panelTitle=clean(contact.querySelector('.panel-head h2,h2')?.textContent)||clean(document.querySelector('#viewTitle')?.textContent)||document.title.split('—')[0].trim();
    const category=clean(document.querySelector('#viewTitle')?.textContent)||panelTitle;
    const phone=normalizePhone(link.getAttribute('href'));
    const label=clean(link.querySelector('strong,b')?.textContent||link.textContent)||('+'+phone);
    const name=contactTitle&&contactTitle!=='Контакт услуги'?contactTitle:(label.startsWith('+')?panelTitle+' · '+label:panelTitle+' · '+label);
    const note=clean(contact.querySelector('.contact-note,.contact p,.duty p,.debris p')?.textContent);
    const key=JSON.stringify([name,phone]);
    return {key,record:{id:'saved-'+encodeURIComponent(key),name,city:'Измаил',category,specialties:category+(note?' · '+note:''),phones:[phone],href:phone.length<=5?'tel:'+phone:'tel:+38'+phone,note,route:'/favorites/'}};
  }
  function sync(){const values=saved();document.querySelectorAll('[data-favorite]').forEach(button=>{const active=values.has(button.dataset.favorite),text=active?'Убрать из избранного':'Добавить в избранное';button.setAttribute('aria-pressed',String(active));button.textContent=active?'★':'☆';button.setAttribute('aria-label',text+': '+JSON.parse(button.dataset.favorite).join(' '));button.title=text})}
  function attach(link){
    if(link.dataset.favoriteReady||!link.closest('.contact,.duty,.emergency,.panel'))return;
    link.dataset.favoriteReady='true';
    const info=details(link),row=link.closest('.phone-action')||document.createElement('div');
    if(!link.closest('.phone-action')){row.className='phone-action';link.parentNode.insertBefore(row,link);row.append(link)}
    let button=row.querySelector('[data-favorite]');
    if(!button){button=document.createElement('button');button.type='button';button.className='favorite-toggle';row.append(button)}
    button.dataset.favorite=info.key;button.dataset.favoriteRecord=JSON.stringify(info.record);
  }
  function scan(root=document){root.querySelectorAll?.('a[href^="tel:"]').forEach(attach);if(root.matches?.('a[href^="tel:"]'))attach(root)}
  scan();
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node)}))).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-favorite]');if(!button)return;
    const values=saved(),key=button.dataset.favorite,items=catalog();
    if(values.has(key)){values.delete(key);delete items[key]}else{
      values.add(key);
      try{items[key]=JSON.parse(button.dataset.favoriteRecord||'{}')}catch{}
    }
    try{localStorage.setItem(savedKey,JSON.stringify([...values]));localStorage.setItem(catalogKey,JSON.stringify(items))}catch{return}
    sync();
  });
  document.addEventListener('pointerdown',event=>{
    const control=event.target.closest('.phone-action>.phone,a.phone[href^="tel:"],.favorite-toggle,.links a');
    if(!control)return;
    control.classList.add('tap-lit');
    setTimeout(()=>control.classList.remove('tap-lit'),420);
  },{passive:true});
  window.addEventListener('storage',event=>{if(event.key===savedKey||event.key===null)sync()});
  sync();
})();
