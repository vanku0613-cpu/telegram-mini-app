(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const branches = {doctors:'Врачи и здоровье',beauty:'Красота и уход'};
  let data;
  const savedKey='izmail.health.favorites.v1';
  const readSaved=()=>{try{const x=JSON.parse(localStorage.getItem(savedKey)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[])}catch{return new Set()}};
  let saved=readSaved();
  const favoriteKey=(r,p)=>JSON.stringify([r.favoriteName||r.name,p]);
  const cityNames=r=>r.city.split(' / ');
  const cities=()=>data.cityOrder;
  const categoryFor=r=>r.category==='96319'?(/Поликлиника/.test(r.name)?'96228':'96229'):r.category==='96323'?'20125':r.category;
  const categoriesFor=r=>r.categories||[categoryFor(r)];
  const cityHref=city=>'#city/'+encodeURIComponent(city);
  const categoryHref=(c,city)=>c.branch==='doctors'?cityHref(city||'Измаил')+'/category/'+c.id:'#category/'+c.id;
  const isInCity=(r,city)=>cityNames(r).includes(city)||r.city==='Украина';
  function favoriteButton(r,p){const key=favoriteKey(r,p),active=saved.has(key);return '<button type="button" class="favorite-toggle" data-favorite="'+escape(key)+'" aria-pressed="'+active+'" aria-label="'+(active?'Убрать из избранного':'Добавить в избранное')+': '+escape(r.name)+' '+fmt(p)+'" title="'+(active?'Убрать из избранного':'Добавить в избранное')+'">'+(active?'★':'☆')+'</button>'}
  function syncFavorites(){document.querySelectorAll('[data-favorite]').forEach(b=>{const active=saved.has(b.dataset.favorite),label=active?'Убрать из избранного':'Добавить в избранное';b.setAttribute('aria-pressed',String(active));b.textContent=active?'★':'☆';b.setAttribute('aria-label',label+': '+JSON.parse(b.dataset.favorite).join(' '));b.title=label})}

  const norm = value => String(value).toLocaleLowerCase().replace(/[ёє]/g,'е').replace(/[ії]/g,'и').replace(/[’'`]/g,'').replace(/\s+/g,' ').trim();
  const fmt = p => p.length === 10 ? p.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/,'$1 $2 $3 $4') : p;
  const dial = p => p.length === 10 ? '+38'+p : p;
  const route = () => {
    let parts;try{parts=location.hash.slice(1).split('/').map(decodeURIComponent)}catch{parts=[]}
    const contactId=parts[0]==='contact'?parts[1]:null;
    const contact=data.records.find(r=>r.id===contactId);
    const globalSearch=parts[0]==='search';
    const categoryId=parts[0]==='category'?parts[1]:parts[0]==='city'&&parts[2]==='category'?parts[3]:null;
    let category=data.categories.find(c=>c.id===(contact?.category||categoryId));
    let cityName=parts[0]==='city'&&cities().includes(parts[1])?parts[1]:null;
    if(category?.id==='96323'){category=data.categories.find(c=>c.id==='20125');cityName='Татарбунары'}
    if(category?.id==='96319'){category=null;cityName=cityName||'Килия'}
    const branch=category?.branch || (cityName?'doctors':branches[parts[0]]?parts[0]:null);
    if(contact)cityName=cityNames(contact)[0];
    if(category?.branch==='doctors'&&!cityName)cityName='Измаил';
    return {category,cityName,branch,contactId:contact?.id,globalSearch,query:parts[1]||'',favorites:parts[0]==='favorites'};
  };
  const homeLink = '<a class="back-btn" href="../main-v2/">⌂ Вернуться в главное меню</a>';
  const groups = [
    ['С чего начать',['96228','96229','96230','96231']],
    ['Диагностика и анализы',['96246','96248','ct','lab','functional','xray']],
    ['Хирургия и восстановление',['96259','96260','96261','96262','96263','palliative','sports']],
    ['Сердце и сосуды',['96264','96269','96274']],
    ['Нервная система и психология',['96275','96282','96283','96284','96315']],
    ['Зрение, слух и речь',['96285','96288','96289','96291']],
    ['Женское и мужское здоровье',['96292','96293','96294','96295','96296']],
    ['Кожа и волосы',['96297','96299','96300','96301']],
    ['Внутренние органы',['96304','96305','96306','96307','96309']],
    ['Иммунитет и инфекции',['96310','96311','96312','phthis','trust']],
    ['Другие специалисты',['96313','96314','96318']],
    ['Ветеринарная помощь',['20125']]
  ];
  function branchCover(id){return '<div class="branch-visual"><span class="cover-brand">СПРАВОЧНИК ИЗМАИЛ</span><strong class="cover-title">'+branches[id]+'</strong><img src="media/'+(id==='doctors'?'doctor':'beauty')+'-photo.jpg" alt="" width="320" height="216"></div>'}
  function cityTabs(city,q=''){const options=cities().filter(c=>city||norm(c).includes(norm(q)));return '<h2 class="city-heading">Выберите город</h2><nav class="city-tabs" aria-label="Город приёма">'+options.map(c=>'<a class="city-tab" href="'+cityHref(c)+'" '+(city===c?'aria-current="true"':'')+'>'+escape(c)+'</a>').join('')+'</nav>'+(city==='Измаил'?'<a class="city-vet veterinary chip" href="'+cityHref(city)+'/category/20125"><span aria-hidden="true">🐾</span> Ветеринары Измаила</a>':'')}
  function reviewPanel(r){if(!r.review)return '';const v=r.review;return '<details class="reviews"><summary>Отзывы <span class="review-hide">· скрыть</span></summary><p>'+escape(v.summary)+'</p><small>'+escape(v.label)+' · '+escape(v.checked)+'</small><a href="'+escape(v.url)+'" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></details>'}
  function thumb(c,city) {
    const cover=c.id==='20125'&&city==='Татарбунары'?data.categories.find(x=>x.id==='96323'):c;
    const url=cover.media[0]?.src;
    return url?`<div class="visual"><img class="visual-backdrop" src="${escape(url)}" alt="" loading="lazy" aria-hidden="true"><img src="${escape(url)}" alt="" loading="lazy" width="320" height="216"></div>`:'';
  }
  function tile(c,city) {
    const count=data.records.filter(r=>categoriesFor(r).includes(c.id)&&(!city||isInCity(r,city))).length;
    return `<a class="category-tile ${c.id==='20125'?'veterinary':''} ${count?'':'empty-category'}" href="${categoryHref(c,city)}">${thumb(c,city)}<span class="tile-body"><strong>${escape(c.id==='20125'?'Ветеринары':c.name)}</strong><small>${count?count+' контактов':'Контакты пока не найдены'} <span aria-hidden="true">›</span></small></span></a>`;
  }
  function cards(records) {
    return '<div class="contact-list">'+records.map(r=>{
      const c=data.categories.find(c=>c.id===categoryFor(r));
      return `<article class="contact" data-record="${r.id}"><div class="contact-top"><span class="location ${r.city==='Измаил'?'':'other-city'}">⌖ ${escape(r.city)}</span></div><p class="specialty">${escape(r.specialties||(c.id==='20125'?'Ветеринары':c.name))}</p><h2>${escape(r.name)}</h2>${r.note?`<details class="contact-description"><summary>Подробнее</summary><p class="description">${escape(r.note)}</p></details>`:''}<p class="phone-label">${escape(r.phoneLabel)}</p>${r.phones.map(p=>`<div class="phone-row"><a class="phone-number" href="tel:${dial(p)}">${fmt(p)}</a>${r.phoneNotes?.[p]?`<small class="phone-label">${escape(r.phoneNotes[p])}</small>`:''}<div class="phone-actions"><a class="call" href="tel:${dial(p)}" aria-label="Позвонить ${escape(r.name)}: ${fmt(p)}">☎ Позвонить</a>${favoriteButton(r,p)}</div></div>`).join('')}${reviewPanel(r)}</article>`;
    }).join('')+'</div>';
  }
  function media(c,city) {return '<section class="profile-banner">'+thumb(c,city)+'</section>'}
  let shellKey;
  function matched(r,q) {
    const text=norm([r.name,r.note,r.city,r.specialties,...categoriesFor(r).map(id=>data.categories.find(c=>c.id===id).name),...r.phones].join(' '));
    const terms=norm(q).split(' ').filter(Boolean);
    const digits=q.replace(/\D/g,'').replace(/^38(?=0)/,'');
    return terms.every(t=>text.includes(t)) || (digits.length>=3 && r.phones.some(p=>p.includes(digits)));
  }
  function render() {
    if(!data)return;
    const {category,branch,cityName,favorites,globalSearch,query,contactId}=route();
    let q=$('search').value.trim();
    document.body.dataset.view=globalSearch?'search':category?'category':branch?'branch':'home';
    const key=[category?.id,cityName,branch,favorites,globalSearch,contactId,globalSearch?query:''].join('|');
    if(shellKey!==key){
      shellKey=key;
      if(globalSearch){$('search').value=query;q=query}
      const title=globalSearch?'Поиск по справочнику':category?(category.id==='20125'?'Ветеринары':category.name):favorites?'Избранное':branches[branch]||'Здоровье и уход';
      $('title').textContent=title;document.title=title+(cityName?' · '+cityName:' · Измаил');
      const back=favorites||globalSearch||contactId||(branch==='doctors'&&!category)?'':category?'<a class="back-btn secondary" href="'+(branch==='doctors'?cityHref(cityName):'#beauty')+'">← Назад к категориям</a>':branch?'<a class="back-btn secondary" href="#">← Назад в раздел</a>':'';
      $('topNav').innerHTML=homeLink+back;$('bottomNav').innerHTML=homeLink+back;
      $('cityNavigation').innerHTML='';
      $('cityNavigation').hidden=branch!=='doctors';
      $('profileMedia').innerHTML=category?media(category,cityName):branch?'<section class="profile-banner">'+branchCover(branch)+'</section>':'';
      document.querySelector('.finder').hidden=!branch&&!favorites&&!globalSearch;
      $('search').placeholder=branch==='doctors'?(cityName?'Поиск: '+cityName:'Поиск города'):'Специальность, имя или телефон';
    }
    $('clear').hidden=!q;
    if(branch==='doctors')$('cityNavigation').innerHTML=cityTabs(cityName,q);
    if(branch==='doctors'&&!cityName){
      $('resultStatus').textContent='';
      $('content').innerHTML=cities().some(c=>norm(c).includes(norm(q)))?'':'<p class="empty"><strong>Город не найден</strong>Выберите город из списка или измените запрос.</p>';
      return;
    }
    let scope=data.records.filter(r=>(!branch||data.categories.find(c=>c.id===r.category).branch===branch)&&(!category||categoriesFor(r).includes(category.id))&&(!contactId||r.id===contactId)&&(!cityName||isInCity(r,cityName)));
    if(favorites){const seen=new Set();scope=scope.map(r=>({...r,phones:r.phones.filter(p=>{const k=favoriteKey(r,p);if(!saved.has(k)||seen.has(k))return false;seen.add(k);return true})})).filter(r=>r.phones.length)}
    if(q){
      const found=scope.filter(r=>matched(r,q));
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+'Найдено: '+found.length;
      $('content').innerHTML=found.length?cards(found):'<p class="empty"><strong>Ничего не найдено</strong>Попробуйте другую специальность, имя или город.</p>';
    }else if(category||favorites||globalSearch||contactId){
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+scope.length+' контактов';
      const sorted=scope.slice().sort((a,b)=>(data.sources[b.source].kind==='official')-(data.sources[a.source].kind==='official'));
      $('content').innerHTML=(category?.note?'<p class="empty">'+escape(category.note)+'</p>':'')+(scope.length?cards(sorted):favorites?'<div class="empty"><strong>Пока нет избранных номеров</strong>Нажмите ☆ рядом с номером, чтобы сохранить его здесь.</div>':'<div class="empty"><strong>Контакты пока не найдены</strong>Для этой специальности в выбранном городе пока нет проверенного публичного контакта.</div>');
    }else if(branch){
      const cats=data.categories.filter(c=>c.branch===branch&&!['96319','96323'].includes(c.id));
      const local=c=>data.records.some(r=>categoriesFor(r).includes(c.id)&&cityNames(r).includes(cityName));
      const available=branch==='doctors'&&cityName!=='Измаил'?cats.filter(local):cats;
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+available.length+' категорий';
      if(branch==='beauty')$('content').innerHTML='<div class="category-grid">'+available.map(c=>tile(c,null)).join('')+'</div>';
      else $('content').innerHTML=groups.map(([title,ids])=>{const members=ids.map(id=>available.find(c=>c.id===id)).filter(Boolean);return members.length?'<h2 class="group-title">'+title+'</h2><div class="category-grid">'+members.map(c=>tile(c,cityName)).join('')+'</div>':''}).join('')||'<div class="empty"><strong>Список этого города готовится</strong>Пока нет подтверждённых местных контактов.</div>';
    }else{
      $('resultStatus').textContent='Два направления';
      $('content').innerHTML='<div class="branches">'+[['doctors','Врачи · Клиники · Диагностика · Ветеринары'],['beauty','Маникюр · Волосы · Брови · Уход']].map(([id,desc])=>'<a class="branch-card '+id+'" href="#'+id+'">'+branchCover(id)+'<div class="branch-copy"><h2>'+branches[id]+'</h2><p>'+desc+'</p></div></a>').join('')+'</div>';
    }
  }
  $('search').addEventListener('input',render);
  $('clear').addEventListener('click',()=>{$('search').value='';render();$('search').focus()});
  document.addEventListener('click',event=>{
    const city=event.target.closest('a.city-tab');
    if(city&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
      event.preventDefault();
      const navigation=$('cityNavigation'),page=document.querySelector('.page');
      const top=navigation.getBoundingClientRect().top;
      // Keep short city lists from clamping scroll while the content is replaced.
      page.style.minHeight=document.documentElement.scrollHeight+'px';
      if(location.hash!==city.hash)history.pushState(null,'',city.getAttribute('href'));
      $('search').value='';render();
      const position=Math.max(0,window.scrollY+navigation.getBoundingClientRect().top-top);
      page.style.minHeight=(position+window.innerHeight)+'px';
      window.scrollTo({top:position,left:0,behavior:'instant'});
      navigation.querySelector('[aria-current="true"]')?.focus({preventScroll:true});
      return;
    }
    const button=event.target.closest('[data-favorite]');if(!button)return;
    const key=button.dataset.favorite,next=readSaved();const removing=next.has(key);
    if(removing)next.delete(key);else next.add(key);
    try{localStorage.setItem(savedKey,JSON.stringify([...next]));saved=next}catch{$('favoriteStatus').textContent='Не удалось сохранить. Разрешите хранение данных в браузере.';return}
    $('favoriteStatus').textContent=removing?'Номер убран из избранного':'Номер добавлен в избранное';
    if(route().favorites){render();$('title').focus({preventScroll:true})}else syncFavorites();
  });
  window.addEventListener('storage',event=>{if(event.key===savedKey||event.key===null){saved=readSaved();if(data&&route().favorites)render();else syncFavorites()}});
  document.addEventListener('pointerdown',event=>{const el=event.target.closest('a,button');if(el){el.classList.add('tap-lit');setTimeout(()=>el.classList.remove('tap-lit'),680)}},{passive:true});
  window.addEventListener('hashchange',()=>{document.querySelector('.page').style.minHeight='';$('search').value='';render();window.scrollTo(0,0);$('title').focus({preventScroll:true})});
  try{const response=await fetch('data.json?v=20260930-7',{cache:'no-cache'});if(!response.ok)throw Error();data=await response.json();render()}
  catch{$('content').innerHTML='<p class="empty error">Не удалось загрузить контакты. Проверьте соединение и обновите страницу.</p>'; $('topNav').innerHTML=homeLink;$('bottomNav').innerHTML=homeLink;}
})();
