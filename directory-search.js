(function(){
 'use strict';
 const input=document.getElementById('directorySearch');if(!input)return;
 const toggle=document.getElementById('directorySearchToggle');
 const clearButton=document.getElementById('directorySearchClear');
 const root=new URL('./',document.currentScript.src),health=new URL('health-care/',root),transport=new URL('transport/',root);
 const panel=document.createElement('section');panel.id='directoryResults';panel.hidden=true;panel.setAttribute('aria-label','Результаты поиска по справочнику');document.body.append(panel);
 input.setAttribute('aria-controls',panel.id);input.setAttribute('aria-expanded','false');
 const cards=[...document.querySelectorAll('.cards .card')];
 const norm=v=>String(v||'').toLocaleLowerCase().replace(/[ёє]/g,'е').replace(/[ії]/g,'и').replace(/[’'`]/g,'').replace(/\s+/g,' ').trim();
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const formatPhone=value=>{const d=String(value||'').replace(/\D/g,'');if(d.length===12&&d.startsWith('380'))return `+380 ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10)}`;if(d.length===11&&d.startsWith('373'))return `+373 ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8)}`;if(d.length===11&&d.startsWith('40'))return `+40 ${d.slice(2,5)} ${d.slice(5,8)} ${d.slice(8)}`;if(d.length===10&&d.startsWith('0'))return `${d.slice(0,3)} ${d.slice(3,6)} ${d.slice(6,8)} ${d.slice(8)}`;return value};
 function resultHref(r){if(/^tel:/i.test(r.href||'')){const digits=String((r.phones||[])[0]||r.href.slice(4)).replace(/\D/g,'');if(digits.length<=5)return 'tel:'+digits;const international=digits.startsWith('380')||digits.startsWith('373')?digits:digits.startsWith('0')&&digits.length===10?'380'+digits.slice(1):digits;return 'tel:+'+international}return r.href||health.href+'#contact/'+encodeURIComponent(r.id)}
 let data,extra,schedule,live,pending,expanded=false,showAll=false;
 function position(){if(panel.hidden)return;const r=input.closest('.search-wrap').getBoundingClientRect();const viewport=window.visualViewport;const viewportBottom=(viewport?viewport.height+viewport.offsetTop:innerHeight);const nav=document.querySelector('.bottom');const navTop=nav?nav.getBoundingClientRect().top:viewportBottom;const bottom=Math.min(viewportBottom,navTop-12);panel.style.left=r.left+'px';panel.style.top=(r.bottom+8)+'px';panel.style.width=r.width+'px';panel.style.maxHeight=Math.max(0,bottom-r.bottom-8)+'px'}
 function matches(r,q){const phones=Array.isArray(r.phones)?r.phones:[];const ids=Array.isArray(r.categories)?r.categories:[r.category];const cats=ids.map(id=>data.categories.find(c=>c.id===id)?.name||'');const hay=norm([r.name,r.note,r.specialties,r.keywords,r.meta,r.city,r.category,...Object.values(r.categoryDetails||{}).flatMap(x=>[x.name,x.note,x.specialties]),...cats,...phones].join(' '));const digits=q.replace(/\D/g,'').replace(/^38(?=0)/,'');return norm(q).split(' ').every(t=>hay.includes(t))||(digits.length>=3&&phones.some(p=>p.replace(/\D/g,'').replace(/^380/,'0').includes(digits)))}
 function syncToggle(){if(!toggle)return;toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Закрыть поиск':'Открыть поиск')}
 function close(clear=true){expanded=false;showAll=false;if(clear)input.value='';input.blur();syncToggle();render()}
 function resetForHome(){if(input.value.trim()||expanded||!panel.hidden)close(true)}
 function render(){
  const q=input.value.trim(),terms=norm(q).split(' ');
  const sections=cards.filter(c=>terms.every(t=>norm(c.dataset.title+' '+c.dataset.search).includes(t)));
  cards.forEach(c=>c.style.display=!q||sections.includes(c)?'':'none');
  panel.hidden=!q||!expanded;input.setAttribute('aria-expanded',String(!!q&&expanded));syncToggle();if(!q||!expanded)return;
  if(!data||!extra||!schedule||!live){panel.innerHTML='<p role="status">Загружаем всю базу…</p>';position();load();return}
  const found=[...data.records,...extra.records,...schedule.records,...live.records].filter(r=>matches(r,q));
  const seen=new Set();const results=found.filter(r=>{const phones=Array.isArray(r.phones)?r.phones:[];const k=norm(r.name)+'|'+(r.city||'')+'|'+(phones.length?[...phones].sort().join(','):r.href||'');if(seen.has(k))return false;seen.add(k);return true});
  panel.innerHTML='<div class="directory-result-heading"><span role="status">Найдено: '+results.length+'</span><button type="button" data-clear-search aria-label="Очистить поиск">×</button></div>'+
   results.slice(0,showAll?results.length:20).map(r=>{const phones=Array.isArray(r.phones)?r.phones:[];const alias=Object.entries(r.categoryDetails||{}).find(([id,d])=>{const c=data.categories.find(c=>c.id===id);return norm([d.name,d.note,d.specialties,c?.name].join(' ')).split(' ').filter(Boolean).every(t=>terms.includes(t))});const c=data.categories.find(c=>c.id===(alias?.[0]||r.category));const name=alias?.[1].name||r.name;const target=resultHref(r)+(alias&&!/^tel:/i.test(r.href||'')?'/service/'+encodeURIComponent(alias[0]):'');const category=r.route?r.category:(alias?.[1].specialties||r.specialties||c?.name);const details=phones.length?phones.map(p=>'<span>'+esc(formatPhone(p))+'</span>').join(''):'<span>'+(r.kind==='schedule'?'Открыть расписание':'Открыть раздел')+'</span>';return '<a class="directory-result" href="'+esc(target)+'"><strong>'+esc(name)+'</strong><span>'+esc(r.city||'')+(r.city&&category?' · ':'')+esc(category||'')+'</span><small>'+details+'</small></a>'}).join('')+
   (results.length>20&&!showAll?'<button type="button" class="directory-all" data-show-all>Показать все результаты ('+results.length+')</button>':'')+
   sections.map(c=>{const url=c.dataset.nav;return url?'<a class="directory-result directory-section" href="'+esc(url)+'">Раздел: '+esc(c.dataset.title)+'</a>':''}).join('')+
   (!results.length&&!sections.some(c=>c.dataset.nav)?'<p>Ничего не найдено. Попробуйте имя, специальность, город или номер.</p>':'');
  position();
 }
 function load(){if(data&&extra&&schedule&&live)return Promise.resolve();if(pending)return pending;pending=Promise.all([fetch(new URL('data.json?v=20261008-2',health),{cache:'no-cache'}),fetch(new URL('pharmacies.json?v=20261008-1',health),{cache:'no-cache'}),fetch(new URL('directory-search-extra.json?v=20261005-1',root),{cache:'no-cache'}),fetch(new URL('schedule-search.json?v=20261005-2',transport),{cache:'no-cache'}),fetch(new URL('bessarabia-online/search.json?v=2',root),{cache:'no-cache'})]).then(rs=>{if(rs.some(r=>!r.ok))throw Error('directory');return Promise.all(rs.map(r=>r.json()))}).then(([d,p,x,s,l])=>{data={...d,sources:{...d.sources,...p.sources},categories:[...d.categories,...p.categories],records:[...d.records,...p.records]};extra=x;schedule={records:(s.records||[]).map((r,index)=>({id:'schedule-'+index,name:r.title,city:'',category:'Расписание транспорта',specialties:r.meta,keywords:r.keywords,phones:[],href:new URL(r.href,transport).href,route:'/transport/',kind:'schedule'}))};live={records:(l.records||[]).map(r=>({...r,href:new URL(r.href,root).href,route:r.href}))};pending=null;render()}).catch(()=>{pending=null;if(!input.value.trim())return;panel.innerHTML='<p>Не удалось загрузить базу.</p><button type="button" data-retry-search>Повторить</button>';position()});return pending}
 input.addEventListener('focus',()=>{expanded=true;syncToggle();load()});input.addEventListener('input',()=>{expanded=true;render()});
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Enter'&&input.value.trim()){e.preventDefault();input.blur()}});
 toggle?.addEventListener('pointerdown',e=>e.preventDefault());
 toggle?.addEventListener('click',()=>{if(expanded){close();return}expanded=true;syncToggle();input.focus({preventScroll:true});render()});
 clearButton?.addEventListener('click',()=>close(true));
 window.addEventListener('izmail:home',resetForHome);
 window.addEventListener('izmail:refresh',resetForHome);
 window.addEventListener('pageshow',resetForHome);
 panel.addEventListener('click',e=>{if(e.target.closest('[data-clear-search]'))close();if(e.target.closest('[data-show-all]')){showAll=true;render()}if(e.target.closest('[data-retry-search]')){panel.innerHTML='<p>Загружаем контакты…</p>';load()}});
 addEventListener('resize',position);addEventListener('scroll',position,{passive:true});window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
})();
