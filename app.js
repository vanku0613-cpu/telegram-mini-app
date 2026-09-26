const list = document.getElementById('list');
const search = document.getElementById('search');
const count = document.getElementById('count');
let currentFilter = 'all';
let userPosition = null;

const icons = { shelter:'🛡️', radiation:'☢️', simple:'🏠' };
const names = { shelter:'Сховище', radiation:'Противорадиационное укрытие', simple:'Простейшее укрытие' };

function normalize(s){ return s.toLowerCase().replaceAll('ё','е').replaceAll('і','и').replaceAll('ї','и').replaceAll('є','е'); }
function mapUrl(address){ return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Измаил, Одесская область, Украина, ' + address); }
function escapeHtml(s){ return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function render(){
  const q = normalize(search.value.trim());
  const filtered = shelters.filter(s => {
    if(currentFilter !== 'all' && s.type !== currentFilter) return false;
    if(!q) return true;
    return normalize(s.addresses.join(' ')).includes(q) || normalize(s.title).includes(q);
  });
  const addressCount = filtered.reduce((n,s)=>n+s.addresses.length,0);
  count.textContent = `${addressCount} адрес${addressCount===1?'':'ов'}`;
  list.innerHTML = filtered.map((s,i)=>`<article class="card ${s.type}">
    <div class="card-top"><span class="type-icon">${icons[s.type]}</span><span class="type-name">${names[s.type]}</span></div>
    <div class="addresses">${s.addresses.map(a=>`<div class="address"><div><span class="pin">📍</span><span>${escapeHtml(a)}</span></div><a class="map-btn" href="${mapUrl(a)}" target="_blank" rel="noopener">Маршрут</a></div>`).join('')}</div>
  </article>`).join('');
  if(!filtered.length) list.innerHTML = '<div class="empty">🔎<strong>Ничего не найдено</strong><span>Попробуйте название улицы или номер дома.</span></div>';
}

function goHome(){
  if(window.Telegram?.WebApp?.HapticFeedback) Telegram.WebApp.HapticFeedback.impactOccurred('light');
  if(window.history.length>1) history.back(); else if(document.referrer) location.href=document.referrer; else location.href='../index.html';
}

function showNearest(){
  if(!navigator.geolocation){ alert('Ваш браузер не поддерживает определение местоположения.'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    userPosition = pos.coords;
    alert('Местоположение получено. Для точного списка ближайших укрытий нужны координаты каждого адреса; пока открывайте маршрут кнопкой «Маршрут».');
  },()=>alert('Разрешите доступ к геолокации, чтобы использовать эту функцию.'));
}

search.addEventListener('input', render);
document.getElementById('clear').addEventListener('click',()=>{search.value='';render();search.focus();});
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.filter;render();}));

if(window.Telegram?.WebApp){ Telegram.WebApp.ready(); Telegram.WebApp.expand(); }
render();
