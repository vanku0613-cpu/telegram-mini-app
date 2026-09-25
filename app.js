const tg = window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();}
const $=id=>document.getElementById(id);

function openLink(url,msg){
  if(!url){show(msg||"Ссылка ещё не подключена.");return;}
  if(tg?.openTelegramLink && /^https?:\/\/t\.me\//i.test(url)) tg.openTelegramLink(url);
  else window.open(url,"_blank","noopener,noreferrer");
}
function show(titleOrText, body){
  if(body===undefined){$("modalTitle").textContent="Главный справочник Измаил";$("modalBody").innerHTML=`<p>${titleOrText}</p>`}
  else {$("modalTitle").textContent=titleOrText;$("modalBody").innerHTML=body}
  $("modal").classList.remove("hidden");
}
$("close").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")};

const names={
 health:["Здоровье и уход",LINKS.HEALTH],transport:["Транспорт / Такси",LINKS.TRANSPORT],services:["Услуги и мастера",LINKS.SERVICES],food:["Продукты питания",LINKS.FOOD],utilities:["Коммунальные службы",LINKS.UTILITIES],jobs:["Работа / Вакансии",LINKS.JOBS],education:["Образование и развитие",LINKS.EDUCATION],leisure:["Отдых • Жильё • Море",LINKS.LEISURE]
};

function category(key){const [title,url]=names[key];openLink(url,`Раздел «${title}» кликабельный. Пришли ссылку на него — я подключу переход.`)}

document.querySelectorAll('.hotspot').forEach(el=>el.addEventListener('click',()=>{
 const a=el.dataset.action;
 if(a==='main')return openLink(LINKS.MAIN_GROUP,'Верхняя картинка и логотип кликабельны. Пришли ссылку на главную группу — я подключу переход.');
 if(a==='shelters')return openLink(LINKS.SHELTERS,'Кнопка «Укрытия Измаил» кликабельна. Пришли ссылку на группу укрытий.');
 if(a==='groups')return openLink(LINKS.OUR_GROUPS,'Кнопка «Наши группы» кликабельна. Пришли ссылку.');
 if(a==='instagram')return openLink(LINKS.INSTAGRAM,'Кнопка «Заказать рекламу» кликабельна. Пришли ссылку Instagram.');
 if(a==='home')return window.location.reload();
 if(a==='favorites')return favorites();
 if(a==='weather')return show('Погода в Измаиле','Погода обновляется автоматически. Нажми «Закрыть», чтобы вернуться в меню.');
 if(a==='currency')return show('Курс валют','USD и EUR обновляются автоматически по данным НБУ.');
 if(a==='search')return search();
 if(names[a])return category(a);
}));

function search(){
 show('Поиск по справочнику',`<input class="search-input" id="q" placeholder="Например: такси, аптека, ремонт..."><div id="results" class="small">Начни вводить запрос.</div>`);
 const q=$("q");q.focus();q.oninput=()=>{
  const v=q.value.trim().toLowerCase();
  if(!v){$("results").innerHTML='Начни вводить запрос.';return;}
  const found=Object.entries(names).filter(([k,[t]])=>t.toLowerCase().includes(v)).map(([k,[t,url]])=>`<div class="result"><b>${t}</b><br><span class="small">Раздел справочника</span><br><button onclick="category('${k}')">Открыть раздел</button></div>`).join('');
  $("results").innerHTML=found||'Ничего не найдено. Для поиска по сообщениям Telegram-групп понадобится отдельный поиск/индексация.';
 };
}
function favorites(){
 const list=JSON.parse(localStorage.getItem('izmail_favorites')||'[]');
 show('Избранное',list.length?list.map(x=>`<div class="result"><b>${x.title}</b><br>${x.value}</div>`).join(''):'<p>Избранное пока пустое.</p>');
}

async function weather(){
 try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${WEATHER.latitude}&longitude=${WEATHER.longitude}&current=temperature_2m&timezone=${encodeURIComponent(WEATHER.timezone)}`;const d=await (await fetch(u)).json();const t=Math.round(d.current.temperature_2m);$("liveWeather").textContent=`${t>0?'+':''}${t}°`;}
 catch{$("liveWeather").textContent='';}
}
async function currency(){
 try{const d=await (await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json')).json();const u=d.find(x=>x.cc==='USD'),e=d.find(x=>x.cc==='EUR');if(u)$("liveUsd").textContent=Number(u.rate).toFixed(2);if(e)$("liveEur").textContent=Number(e.rate).toFixed(2);}
 catch{$("liveUsd").textContent='';$("liveEur").textContent='';}
}
weather();currency();setInterval(weather,600000);setInterval(currency,900000);
