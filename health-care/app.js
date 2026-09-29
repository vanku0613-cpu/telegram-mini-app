(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const branches = {doctors:'Врачи и здоровье',beauty:'Красота и уход'};
  let data;
  const savedKey='izmail.health.favorites.v1';
  const readSaved=()=>{try{const x=JSON.parse(localStorage.getItem(savedKey)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'):[])}catch{return new Set()}};
  let saved=readSaved();
  const favoriteKey=(r,p)=>JSON.stringify([r.name,p]);
  const cityNames=r=>r.city.split(' / ');
  const cities=()=>[...new Set(data.records.flatMap(cityNames))].filter(c=>!['Измаил','Украина'].includes(c));
  function favoriteButton(r,p){const key=favoriteKey(r,p),active=saved.has(key);return '<button type="button" class="favorite-toggle" data-favorite="'+escape(key)+'" aria-pressed="'+active+'" aria-label="'+(active?'Убрать из избранного':'Добавить в избранное')+': '+escape(r.name)+' '+fmt(p)+'" title="'+(active?'Убрать из избранного':'Добавить в избранное')+'">'+(active?'★':'☆')+'</button>'}
  function syncFavorites(){document.querySelectorAll('[data-favorite]').forEach(b=>{const active=saved.has(b.dataset.favorite),label=active?'Убрать из избранного':'Добавить в избранное';b.setAttribute('aria-pressed',String(active));b.textContent=active?'★':'☆';b.setAttribute('aria-label',label+': '+JSON.parse(b.dataset.favorite).join(' '));b.title=label})}

  const norm = value => String(value).toLocaleLowerCase().replace(/ё/g,'е').replace(/[’'`]/g,'').replace(/\s+/g,' ').trim();
  const fmt = p => p.length === 10 ? p.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/,'$1 $2 $3 $4') : p;
  const dial = p => p.length === 10 ? '+38'+p : p;
  const route = () => {
    const hash=location.hash.slice(1), category=data.categories.find(c=>'category/'+c.id===hash);
    let cityName;try{cityName=hash.startsWith('city/')?decodeURIComponent(hash.slice(5)):null}catch{}
    if(!cities().includes(cityName))cityName=null;
    return {category,cityName,favorites:hash==='favorites',branch:category?.branch || (cityName?'doctors':branches[hash] ? hash : null)};
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
    ['Ветеринарная помощь',['20125','96323']],
    ['Другие города из подборки',['96319']]
  ];
  function branchCover(id){return '<div class="branch-visual"><span class="cover-brand">СПРАВОЧНИК ИЗМАИЛ</span><strong class="cover-title">'+branches[id]+'</strong><img src="media/'+(id==='doctors'?'doctor':'beauty')+'-photo.jpg" alt="" width="320" height="216"></div>'}
  function cityPicker(){return '<details class="city-picker"><summary class="chip">Другие города <span aria-hidden="true">⌄</span></summary><div class="city-options">'+cities().map(c=>'<a href="#city/'+encodeURIComponent(c)+'">'+escape(c)+'</a>').join('')+'</div></details>'}
  function reviewPanel(r){if(!r.review)return '';const v=r.review;return '<details class="reviews"><summary>Отзывы <span class="review-hide">· скрыть</span></summary><p>'+escape(v.summary)+'</p><small>'+escape(v.label)+' · '+escape(v.checked)+'</small><a href="'+escape(v.url)+'" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></details>'}
  function thumb(c) {
    const m=c.media[0], url=m?.poster || (m?.type==='image'?m.src:null);
    if(!url)return '<span class="placeholder" aria-hidden="true">✚</span>';
    const visual=m.type==='video'?`<video muted autoplay loop playsinline preload="none" poster="${escape(url)}" data-src="${escape(m.src)}" aria-hidden="true" tabindex="-1"></video>`:`<img src="${escape(url)}" alt="" loading="lazy" width="320" height="216">`;
    return `<div class="visual"><img class="visual-backdrop" src="${escape(url)}" alt="" loading="lazy" aria-hidden="true">${visual}</div>`;
  }
  const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target:v,isIntersecting})=>{
    v.dataset.visible=String(isIntersecting);
    if(isIntersecting&&!document.hidden){if(!v.src)v.src=v.dataset.src;v.muted=true;v.play().catch(()=>{})}else v.pause();
  }),{threshold:0.12});
  function watchVideos(){document.querySelectorAll('video:not([data-observed])').forEach(v=>{v.dataset.observed='true';videoObserver.observe(v)})}
  document.addEventListener('visibilitychange',()=>document.querySelectorAll('video').forEach(v=>{
    if(document.hidden)v.pause();else if(v.dataset.visible==='true')v.play().catch(()=>{});
  }));
  function tile(c) {
    return `<a class="category-tile ${['20125','96323'].includes(c.id)?'veterinary':''} ${c.count?'':'empty-category'}" href="#category/${c.id}">${thumb(c)}<span class="tile-body"><strong>${escape(c.name)}</strong><small>${c.count?c.count+' карточек':'Контакты пока не найдены'} <span aria-hidden="true">›</span></small></span></a>`;
  }
  function cards(records) {
    return '<div class="contact-list">'+records.map(r=>{
      const c=data.categories.find(c=>c.id===r.category);
      return `<article class="contact" data-record="${r.id}"><div class="contact-top"><span class="location ${r.city==='Измаил'?'':'other-city'}">⌖ ${escape(r.city)}</span></div><p class="specialty">${escape(c.name)}</p><h2>${escape(r.name)}</h2>${r.note?`<p class="description">${escape(r.note)}</p>`:''}<p class="phone-label">${escape(r.phoneLabel)}</p>${r.phones.map(p=>`<div class="phone-row"><a class="phone-number" href="tel:${dial(p)}">${fmt(p)}</a><div class="phone-actions"><a class="call" href="tel:${dial(p)}" aria-label="Позвонить ${escape(r.name)}: ${fmt(p)}">☎ Позвонить</a>${favoriteButton(r,p)}</div></div>`).join('')}${reviewPanel(r)}</article>`;
    }).join('')+'</div>';
  }
  function media(c) {return '<section class="profile-banner">'+thumb(c)+'</section>'}
  let shellKey;
  function matched(r,q) {
    const c=data.categories.find(c=>c.id===r.category);
    const text=norm([r.name,r.note,r.city,c.name,...r.phones].join(' '));
    const terms=norm(q).split(' ').filter(Boolean);
    const digits=q.replace(/\D/g,'');
    return terms.every(t=>text.includes(t)) || (digits.length>=3 && r.phones.some(p=>p.includes(digits)));
  }
  function render() {
    if(!data)return;
    const {category,branch,cityName,favorites}=route(),q=$('search').value.trim();
    document.body.dataset.view=category?'category':branch?'branch':'home';
    const key=category?.id || cityName || (favorites?'favorites':branch) || 'home';
    if(shellKey!==key){
    shellKey=key;
    document.querySelectorAll('#profileMedia video').forEach(v=>{videoObserver.unobserve(v);v.pause()});
    $('title').innerHTML=category?escape(category.name):cityName?escape(cityName):favorites?'Избранное':branch?escape(branches[branch]):'Здоровье и уход';
    document.title=(category?.name || cityName || (favorites?'Избранное':branches[branch]) || 'Здоровье и уход')+' · Измаил';
    const back=category||cityName?`<a class="back-btn secondary" href="#${branch}">← Назад к категориям</a>`:branch||favorites?'<a class="back-btn secondary" href="#">← Назад в раздел</a>':'';
    $('topNav').innerHTML=homeLink+back; $('bottomNav').innerHTML=homeLink+back;
    $('profileMedia').innerHTML=category?media(category):branch&&!cityName?'<section class="profile-banner">'+branchCover(branch)+'</section>':'';
    document.querySelector('.finder').hidden=!branch&&!favorites;
    }
    document.querySelectorAll('#content video').forEach(v=>{videoObserver.unobserve(v);v.pause()});
    $('clear').hidden=!q;
    let scope=data.records.filter(r=>(!branch || data.categories.find(c=>c.id===r.category).branch===branch)&&(!category||r.category===category.id)&&(!cityName||cityNames(r).includes(cityName)));
    if(favorites){const seen=new Set();scope=scope.map(r=>({...r,phones:r.phones.filter(p=>{const k=favoriteKey(r,p);if(!saved.has(k)||seen.has(k))return false;seen.add(k);return true})})).filter(r=>r.phones.length)}
    if(q){
      const found=scope.filter(r=>matched(r,q));
      const categoryMatches=data.categories.filter(c=>(!branch||c.branch===branch)&&!favorites&&!cityName&&norm(c.name).includes(norm(q)));
      $('resultStatus').textContent=`Найдено: ${found.length} карточек`;
      $('content').innerHTML=(!category&&categoryMatches.length?'<h2 class="search-heading">Категории</h2><div class="quick-links">'+categoryMatches.map(c=>`<a class="chip" href="#category/${c.id}">${escape(c.name)}</a>`).join('')+'</div>':'')+(found.length?cards(found):'<p class="empty"><strong>Ничего не найдено</strong>Попробуйте часть имени, специальности или номера телефона.</p>');
    }else if(category||cityName||favorites){
      $('resultStatus').textContent=scope.length+' карточек';
      const sorted=scope.slice().sort((a,b)=>(data.sources[b.source].kind==='official')-(data.sources[a.source].kind==='official'));
      $('content').innerHTML=(category?.note?`<p class="empty">${escape(category.note)}</p>`:'')+(scope.length?cards(sorted):favorites?'<div class="empty"><strong>Пока нет избранных номеров</strong>Нажмите ☆ рядом с номером, чтобы сохранить его здесь.</div>':'<div class="empty"><strong>Контакты пока не найдены</strong>Категория сохранена из справочника. Достоверного номера для неё пока нет; случайные контакты не добавлены.</div>');
    }else if(branch){
      const cats=data.categories.filter(c=>c.branch===branch);
      $('resultStatus').textContent=cats.length+' категорий';
      $('content').innerHTML=branch==='beauty'?'<div class="category-grid">'+cats.map(tile).join('')+'</div>':'<div class="quick-links"><a class="chip veterinary" href="#category/20125">🐾 Ветеринары</a>'+cityPicker()+'</div>'+groups.map(([title,ids])=>'<h2 class="group-title">'+title+'</h2><div class="category-grid">'+ids.map(id=>data.categories.find(c=>c.id===id)).filter(Boolean).map(tile).join('')+'</div>').join('');
    }else{
      $('resultStatus').textContent='Два направления';
      $('content').innerHTML='<div class="branches">'+[['doctors','96228','Врачи · Клиники · Диагностика · Ветеринары'],['beauty','96046','Маникюр · Волосы · Брови · Уход']].map(([id,cover,desc])=>`<a class="branch-card ${id}" href="#${id}">${branchCover(id)}<div class="branch-copy"><h2>${branches[id]}</h2><p>${desc}</p><span class="branch-meta">${data.categories.filter(c=>c.branch===id).length} категорий</span><span class="arrow" aria-hidden="true">›</span></div></a>`).join('')+'</div>';
    }
    watchVideos();
  }
  $('search').addEventListener('input',render);
  $('clear').addEventListener('click',()=>{$('search').value='';render();$('search').focus()});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-favorite]');if(!button)return;
    const key=button.dataset.favorite,next=readSaved();const removing=next.has(key);
    if(removing)next.delete(key);else next.add(key);
    try{localStorage.setItem(savedKey,JSON.stringify([...next]));saved=next}catch{$('favoriteStatus').textContent='Не удалось сохранить. Разрешите хранение данных в браузере.';return}
    $('favoriteStatus').textContent=removing?'Номер убран из избранного':'Номер добавлен в избранное';
    if(route().favorites){render();$('title').focus({preventScroll:true})}else syncFavorites();
  });
  window.addEventListener('storage',event=>{if(event.key===savedKey||event.key===null){saved=readSaved();if(data&&route().favorites)render();else syncFavorites()}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const picker=document.querySelector('.city-picker[open]');if(picker){picker.open=false;picker.querySelector('summary').focus()}}});
  document.addEventListener('click',event=>{const picker=document.querySelector('.city-picker[open]');if(picker&&!picker.contains(event.target))picker.open=false});
  document.addEventListener('pointerdown',event=>{const el=event.target.closest('a,button');if(el){el.classList.add('tap-lit');setTimeout(()=>el.classList.remove('tap-lit'),680)}},{passive:true});
  window.addEventListener('hashchange',()=>{$('search').value='';render();window.scrollTo(0,0);$('title').focus({preventScroll:true})});
  try{const response=await fetch('data.json?v=20260930-2',{cache:'no-cache'});if(!response.ok)throw Error();data=await response.json();render()}
  catch{$('content').innerHTML='<p class="empty error">Не удалось загрузить контакты. Проверьте соединение и обновите страницу.</p>'; $('topNav').innerHTML=homeLink;$('bottomNav').innerHTML=homeLink;}
})();
