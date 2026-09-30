(function(){
 'use strict';
 const input=document.getElementById('directorySearch');if(!input)return;
 const root=new URL('./',document.currentScript.src),health=new URL('health-care/',root);
 const panel=document.createElement('section');panel.id='directoryResults';panel.hidden=true;panel.setAttribute('aria-label','Результаты поиска по справочнику');document.body.append(panel);
 input.setAttribute('aria-controls',panel.id);input.setAttribute('aria-expanded','false');
 const cards=[...document.querySelectorAll('.cards .card')];
 const norm=v=>String(v||'').toLocaleLowerCase().replace(/[ёє]/g,'е').replace(/[ії]/g,'и').replace(/[’'`]/g,'').replace(/\s+/g,' ').trim();
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data,pending;
 function position(){if(panel.hidden)return;const r=input.closest('.search-wrap').getBoundingClientRect();const viewport=window.visualViewport;const bottom=(viewport?viewport.height+viewport.offsetTop:innerHeight);panel.style.left=r.left+'px';panel.style.top=(r.bottom+8)+'px';panel.style.width=r.width+'px';panel.style.maxHeight=Math.max(120,bottom-r.bottom-20)+'px'}
 function matches(r,q){const cats=(r.categories||[r.category]).map(id=>data.categories.find(c=>c.id===id)?.name||'');const hay=norm([r.name,r.note,r.specialties,r.city,...cats,...r.phones].join(' '));const digits=q.replace(/\D/g,'').replace(/^38(?=0)/,'');return norm(q).split(' ').every(t=>hay.includes(t))||(digits.length>=3&&r.phones.some(p=>p.includes(digits)))}
 function close(){input.value='';render();input.focus({preventScroll:true})}
 function render(){
  const q=input.value.trim(),terms=norm(q).split(' ');
  const sections=cards.filter(c=>terms.every(t=>norm(c.dataset.title+' '+c.dataset.search).includes(t)));
  cards.forEach(c=>c.style.display=!q||sections.includes(c)?'':'none');
  panel.hidden=!q;input.setAttribute('aria-expanded',String(!!q));if(!q)return;
  if(!data){panel.innerHTML='<p role="status">Загружаем контакты…</p>';position();load();return}
  const found=data.records.filter(r=>matches(r,q));
  const seen=new Set();const results=found.filter(r=>{const k=norm(r.name)+'|'+r.city+'|'+[...r.phones].sort().join(',');if(seen.has(k))return false;seen.add(k);return true});
  panel.innerHTML='<div class="directory-result-heading"><span role="status">Контактов: '+results.length+'</span><button type="button" data-clear-search aria-label="Очистить поиск">×</button></div>'+
   results.slice(0,20).map(r=>{const c=data.categories.find(c=>c.id===r.category);return '<a class="directory-result" href="'+health.href+'#contact/'+encodeURIComponent(r.id)+'"><strong>'+esc(r.name)+'</strong><span>'+esc(r.city)+' · '+esc(r.specialties||c?.name)+'</span><small>'+r.phones.map(p=>esc(p.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/,'$1 $2 $3 $4'))).join(' · ')+'</small></a>'}).join('')+
   (results.length>20?'<a class="directory-all" href="'+health.href+'#search/'+encodeURIComponent(q)+'">Показать все результаты ('+results.length+')</a>':'')+
   sections.map(c=>{const url=c.dataset.nav;return url?'<a class="directory-result directory-section" href="'+esc(url)+'">Раздел: '+esc(c.dataset.title)+'</a>':''}).join('')+
   (!results.length&&!sections.some(c=>c.dataset.nav)?'<p>Ничего не найдено. Попробуйте имя, специальность, город или номер.</p>':'');
  position();
 }
 function load(){if(data||pending)return pending;pending=fetch(new URL('data.json?v=20260930-8',health),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('contacts');return r.json()}).then(d=>{data=d;pending=null;render()}).catch(()=>{pending=null;if(!input.value.trim())return;panel.innerHTML='<p>Не удалось загрузить контакты.</p><button type="button" data-retry-search>Повторить</button>';position()});return pending}
 input.addEventListener('focus',load);input.addEventListener('input',render);
 input.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Enter'&&input.value.trim()){e.preventDefault();location.assign(health.href+'#search/'+encodeURIComponent(input.value.trim()))}});
 panel.addEventListener('click',e=>{if(e.target.closest('[data-clear-search]'))close();if(e.target.closest('[data-retry-search]')){panel.innerHTML='<p>Загружаем контакты…</p>';load()}});
 addEventListener('resize',position);addEventListener('scroll',position,{passive:true});window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
})();
