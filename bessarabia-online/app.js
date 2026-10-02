(()=>{
  const ferryIcon='<path d="M4 11h16l-2 7H6zM7 11V6h10v5M9 6V3h6v3M3 20c2 0 2 1 4 1s2-1 4-1 2 1 4 1 2-1 4-1 2 1 2 1"/>';
  const sectionId=new URLSearchParams(location.search).get('section')||'border';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const phone=value=>{const d=String(value).replace(/\D/g,'');if(d.length===12&&d.startsWith('380'))return `+380 ${d.slice(3,5)} ${d.slice(5,8)} ${d.slice(8,10)} ${d.slice(10)}`;return value};
  function render(data){
    const section=data.sections[sectionId];if(!section)throw Error('Неизвестный раздел');
    document.title=section.title+' — Справочник Измаил';
    document.getElementById('title').textContent=section.title;document.getElementById('subtitle').textContent=section.subtitle;
    document.getElementById('symbol').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${ferryIcon}</svg>`;
    const updated=new Date(data.updatedAt);document.getElementById('updated').textContent='Обновлено '+updated.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    document.getElementById('cards').innerHTML=section.cards.map(card=>`<article class="card contact"><h3>${esc(card.title)}</h3>${card.status?`<p class="card-status">${esc(card.status)}</p>`:''}${card.details?.length?`<ul class="details">${card.details.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:''}${card.phones?.length?`<div class="phones">${card.phones.map(number=>`<a class="phone" href="tel:${esc(number)}"><strong>${esc(phone(number))}</strong><span>Позвонить</span></a>`).join('')}</div>`:''}${card.actions?.length?`<div class="actions">${card.actions.map(action=>`<a class="action" href="${esc(action.href)}" target="_blank" rel="noopener">${esc(action.label)} ↗</a>`).join('')}</div>`:''}</article>`).join('');
    const mapPanel=document.getElementById('mapPanel');
    mapPanel.hidden=!section.map;
    if(section.map){document.getElementById('mapTitle').textContent=section.map.title;document.getElementById('mapDescription').textContent=section.map.description;document.getElementById('mapFrame').src=section.map.embed}
    document.querySelectorAll('[data-section-back]').forEach(link=>{link.href='../transport/';link.querySelector('span:last-child').textContent='Вернуться: транспорт'});
  }
  document.addEventListener('pointerdown',event=>{const item=event.target.closest('a,button');if(!item)return;item.classList.add('tap-lit');setTimeout(()=>item.classList.remove('tap-lit'),420)},{passive:true});
  fetch('./data.json?v=2',{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error();return response.json()}).then(render).catch(()=>{document.getElementById('cards').innerHTML='<p class="error">Не удалось загрузить данные. Обновите страницу или повторите позже.</p>'});
})();
