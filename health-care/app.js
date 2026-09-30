(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const branches = {doctors:'Врачи и здоровье',beauty:'Красота и уход',education:'Образование и развитие'};
  let data;
  const savedKey='izmail.health.favorites.v1';
  const readSaved=()=>{try{const x=JSON.parse(localStorage.getItem(savedKey)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[])}catch{return new Set()}};
  let saved=readSaved();
  const favoriteKey=(r,p)=>JSON.stringify([r.favoriteName||r.name,p]);
  const cityNames=r=>r.city.split(' / ');
  const cities=()=>data.cityOrder;
  const cityImages={'Измаил':'izmail','Килия':'kiliia','Болград':'bolhrad','Рени':'reni','Одесса':'odesa','Киев':'kyiv'};
  const citySearch={'Измаил':'Измаилу','Килия':'Килии','Болград':'Болграду','Рени':'Рени','Одесса':'Одессе','Киев':'Киеву'};
  const categoryFor=r=>r.category==='96319'?(/Поликлиника/.test(r.name)?'96228':'96229'):r.category;
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
    const categoryId=parts[0]==='category'?parts[1]:parts[0]==='city'&&parts[2]==='category'?parts[3]:parts[0]==='contact'&&parts[2]==='service'?parts[3]:null;
    let category=data.categories.find(c=>c.id===(contact&&categoryId&&categoriesFor(contact).includes(categoryId)?categoryId:contact?.category||categoryId));
    let cityName=parts[0]==='city'&&cities().includes(parts[1])?parts[1]:null;
    if(category?.id==='96319'){category=null;cityName=cityName||'Килия'}
    const branch=category?.branch || (cityName?'doctors':branches[parts[0]]?parts[0]:null);
    if(contact)cityName=cityNames(contact)[0];
    if(category?.branch==='doctors'&&!cityName)cityName='Измаил';
    return {category,cityName,branch,contactId:contact?.id,globalSearch,query:parts[1]||'',favorites:parts[0]==='favorites'};
  };
  const homeLink = '<a class="back-btn" href="../main-v2/">Вернуться в главное меню</a>';
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
  function branchCover(id){const file=id==='doctors'?'doctors-cover.jpg':id==='beauty'?'beauty-cover.jpg':'cover-96203.jpg';return '<div class="visual generated-cover"><img src="media/'+file+'" alt="Справочник Измаил — '+branches[id]+'" width="960" height="640" draggable="false"></div>'}
  function cityTabs(city,q=''){const options=cities(),tab=c=>'<a class="city-tab" href="'+cityHref(c)+'" '+(city===c?'aria-current="true"':'')+'><img src="media/city-'+cityImages[c]+'.jpg" alt="" width="330" height="220"><span>'+escape(c)+'</span></a>';const picker=city?'<div class="city-selection">'+tab(city)+'<button id="cityListToggle" type="button" aria-expanded="'+String(cityListOpen)+'">'+(cityListOpen?'Скрыть города ↑':'Другие города ↓')+'</button></div>':'';const others=city?options.filter(c=>c!==city):options;return '<h2 class="city-heading">'+(city?'Выбран город: '+escape(city):'Выберите город')+'</h2>'+picker+'<nav class="city-tabs" aria-label="Город приёма" '+(city&&!cityListOpen?'hidden':'')+'>'+(city&&!cityListOpen?'':others.map(tab).join(''))+'</nav>'+(city==='Измаил'?'<a class="city-vet veterinary chip" href="'+cityHref(city)+'/category/20125"><span aria-hidden="true">🐾</span> Ветеринары Измаила</a>':'')}
  function reviewPanel(r){if(!r.review)return '';const v=r.review;return '<details class="reviews"><summary>Отзывы <span class="review-hide">· скрыть</span></summary><p>'+escape(v.summary)+'</p><small>'+escape(v.label)+' · '+escape(v.checked)+'</small><a href="'+escape(v.url)+'" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></details>'}
  function thumb(c,city) {
    const cover=c;
    const url=cover.media[0]?.src+(c.id==='96211'?'?v=2':'');
    return url?`<div class="visual"><img class="visual-backdrop" src="${escape(url)}" alt="" loading="lazy" aria-hidden="true"><img src="${escape(url)}" alt="" loading="lazy" width="320" height="216"></div>`:'';
  }
  function tile(c,city,noPhoto=true) {
    const count=data.records.filter(r=>categoriesFor(r).includes(c.id)&&(!city||isInCity(r,city))).length;
    const media=noPhoto?'':thumb(c,city);
    return `<a class="category-tile ${c.children?.length?'has-children':'direct-entry'} ${noPhoto?'plain-tile':''} ${c.id==='20125'?'veterinary':''} ${count?'':'empty-category'}" href="${categoryHref(c,city)}">${media}<span class="tile-body"><strong>${escape(c.id==='20125'?'Ветеринары':c.name)}</strong><small>${count?count+' контактов':'Контакты пока не найдены'}</small></span>${noPhoto?'<span class="tile-arrow" aria-hidden="true">›</span>':''}</a>`;
  }
  function cards(records) {
    return '<div class="contact-list">'+records.map(original=>{
      const current=route(),detailsByCategory=original.categoryDetails||{},searchTerms=norm($('search').value).split(' ').filter(Boolean);
      const context=Object.entries(detailsByCategory).find(([id,details])=>{const category=data.categories.find(c=>c.id===id);const text=norm([details.name,details.note,details.specialties,category?.name].join(' '));return current.category?.id===id||(current.branch==='education'&&searchTerms.length&&searchTerms.every(term=>text.includes(term)))});
      const details=current.category?detailsByCategory[current.category.id]:context?.[1];
      const r=details?{...original,...details,favoriteName:original.favoriteName||original.name}:original;
      const c=data.categories.find(c=>c.id===categoryFor(r));
      const phoneLabel=String(r.phoneLabel||'').trim();
      return `<article class="contact" data-record="${r.id}"><div class="contact-top"><span class="location ${r.city==='Измаил'?'':'other-city'}">⌖ ${escape(r.city)}</span></div><p class="specialty">${escape(r.specialties||(c.id==='20125'?'Ветеринары':c.name))}</p><h2>${escape(r.name)}</h2>${r.note?`<details class="contact-description"><summary>Подробнее</summary><p class="description">${escape(r.note)}</p></details>`:''}${phoneLabel?`<p class="phone-label">${escape(phoneLabel)}</p>`:''}${r.phones.map(p=>`<div class="phone-row"><a class="phone-number" href="tel:${dial(p)}">${fmt(p)}</a>${r.phoneNotes?.[p]?`<small class="phone-label">${escape(r.phoneNotes[p])}</small>`:''}<div class="phone-actions"><a class="call" href="tel:${dial(p)}" aria-label="Позвонить ${escape(r.name)}: ${fmt(p)}">☎ Позвонить</a>${favoriteButton(r,p)}</div></div>`).join('')}${reviewPanel(r)}</article>`;
    }).join('')+'</div>';
  }
  function media(c,city) {return '<section class="profile-banner">'+thumb(c,city)+'</section>'}
  let shellKey,searchOpen=false,cityListOpen=false;
  function matched(r,q) {
    const text=norm([r.name,r.note,r.city,r.specialties,...Object.values(r.categoryDetails||{}).flatMap(x=>[x.name,x.note,x.specialties]),...categoriesFor(r).map(id=>data.categories.find(c=>c.id===id).name),...r.phones].join(' '));
    const terms=norm(q).split(' ').filter(Boolean);
    const digits=q.replace(/\D/g,'').replace(/^38(?=0)/,'');
    return terms.every(t=>text.includes(t)) || (digits.length>=3 && r.phones.some(p=>p.includes(digits)));
  }
  function render() {
    if(!data)return;
    const {category,branch,cityName,favorites,globalSearch,query,contactId}=route();
    let q=$('search').value.trim();
    document.body.dataset.education=String(branch==='education');
    document.body.dataset.doctors=String(branch==='doctors'&&!category);
    document.body.dataset.cityPicker=String(branch==='doctors'&&!cityName&&!q);
    document.body.dataset.view=globalSearch?'search':category?'category':branch?'branch':'home';
    const key=[category?.id,cityName,branch,favorites,globalSearch,contactId,globalSearch?query:''].join('|');
    if(shellKey!==key){
      shellKey=key;
      if(globalSearch){$('search').value=query;q=query}
      const title=globalSearch?'Поиск по справочнику':category?(category.id==='20125'?'Ветеринары':category.name):favorites?'Избранное':branches[branch]||'Здоровье и уход';
      $('title').textContent=title;document.title=title+(cityName?' · '+cityName:' · Измаил');
      const back=favorites||globalSearch?'':category?'<a class="back-btn secondary" href="'+(category.parent?'#category/'+category.parent:branch==='doctors'?cityHref(cityName):branch==='beauty'?'#beauty':branch==='education'?'#education':'#')+'">Вернуться в раздел</a>':branch?'<a class="back-btn secondary" href="#">Вернуться в раздел</a>':'';
      $('topNav').innerHTML=back+homeLink;$('bottomNav').innerHTML=back+homeLink;
      $('cityNavigation').innerHTML='';
      $('cityNavigation').hidden=branch!=='doctors';
      $('profileMedia').innerHTML=category?media(category,cityName):branch?'<section class="profile-banner">'+branchCover(branch)+'</section>':'';
      const phoneFolder=Boolean(category&&!category.children&&data.records.some(r=>categoriesFor(r).includes(category.id)));
      document.querySelector('.finder').hidden=(!branch&&!favorites&&!globalSearch)||phoneFolder||branch==='education'||Boolean(contactId)||favorites;
      $('search').placeholder=branch==='doctors'?(cityName?'Поиск врачей по '+citySearch[cityName]:'Поиск врачей'):branch==='education'?'Предмет, имя или телефон':'Специальность, имя или телефон';
    }
    $('search').setAttribute('aria-label',$('search').placeholder);
    $('searchToggle').setAttribute('aria-expanded',String(searchOpen));
    $('searchToggle').setAttribute('aria-label',searchOpen?'Закрыть поиск':'Открыть поиск');
    $('clear').hidden=!q;
    if(branch==='doctors')$('cityNavigation').innerHTML=cityTabs(cityName,q);
    if(branch==='doctors'&&!cityName&&!q){
      $('resultStatus').textContent='';
      $('content').innerHTML='';
      return;
    }
    let scope=data.records.filter(r=>(!branch||category||categoriesFor(r).some(id=>data.categories.find(c=>c.id===id)?.branch===branch))&&(!category||categoriesFor(r).includes(category.id))&&(!contactId||r.id===contactId)&&(!cityName||isInCity(r,cityName))&&(branch!=='doctors'||cityName||cities().some(city=>isInCity(r,city))));
    if(favorites){const seen=new Set();scope=scope.map(r=>({...r,phones:r.phones.filter(p=>{const k=favoriteKey(r,p);if(!saved.has(k)||seen.has(k))return false;seen.add(k);return true})})).filter(r=>r.phones.length)}
    if(q){
      const found=scope.filter(r=>matched(r,q));
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+'Найдено: '+found.length;
      $('content').innerHTML=found.length?cards(found):'<p class="empty"><strong>Ничего не найдено</strong>Попробуйте другую специальность, имя или город.</p>';
    }else if(category?.children&&!contactId){
      const children=category.children.map(id=>data.categories.find(c=>c.id===id));
      $('resultStatus').textContent=children.length+' категорий';
      $('content').innerHTML='<div class="category-grid">'+children.map(c=>tile(c,null,true)).join('')+'</div>';
    }else if(category||favorites||globalSearch||contactId){
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+scope.length+' контактов';
      const sorted=scope.slice().sort((a,b)=>(data.sources[b.source].kind==='official')-(data.sources[a.source].kind==='official'));
      $('content').innerHTML=(category?.note?'<p class="empty">'+escape(category.note)+'</p>':'')+(scope.length?cards(sorted):favorites?'<div class="empty"><strong>Пока нет избранных номеров</strong>Нажмите ☆ рядом с номером, чтобы сохранить его здесь.</div>':'<div class="empty"><strong>Контакты пока не найдены</strong>В этой категории пока нет опубликованных контактов.</div>');
    }else if(branch){
      const cats=data.categories.filter(c=>c.branch===branch&&!c.parent&&!['96319','96323'].includes(c.id));
      const local=c=>data.records.some(r=>categoriesFor(r).includes(c.id)&&cityNames(r).includes(cityName));
      const available=branch==='doctors'&&cityName!=='Измаил'?cats.filter(local):cats;
      $('resultStatus').textContent=(cityName?cityName+' · ':'')+available.length+' категорий';
      if(branch==='beauty'||branch==='education')$('content').innerHTML='<div class="category-grid">'+available.map(c=>tile(c,null,true)).join('')+'</div>';
      else $('content').innerHTML=groups.map(([title,ids])=>{const members=ids.map(id=>available.find(c=>c.id===id)).filter(Boolean);return members.length?'<h2 class="group-title">'+title+'</h2><div class="category-grid">'+members.map(c=>tile(c,cityName)).join('')+'</div>':''}).join('')||'<div class="empty"><strong>Список этого города готовится</strong>Пока нет подтверждённых местных контактов.</div>';
    }else{
      $('resultStatus').textContent='Три направления';
      $('content').innerHTML='<div class="branches">'+[['doctors','Врачи · Клиники · Диагностика · Ветеринары'],['beauty','Маникюр · Волосы · Брови · Уход']].map(([id,desc])=>'<a class="branch-card plain-branch has-children '+id+'" href="#'+id+'"><div class="branch-copy"><h2>'+branches[id]+'</h2><p>'+desc+'</p><span class="tile-arrow" aria-hidden="true">›</span></div></a>').join('')+(()=>{const c=data.categories.find(c=>c.id==='96211');return '<a class="branch-card plain-branch direct-entry care" href="#category/96211"><div class="branch-copy"><h2>'+escape(c.name)+'</h2><p>Сиделки · Няни · Пансионат</p><span class="tile-arrow" aria-hidden="true">›</span></div></a>'})()+'</div>';
    }
  }
  document.addEventListener('dragstart',event=>{if(event.target.closest('.branch-card,.category-tile,.city-tab'))event.preventDefault()});
  document.addEventListener('contextmenu',event=>{if(event.target.closest('.branch-card,.category-tile,.city-tab'))event.preventDefault()});
  $('search').addEventListener('focus',()=>{searchOpen=true;render()});
  $('search').addEventListener('input',render);
  $('search').addEventListener('search',()=>{searchOpen=false;$('search').blur();render()});
  $('search').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();searchOpen=false;$('search').blur();render()}if(event.key==='Escape'){event.preventDefault();searchOpen=false;$('search').value='';$('search').blur();render()}});
  $('searchToggle').addEventListener('pointerdown',event=>event.preventDefault());
  $('searchToggle').addEventListener('click',()=>{if(searchOpen){searchOpen=false;$('search').value='';$('search').blur();render();return}searchOpen=true;$('search').focus({preventScroll:true});render()});
  $('clear').addEventListener('click',()=>{searchOpen=false;$('search').value='';$('search').blur();render()});
  document.addEventListener('click',event=>{
    const cityListToggle=event.target.closest('#cityListToggle');
    if(cityListToggle){cityListOpen=!cityListOpen;render();return}
    const city=event.target.closest('a.city-tab');
    if(city&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
      event.preventDefault();
      cityListOpen=false;
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
  window.addEventListener('hashchange',()=>{document.querySelector('.page').style.minHeight='';searchOpen=false;cityListOpen=false;$('search').value='';$('search').blur();render();window.scrollTo(0,0);$('title').focus({preventScroll:true})});
  try{const response=await fetch('data.json?v=20260930-14',{cache:'no-cache'});if(!response.ok)throw Error();data=await response.json();render()}
  catch{$('content').innerHTML='<p class="empty error">Не удалось загрузить контакты. Проверьте соединение и обновите страницу.</p>'; $('topNav').innerHTML=homeLink;$('bottomNav').innerHTML=homeLink;}
})();
