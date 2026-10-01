(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const branches = {doctors:'Врачи и здоровье',beauty:'Красота и уход',education:'Образование и развитие'};
  let data,externalRecords=null,externalPending=null;
  const savedKey='izmail.health.favorites.v1';
  const readSaved=()=>{try{const x=JSON.parse(localStorage.getItem(savedKey)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[])}catch{return new Set()}};
  const readLocalFavoriteCatalog=()=>{try{const x=JSON.parse(localStorage.getItem('izmail.favorites.catalog.v1')||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?Object.values(x).filter(r=>r&&typeof r.name==='string'&&Array.isArray(r.phones)):[]}catch{return []}};
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
  function loadExternalFavorites(){if(externalRecords)return Promise.resolve(externalRecords);if(externalPending)return externalPending;externalPending=fetch('../directory-search-extra.json?v=20261001-5',{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('favorites');return response.json()}).then(json=>{externalRecords=Array.isArray(json.records)?json.records:[];externalPending=null;if(data&&route().favorites)render();return externalRecords}).catch(()=>{externalRecords=[];externalPending=null;return externalRecords});return externalPending}

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
  const homeLink = '<a class="back-btn" href="../main-v2/" data-main-back>Вернуться в главное меню</a>';
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
  const healthCovers={
    doctors:['../assets/health-doctors-cover-v1.webp?v=1','Врачи и диагностика'],
    beauty:['../assets/health-beauty-cover-v1.webp?v=1','Красота и профессиональный уход'],
    care:['../assets/health-care-help-cover-v1.webp?v=1','Помощь и заботливый уход'],
    education:['../assets/health-education-cover-v1.webp?v=1','Образование и развитие']
  };
  function rootCover(branch){const cover=healthCovers[branch]||['../assets/health-care-cover-v1.webp?v=1','Врачи, диагностика, красота и помощь — здоровье и уход в Измаиле'];return '<section class="profile-banner health-profile-banner"><div class="visual generated-cover health-cover"><img src="'+cover[0]+'" alt="'+cover[1]+'" width="1280" height="752" draggable="false" decoding="async"></div></section>'}
  function favoritesCover(){return `<section class="favorites-cover" role="img" aria-label="Справочник Измаил: избранные контакты."><img class="favorites-cover-art" src="../assets/favorites-cover-v1.webp?v=1" alt="" width="1280" height="751" decoding="async"><div class="favorites-cover-copy"><span>СПРАВОЧНИК ИЗМАИЛ</span><strong>Избранное</strong><small>Сохранённые контакты</small></div></section>`}
  function cityTabs(city,q=''){const options=cities(),tab=c=>'<a class="city-tab" href="'+cityHref(c)+'" '+(city===c?'aria-current="true"':'')+'><img src="media/city-'+cityImages[c]+'.jpg" alt="" width="330" height="220"><span>'+escape(c)+'</span></a>';const picker=city?'<div class="city-selection">'+tab(city)+'<button id="cityListToggle" type="button" aria-expanded="'+String(cityListOpen)+'">'+(cityListOpen?'Скрыть города ↑':'Другие города ↓')+'</button></div>':'';const others=city?options.filter(c=>c!==city):options;return '<h2 class="city-heading">'+(city?'Выбран город: '+escape(city):'Выберите город')+'</h2>'+picker+'<nav class="city-tabs" aria-label="Город приёма" '+(city&&!cityListOpen?'hidden':'')+'>'+(city&&!cityListOpen?'':others.map(tab).join(''))+'</nav>'+(city==='Измаил'?'<a class="city-vet veterinary chip" href="'+cityHref(city)+'/category/20125"><span aria-hidden="true">🐾</span> Ветеринары Измаила</a>':'')}
  function reviewPanel(r){if(!r.review)return '';const v=r.review;return '<details class="reviews"><summary>Отзывы <span class="review-hide">· скрыть</span></summary><p>'+escape(v.summary)+'</p><small>'+escape(v.label)+' · '+escape(v.checked)+'</small><a href="'+escape(v.url)+'" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></details>'}
  function thumb(c,city) {
    const cover=c;
    const url=cover.media[0]?.src+(c.id==='96211'?'?v=2':'');
    return url?`<div class="visual"><img class="visual-backdrop" src="${escape(url)}" alt="" loading="lazy" aria-hidden="true"><img src="${escape(url)}" alt="" loading="lazy" width="320" height="216"></div>`:'';
  }
  const educationIcons={
    '96203':'<path d="M3 10 12 5l9 5-9 5-9-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5M21 10v6"/>',
    '96204':'<path d="M5 4h10a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3V4Z"/><path d="M8 4v16M11 8h5M11 12h5"/>',
    '96208':'<circle cx="12" cy="12" r="8"/><path d="m8 8 8 8M16 8l-8 8M12 4v16M4 12h16"/>',
    '96215':'<path d="M5 20V8l7-5 7 5v12H5Z"/><path d="M9 20v-6h6v6M8 10h8"/>',
    '96216':'<path d="M4 5h16v14H4zM8 9h8M8 13h5"/><path d="m16 16 2 2 3-4"/>',
    '96217':'<path d="M4 18c4-5 12-5 16 0M7 8a3 3 0 1 0 0 .1M17 8a3 3 0 1 0 0 .1"/><path d="M12 5v9"/>',
    '96218':'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',
    '96219':'<path d="M4 19h16M6 16l4-5 3 3 5-7"/><circle cx="18" cy="7" r="2"/>',
    '96220':'<path d="M12 3 4 7v6c0 5 3 7 8 8 5-1 8-3 8-8V7l-8-4Z"/><path d="m9 12 2 2 4-5"/>',
    '96221':'<path d="M5 18h14M7 18V8l5-4 5 4v10M9 11h6M9 14h6"/>'
  };
  function educationIcon(id){return '<span class="education-tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(educationIcons[id]||educationIcons['96204'])+'</svg></span>'}
  const iconPaths={
    medical:'<path d="M6 3h4v4h4V3h4v4a6 6 0 0 1-12 0V3Z"/><path d="M12 13v2a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="12" r="2"/>',
    hospital:'<path d="M5 21V5h14v16M9 21v-4h6v4M8 9h8M12 7v4M8 14h8"/>',
    tooth:'<path d="M7 3c-3 1-4 4-3 8 1 4 3 9 5 9 2 0 1-5 3-5s1 5 3 5 4-5 5-9c1-4 0-7-3-8-2-1-3 1-5 1S9 2 7 3Z"/>',
    eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    heart:'<path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/><path d="M4 12h4l2-3 3 6 2-3h5"/>',
    diagnostic:'<path d="M3 4h18v14H3zM8 21h8M12 18v3"/><path d="M6 11h3l2-4 3 8 2-4h2"/>',
    paw:'<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><path d="M8 19c-2-2 0-6 4-6s6 4 4 6c-2 2-6 2-8 0Z"/>',
    beauty:'<path d="M12 3c1.5 4 3 5.5 7 7-4 1.5-5.5 3-7 7-1.5-4-3-5.5-7-7 4-1.5 5.5-3 7-7Z"/><path d="M18 15c.7 2 1.5 2.8 3 3.5-1.5.7-2.3 1.5-3 3.5-.7-2-1.5-2.8-3-3.5 1.5-.7 2.3-1.5 3-3.5Z"/>',
    scissors:'<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.5 8.5 11 7.5M8.5 15.5 20 8"/>',
    care:'<path d="M4 13c3-2 5-2 8 1 3-3 5-3 8-1M4 13v5l8 3 8-3v-5"/><path d="M12 11 8.5 7.5a2.5 2.5 0 0 1 3.5-3.5 2.5 2.5 0 0 1 3.5 3.5L12 11Z"/>'
  };
  function categoryIcon(c){
    if(c.branch==='education')return educationIcon(c.id).replace(/education-tile-icon/g,'education-tile-icon directory-tile-icon');
    const name=norm(c.name),kind=c.id==='20125'||/ветерин/.test(name)?'paw':/стомат|зуб/.test(name)?'tooth':/офталь|зрен|глаз|бров|ресниц/.test(name)?'eye':/кардио|серд|сосуд/.test(name)?'heart':/диагност|анализ|узи|мрт|рентген|томограф/.test(name)?'diagnostic':/больниц|клиник|поликлиник|центр/.test(name)?'hospital':/волос|парик|барбер/.test(name)?'scissors':c.branch==='beauty'?'beauty':c.branch==='care'?'care':'medical';
    return '<span class="directory-tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+iconPaths[kind]+'</svg></span>';
  }
  function branchIcon(kind){return '<span class="directory-tile-icon branch-tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+iconPaths[kind]+'</svg></span>'}
  function tile(c,city,noPhoto=true) {
    const count=data.records.filter(r=>categoriesFor(r).includes(c.id)&&(!city||isInCity(r,city))).length;
    const media=noPhoto?'':thumb(c,city);
    const education=c.branch==='education'&&noPhoto;
    return `<a class="category-tile ${c.children?.length?'has-children':'direct-entry'} ${noPhoto?'plain-tile directory-tile':''} ${education?'education-tile':''} ${c.id==='20125'?'veterinary':''} ${count?'':'empty-category'}" href="${categoryHref(c,city)}">${media}${noPhoto?categoryIcon(c):''}<span class="tile-body"><strong>${escape(c.id==='20125'?'Ветеринары':c.name)}</strong><small>${c.children?.length?c.children.length+' разделов':count?count+' контактов':'Нет контактов'}</small></span>${noPhoto?'<span class="tile-arrow" aria-hidden="true">›</span>':''}</a>`;
  }
  function cards(records) {
    return '<div class="contact-list">'+records.map(original=>{
      const current=route(),detailsByCategory=original.categoryDetails||{},searchTerms=norm($('search').value).split(' ').filter(Boolean);
      const context=Object.entries(detailsByCategory).find(([id,details])=>{const category=data.categories.find(c=>c.id===id);const text=norm([details.name,details.note,details.specialties,category?.name].join(' '));return current.category?.id===id||(current.branch==='education'&&searchTerms.length&&searchTerms.every(term=>text.includes(term)))});
      const details=current.category?detailsByCategory[current.category.id]:context?.[1];
      const r=details?{...original,...details,favoriteName:original.favoriteName||original.name}:original;
      const c=data.categories.find(c=>c.id===categoryFor(r));
      const phoneLabel=String(r.phoneLabel||'').trim();
      const phones=r.phones.map(p=>{
        if(current.favorites){
          const visible=fmt(p);
          return `<div class="favorite-phone-action"><a class="favorite-phone phone-number call" href="tel:${dial(p)}" aria-label="Позвонить ${escape(r.name)}: ${visible}"><strong>${visible}</strong><span>Позвонить</span></a>${favoriteButton(r,p)}${r.phoneNotes?.[p]?`<small class="phone-label">${escape(r.phoneNotes[p])}</small>`:''}</div>`;
        }
        const visible=p.length===10?'+380 '+p.slice(1,3)+' '+p.slice(3,6)+' '+p.slice(6,8)+' '+p.slice(8):p;
        return `<div class="directory-phone-action education-phone-action phone-row"><a class="directory-phone education-phone phone-number call" href="tel:${dial(p)}" aria-label="Позвонить ${escape(r.name)}: ${visible}"><strong>${visible}</strong><span>Позвонить</span></a>${favoriteButton(r,p)}${r.phoneNotes?.[p]?`<small class="phone-label">${escape(r.phoneNotes[p])}</small>`:''}</div>`;
      }).join('');
      return `<article class="contact" data-record="${r.id}"><div class="contact-top"><span class="location ${r.city==='Измаил'?'':'other-city'}">⌖ ${escape(r.city)}</span></div><p class="specialty">${escape(r.specialties||(c.id==='20125'?'Ветеринары':c.name))}</p><h2>${escape(r.name)}</h2>${r.note?`<details class="contact-description"><summary>Подробнее</summary><p class="description">${escape(r.note)}</p></details>`:''}${phoneLabel?`<p class="phone-label">${escape(phoneLabel)}</p>`:''}${phones}${reviewPanel(r)}</article>`;
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
    if(favorites&&externalRecords===null)loadExternalFavorites();
    let q=$('search').value.trim();
    document.body.dataset.education=String(branch==='education');
    document.body.dataset.educationLevel=branch==='education'?(category?.children?'nested':category?'contacts':'root'):'none';
    document.body.dataset.doctors=String(branch==='doctors'&&!category);
    document.body.dataset.cityPicker=String(branch==='doctors'&&!cityName&&!q);
    document.body.dataset.view=favorites?'favorites':globalSearch?'search':category?'category':branch?'branch':'home';
    const key=[category?.id,cityName,branch,favorites,globalSearch,contactId,globalSearch?query:''].join('|');
    if(shellKey!==key){
      shellKey=key;
      if(globalSearch){$('search').value=query;q=query}
      const title=globalSearch?'Поиск по справочнику':category?(category.id==='20125'?'Ветеринары':category.name):favorites?'Избранное':branches[branch]||'Здоровье и уход';
      $('title').textContent=title;document.title=title+(cityName?' · '+cityName:' · Измаил');
      const back=favorites||globalSearch?'':category?'<a class="back-btn secondary" href="'+(category.parent?'#category/'+category.parent:branch==='doctors'?cityHref(cityName):branch==='beauty'?'#beauty':branch==='education'?'#education':'#')+'">Вернуться в раздел</a>':branch&&branch!=='education'?'<a class="back-btn secondary" href="#">Вернуться в раздел</a>':'';
      $('topNav').innerHTML=back+homeLink;$('bottomNav').innerHTML=back+homeLink;
      $('cityNavigation').innerHTML='';
      $('cityNavigation').hidden=branch!=='doctors';
      $('profileMedia').innerHTML=favorites?favoritesCover():rootCover(branch);
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
    if(favorites){const seen=new Set();scope=[...scope,...(externalRecords||[]),...readLocalFavoriteCatalog()].map(r=>({...r,phones:r.phones.filter(p=>{const k=favoriteKey(r,p);if(!saved.has(k)||seen.has(k))return false;seen.add(k);return true})})).filter(r=>r.phones.length)}
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
      const sorted=scope.slice().sort((a,b)=>(data.sources[b.source]?.kind==='official')-(data.sources[a.source]?.kind==='official'));
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
      $('content').innerHTML='<div class="branches">'+[['doctors','medical'],['beauty','beauty']].map(([id,icon])=>{const count=data.categories.filter(c=>c.branch===id&&!c.parent&&!['96319','96323'].includes(c.id)).length;return '<a class="branch-card directory-branch plain-branch has-children '+id+'" href="#'+id+'">'+branchIcon(icon)+'<div class="branch-copy card-copy"><h2>'+branches[id]+'</h2><p>'+count+' разделов</p></div><span class="tile-arrow" aria-hidden="true">›</span></a>'}).join('')+(()=>{const c=data.categories.find(c=>c.id==='96211'),count=data.records.filter(r=>categoriesFor(r).includes(c.id)).length;return '<a class="branch-card directory-branch plain-branch direct-entry care" href="#category/96211">'+branchIcon('care')+'<div class="branch-copy card-copy"><h2>'+escape(c.name)+'</h2><p>'+count+' контактов</p></div><span class="tile-arrow" aria-hidden="true">›</span></a>'})()+'</div>';
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
  try{const response=await fetch('data.json?v=20261001-16',{cache:'no-cache'});if(!response.ok)throw Error();data=await response.json();render()}
  catch{$('content').innerHTML='<p class="empty error">Не удалось загрузить контакты. Проверьте соединение и обновите страницу.</p>'; $('topNav').innerHTML=homeLink;$('bottomNav').innerHTML=homeLink;}
})();
