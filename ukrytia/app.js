(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  $('emergencyToggle').addEventListener('click',()=>{const open=$('emergencyPanel').hidden;$('emergencyPanel').hidden=!open;$('emergencyToggle').setAttribute('aria-expanded',String(open));$('emergencyToggle').querySelector('b').textContent=open?'Закрыть ▴':'101 / 112 ▾';});
  const data = window.IZMAIL_SHELTERS;
  if (!data || !Array.isArray(data.items)) { $('results').textContent = 'Не удалось загрузить адреса. Откройте оригинал городской карты в разделе источников.'; return; }
  const types = {shelter:'Убежище',pru:'Противорадиационное укрытие',simple:'Простейшее укрытие'};
  const aliases = [['независимости','незалежності'],['мира','миру'],['телеграфная','телеграфна'],['репина','рєпіна'],['шевченко','шевченка'],['европейская','європейська'],['михайловская','михайлівська'],['школьная','шкільна'],['торговая','торгова'],['придунайская','придунайська'],['бендерская','бендерська'],['измаильская','ізмаїльська'],['героев','героїв'],['измаила','ізмаїла'],['соборная','соборна'],['весенняя','весняна'],['кафедральная','кафедральна'],['княгини','княгині'],['нижне садовая','нижнє садова'],['осипенко','осипенка'],['мистецька','осипенка'],['маріупольська','платова'],['мариупольская','платова']];
  function normalize(value) { let text = String(value).toLowerCase().replace(/[’'ʼ]/g,'').replace(/[-.,()№]/g,' '); for(const [a,b] of aliases) text=text.replaceAll(a,b);return text.replace(/[ії]/g,'и').replace(/є/g,'е').replace(/ё/g,'е').replace(/\s+/g,' ').trim(); }
  const items = data.items.map(item => ({...item,search:normalize([item.address,item.name,item.description].join(' '))}));
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let filter='all',limit=4,position=null,nearby=false,map=null,markers=null,userMarker=null,visible=[];
  function distance(item) {const rad=Math.PI/180,a=Math.sin((item.lat-position.lat)*rad/2)**2+Math.cos(position.lat*rad)*Math.cos(item.lat*rad)*Math.sin((item.lng-position.lng)*rad/2)**2;return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
  function route(item) {return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(item.lat+','+item.lng)+'&travelmode=walking'+(position?'&origin='+encodeURIComponent(position.lat+','+position.lng):'');}
  function warning(item) {return item.repair?'В городской карте отмечен ремонт. Доступ уточняйте у дежурного.':!item.address?'Адрес не указан в источнике. Уточните его у дежурного.':'';}
  function routeLink(item) {return !item.repair&&item.address?'<a class="route" href="'+route(item)+'" target="_blank" rel="noopener noreferrer">Маршрут ↗</a>':'';}
  function card(item) {const d=position?distance(item):null;return '<article class="shelter-card" data-id="'+item.id+'"><div class="card-top"><span class="type">'+types[item.type]+'</span>'+(d!==null?'<span class="distance">'+(d<1?Math.round(d*1000)+' м':d.toFixed(1)+' км')+' · по прямой</span>':'')+'</div><h4>'+escape(item.address||'Адрес не указан')+'</h4><p class="object-name">'+escape(item.name)+'</p>'+(warning(item)?'<p class="warning">'+warning(item)+'</p>':'')+'<div class="card-actions">'+routeLink(item)+'<button class="on-map" type="button" data-map-id="'+item.id+'">На карте</button></div><details><summary>Сведения из городской карты</summary><p>'+escape(item.description||'Описание отсутствует в источнике.')+'</p><p>Точка на карте не подтверждает расположение входа или доступность сейчас.</p><a href="'+data.source+'" target="_blank" rel="noopener noreferrer">Оригинал карты ↗</a></details></article>';}
  function popup(item) {return '<b>'+escape(item.address||item.name)+'</b>'+escape(types[item.type])+(warning(item)?'<p class="map-popup-warning">'+warning(item)+'</p>':'<p>Доступность входа сейчас не подтверждена.</p>')+routeLink(item);}
  const markerIndex=new Map();
  function renderMap(fit) {if(!map || $('mapSection').hidden)return;markers.clearLayers();markerIndex.clear();visible.forEach(item=>{const marker=L.marker([item.lat,item.lng],{icon:L.divIcon({className:'marker-dot'+(warning(item)?' caution':''),html:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 6v7c0 5-6 8-9 9-3-1-9-4-9-9V6Z"/><path d="m7 12 5-4 5 4M8 11v6h8v-6M11 17v-4h2v4"/></svg>',iconSize:[28,32],iconAnchor:[14,28],popupAnchor:[0,-25]}),title:item.address||item.name,alt:item.address||item.name}).bindPopup(popup(item));markers.addLayer(marker);markerIndex.set(item.id,marker);});if(fit&&visible.length){const bounds=L.latLngBounds(visible.map(x=>[x.lat,x.lng]));map.fitBounds(bounds,{padding:[24,24],maxZoom:15,animate:false});}}
  function render(fit=true) {const tokens=normalize($('searchInput').value).split(' ').filter(Boolean).filter(x=>!['ул','улица','вул','вулиця','проспект','пр','т','будинок','дом','измаил','ізмаїл'].includes(x));visible=items.filter(item=>(filter==='all'||item.type===filter)&&tokens.every(t=>item.search.includes(t))&&(!nearby||(!item.repair&&item.address)));if(position)visible.sort((a,b)=>distance(a)-distance(b));$('resultCount').textContent='Найдено: '+visible.length;$('sortLabel').textContent=nearby?'Ближе по прямой · доступ уточняйте':'По городской карте';$('results').innerHTML=visible.length?visible.slice(0,limit).map(card).join(''):'<p class="empty">Ничего не найдено. Попробуйте название улицы без номера дома или другой тип укрытия.</p>';$('moreBtn').hidden=visible.length<=limit;$('moreBtn').textContent='Показать ещё · осталось '+Math.max(0,visible.length-limit);renderMap(fit);}
  function initializeMap() {
    if (map) return;
    try {if(window.L){map=L.map('map',{scrollWheelZoom:false,zoomControl:true}).setView([45.3505,28.837],15);let tileErrors=0;L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).on('tileerror',()=>{if(++tileErrors>=2)$('mapError').hidden=false;}).addTo(map);markers=L.layerGroup().addTo(map);}else{$('mapError').hidden=false;}}catch(_){$('mapError').hidden=false;}
    if (map && position && distance({lat:45.35,lng:28.84})<=30) userMarker=L.circleMarker([position.lat,position.lng],{radius:7,color:"#fff",weight:2,fillColor:"#2377dc",fillOpacity:1}).bindPopup("Ваше приблизительное местоположение").addTo(map);
  }
  $('searchForm').addEventListener('submit',e=>{e.preventDefault();$('searchInput').blur();});
  $('searchInput').addEventListener('input',()=>{limit=4;render();});
  $('clearBtn').addEventListener('click',()=>{$('searchInput').value='';limit=4;render();$('searchInput').focus();});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;limit=4;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
  $('moreBtn').addEventListener('click',()=>{limit+=6;render(false);});
  function showMap(){ $('mapSection').hidden=false;initializeMap();renderMap(Boolean($('searchInput').value.trim()) || filter!=='all' || nearby);$('mapBtn').setAttribute('aria-expanded','true');$('mapBtn').textContent='Скрыть карту';if(map)map.invalidateSize({animate:false}); }
  $('mapBtn').addEventListener('click',()=>{if($('mapSection').hidden){showMap();}else{$('mapSection').hidden=true;$('mapBtn').setAttribute('aria-expanded','false');$('mapBtn').textContent='Показать карту';}});
  $('results').addEventListener('click',event=>{const button=event.target.closest('[data-map-id]');if(!button)return;showMap();const marker=markerIndex.get(button.dataset.mapId);if(marker){map.setView(marker.getLatLng(),16,{animate:false});marker.openPopup();}$('mapWrap').scrollIntoView({block:'center',behavior:'instant'});});
  const telegram = window.Telegram && window.Telegram.WebApp;
  const locationManager = telegram && telegram.isVersionAtLeast && telegram.isVersionAtLeast('8.0') && telegram.LocationManager;
  let locationBusy=false, settingsNeeded=false;
  if(locationManager) { try { locationManager.init(); } catch(_) {} }

  function requestPosition() {
    return new Promise((resolve,reject)=>{
      let settled=false;
      const finish=(error,coords)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(coords);};
      const timer=setTimeout(()=>finish({code:3}),30000);
      const browserRequest=()=>{
        if(!navigator.geolocation){finish({code:2});return;}
        const attempt=highAccuracy=>{
          try { navigator.geolocation.getCurrentPosition(pos=>finish(null,pos.coords),error=>{
            if(error.code!==1&&!highAccuracy)attempt(true);else finish(error);
          },{enableHighAccuracy:highAccuracy,timeout:highAccuracy?15000:7000,maximumAge:highAccuracy?0:60000}); }
          catch(_){finish({code:2});}
        };
        attempt(false);
      };
      if(locationManager) {
        const nativeRequest=()=>{
          if(settled)return;
          if(!locationManager.isLocationAvailable){browserRequest();return;}
          try { locationManager.getLocation(coords=>coords?finish(null,coords):finish({code:1,telegram:true})); }
          catch(_){browserRequest();}
        };
        try { locationManager.isInited?nativeRequest():locationManager.init(nativeRequest); }
        catch(_){browserRequest();}
      } else browserRequest();
    });
  }

  $('nearbyBtn').addEventListener('click',async()=>{
    if(locationBusy)return;
    if(nearby){nearby=false;position=null;if(userMarker){userMarker.remove();userMarker=null;}$('nearbyBtn').textContent='⌖ Рядом со мной';$('locationStatus').textContent='Геопозиция используется только после нажатия.';limit=4;render();return;}
    if(settingsNeeded&&locationManager){settingsNeeded=false;try{locationManager.openSettings();$('nearbyBtn').textContent='⌖ Повторить поиск рядом';$('locationStatus').textContent='Разрешите геолокацию в Telegram, затем нажмите «Повторить поиск рядом».';return;}catch(_) {}}
    locationBusy=true;$('nearbyBtn').disabled=true;$('nearbyBtn').textContent='⌖ Определяем местоположение…';
    $('locationStatus').textContent='Разрешите геолокацию в появившемся запросе. Ищем ближайшие укрытия…';
    try {
      const coords=await requestPosition();
      if(!Number.isFinite(coords.latitude)||!Number.isFinite(coords.longitude)||Math.abs(coords.latitude)>90||Math.abs(coords.longitude)>180)throw {code:2};
      position={lat:coords.latitude,lng:coords.longitude};nearby=true;limit=4;filter='all';$('searchInput').value='';
      document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));
      $('nearbyBtn').textContent='✕ Сбросить «Рядом»';
      const outside=distance({lat:45.35,lng:28.84})>30;
      $('locationStatus').textContent=(outside?'Вы далеко от Измаила. Показываем укрытия Измаила. ':'')+'Ближайшие адреса — первыми. Расстояние по прямой; доступ уточняйте.';
      if(userMarker){userMarker.remove();userMarker=null;}
      render(false);showMap();
      if(map&&!outside){
        if(!userMarker)userMarker=L.circleMarker([position.lat,position.lng],{radius:7,color:'#fff',weight:2,fillColor:'#2377dc',fillOpacity:1}).bindPopup('Вы здесь').addTo(map);
        map.fitBounds(L.latLngBounds([[position.lat,position.lng],...visible.slice(0,4).map(x=>[x.lat,x.lng])]),{padding:[32,32],maxZoom:16,animate:false});
      }
    } catch(error) {
      settingsNeeded=Boolean(error.telegram);
      $('nearbyBtn').textContent=settingsNeeded?'⌖ Разрешить геолокацию':'⌖ Повторить поиск рядом';
      $('locationStatus').textContent=error.code===1?'Не удалось получить геопозицию: доступ запрещён. '+(settingsNeeded?'Нажмите «Разрешить геолокацию» и включите доступ в Telegram.':'Разрешите местоположение для этого сайта в настройках браузера. Пока можно найти укрытие по улице.'):
        error.code===3?'Определение местоположения заняло слишком много времени. Включите геолокацию на телефоне и повторите поиск.':'Местоположение сейчас недоступно. Включите геолокацию и повторите поиск или введите улицу.';
    } finally {locationBusy=false;$('nearbyBtn').disabled=false;}
  });
  $('cityBtn').addEventListener('click',()=>{showMap();renderMap(true);});
  render(false);
})();
