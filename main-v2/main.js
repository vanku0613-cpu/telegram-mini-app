
(function(){
  "use strict";

  var CFG = window.IZMAIL_SETTINGS || {};

  var DEFAULT_SEASON_IMAGES = {"spring":"../assets/izmail-home.jpg","summer":"../assets/izmail-home.jpg","autumn":"../assets/izmail-home-autumn.webp","winter":"../assets/izmail-home-winter.webp"};
  var NIGHT_SEASON_IMAGES = {"spring":"../assets/izmail-home-summer-night.webp","summer":"../assets/izmail-home-summer-night.webp","autumn":"../assets/izmail-home-autumn-night.webp","winter":"../assets/izmail-home-winter-night.webp"};
  var DAY_SEASON_IMAGES = {"spring":"../assets/izmail-home-summer-day.webp","summer":"../assets/izmail-home-summer-day.webp","autumn":"../assets/izmail-home-autumn-day.webp","winter":"../assets/izmail-home-winter-day.webp"};
  var SEASON_IMAGES = Object.assign({}, DEFAULT_SEASON_IMAGES, CFG.seasonImages || {});

  var app = document.getElementById("app");
  // Keep a small visible gap above the weather panel at every app scale.
  function placeViewCounter() {
    var viewer = document.querySelector('.viewer');
    var weather = document.querySelector('.weather-panel');
    if (!viewer || !weather) return;
    viewer.style.translate = '0 0';
    var box = viewer.getBoundingClientRect();
    var scale = box.height / viewer.offsetHeight || 1;
    var shift = (weather.getBoundingClientRect().top - box.bottom - 3) / scale;
    viewer.style.translate = '0 ' + Math.max(0, shift) + 'px';
  }
  window.addEventListener('resize', function () { requestAnimationFrame(function () { requestAnimationFrame(placeViewCounter); }); });
  if (window.ResizeObserver) {
    var counterLayoutObserver = new ResizeObserver(placeViewCounter);
    counterLayoutObserver.observe(app);
    counterLayoutObserver.observe(document.querySelector('.viewer'));
    counterLayoutObserver.observe(document.querySelector('.weather-panel'));
  }
  window.addEventListener('load', placeViewCounter);
  requestAnimationFrame(placeViewCounter);
  var bgMain = document.getElementById("bgMain");
  var bgBlur = document.getElementById("bgBlur");
  var sceneLayer = document.getElementById("sceneLayer");
  var sceneBadge = document.getElementById("sceneBadge");
  var canvas = document.getElementById("weatherCanvas");
  var ctx = canvas ? canvas.getContext("2d") : null;

  var seasonBtn = null;
  var timeBtn = null;
  var weatherBtn = null;
  var autoBtn = null;

  var seasons = ["spring","summer","autumn","winter"];
  var times = ["morning","day","evening","night"];
  var weathers = ["clear","cloudy","rain","snow"];

  var labels = {
    spring:"ВЕСНА", summer:"ЛЕТО", autumn:"ОСЕНЬ", winter:"ЗИМА",
    morning:"УТРО", day:"ДЕНЬ", evening:"ВЕЧЕР", night:"НОЧЬ",
    clear:"ЯСНО", cloudy:"ОБЛАЧНО", rain:"ДОЖДЬ", snow:"СНЕГ"
  };

  var state = {
    season:(CFG.initial && CFG.initial.season) || "summer",
    time:(CFG.initial && CFG.initial.time) || "morning",
    weather:(CFG.initial && CFG.initial.weather) || "clear"
  };

  state.intensity=0;
  state.wind=0;
  state.afterRain=false;
  state.thunder=false;state.hail=false;state.fog=false;
  var leaves=[],hailstones=[];
  var lightningAt=0;
  var reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  var particles = [];
  var fxMode = "clear";
  var lastFrame = performance.now();
  var autoTimer = null;
  var autoIndex = 0;

  var autoScenes = [];

  function indexOfValue(list, value){
    for(var i=0;i<list.length;i++) if(list[i]===value) return i;
    return 0;
  }

  function nextValue(list,value){
    var i=indexOfValue(list,value);
    return list[(i+1)%list.length];
  }

  function setAutoActive(active){
    if(!autoBtn) return;
    if(active) autoBtn.classList.add("active");
    else autoBtn.classList.remove("active");
  }

  function resizeCanvas(){
    if(!canvas || !ctx || !sceneLayer) return;
    var r=sceneLayer.getBoundingClientRect();
    var dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(r.width*dpr));
    canvas.height=Math.max(1,Math.round(r.height*dpr));
    canvas.style.width=r.width+"px";
    canvas.style.height=r.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function seedParticles(mode){
    particles=[];
    if(!sceneLayer) return;
    var r=sceneLayer.getBoundingClientRect();

    if(mode==="rain"){
      var rc=(CFG.effects && CFG.effects.rain) || {};
      var rainCount=Math.round(Number(rc.count || 118)*state.intensity);
      var frontEvery=Number(rc.frontEvery || 5);
      for(var i=0;i<rainCount;i++){
        var front = (i % frontEvery === 0);
        particles.push({
          x:Math.random()*r.width,
          y:Math.random()*r.height,
          len:(front ? Number(rc.frontMinLength || 8) : Number(rc.backMinLength || 5))
              + Math.random()*(front ? Number(rc.frontLengthRange || 7) : Number(rc.backLengthRange || 5)),
          speed:(front ? Number(rc.frontMinSpeed || 190) : Number(rc.backMinSpeed || 155))
                + Math.random()*(front ? Number(rc.frontSpeedRange || 150) : Number(rc.backSpeedRange || 120)),
          drift:-Number(rc.driftMin || 24)-Math.random()*Number(rc.driftRange || 20),
          alpha:(front ? Number(rc.frontAlpha || .26) : Number(rc.backAlpha || .18))
                + Math.random()*(front ? Number(rc.frontAlphaRange || .20) : Number(rc.backAlphaRange || .16)),
          width:(front ? Number(rc.frontWidth || .82) : Number(rc.backWidth || .56))
                + Math.random()*(front ? Number(rc.frontWidthRange || .48) : Number(rc.backWidthRange || .32))
        });
      }
    }

    if(mode==="snow"){
      var sc=(CFG.effects && CFG.effects.snow) || {};
      var snowCount=Math.min(210,Math.round(Number(sc.count || 78)*1.5*state.intensity));
      for(var j=0;j<snowCount;j++){
        particles.push({
          x:Math.random()*r.width,
          y:Math.random()*r.height,
          radius:.7+Math.random()*1.65,
          speed:32+Math.random()*44,
          drift:-Number(sc.driftMin || 5)+Math.random()*Number(sc.driftRange || 10),
          phase:Math.random()*Math.PI*2,
          alpha:Number(sc.alpha || .34)+Math.random()*Number(sc.alphaRange || .34)
        });
      }
    }
  }

  function seedWind(){
    if(state.wind<5 || state.weather==='rain' || state.weather==='snow') return;
    var r=sceneLayer.getBoundingClientRect();
    var windCount=Math.min(36,18+Math.round(state.wind*.65));
    for(var i=0;i<windCount;i++) particles.push({x:Math.random()*r.width,y:Math.random()*r.height,len:14+Math.random()*24,speed:45+state.wind*8,alpha:.07+Math.random()*.10});
  }

  function seedSeasonDetails(){
    leaves=[];hailstones=[];
    var r=sceneLayer.getBoundingClientRect();
    if(state.season==='autumn' && state.weather!=='snow' && !state.hail){
      var leafCount=Math.min(28,10+Math.round(state.wind*.8));
      for(var i=0;i<leafCount;i++)leaves.push({x:Math.random()*r.width,y:i<3?Math.random()*r.height*.55:-Math.random()*r.height*1.4,size:2.2+Math.random()*3.1,angle:Math.random()*6.28,speed:15+state.wind*.8+Math.random()*18,phase:Math.random()*6.28,alpha:.68+Math.random()*.24});
    }
    if(state.hail){
      for(var j=0;j<42;j++)hailstones.push({x:Math.random()*r.width,y:Math.random()*r.height,size:1+Math.random()*1.3,speed:220+Math.random()*120});
    }
    lightningAt=performance.now()+4500;
  }
  function drawSeasonDetails(now,dt,r){
    for(var i=0;i<leaves.length;i++){
      var leaf=leaves[i];leaf.y+=leaf.speed*dt;leaf.phase+=dt;leaf.angle+=dt*.9;
      leaf.x+=(Math.sin(leaf.phase)*9-state.wind*1.7)*dt;
      if(leaf.y>r.height+12||leaf.x<-15){leaf.y=-20-Math.random()*r.height;leaf.x=Math.random()*r.width;}
      if(leaf.y<0)continue;
      ctx.save();ctx.translate(leaf.x,leaf.y);ctx.rotate(leaf.angle);ctx.scale(Math.cos(leaf.phase)*.35+.65,1);
      ctx.beginPath();ctx.ellipse(0,0,leaf.size*.48,leaf.size,0,0,Math.PI*2);ctx.fillStyle='rgba(204,126,44,'+(leaf.alpha*fadeByY(leaf.y,r.height))+')';ctx.fill();ctx.restore();
    }
    for(var j=0;j<hailstones.length;j++){
      var ice=hailstones[j];ice.y+=ice.speed*dt;ice.x-=state.wind*4*dt;
      if(ice.y>r.height+8||ice.x<-8){ice.y=-10-Math.random()*60;ice.x=Math.random()*r.width;}
      ctx.beginPath();ctx.arc(ice.x,ice.y,ice.size,0,Math.PI*2);ctx.fillStyle='rgba(224,241,255,'+(.76*fadeByY(ice.y,r.height))+')';ctx.fill();
    }
    // A slow single flash is symbolic; never mimic a fast strobe.
    if(state.thunder){
      var flashAge=now-lightningAt;
      if(flashAge>=0 && flashAge<500){
        var alpha=Math.sin(flashAge/500*Math.PI);
        ctx.fillStyle='rgba(195,216,249,'+(alpha*.09)+')';ctx.fillRect(0,0,r.width,r.height*.72);
        ctx.beginPath();ctx.moveTo(r.width*.91,r.height*.53);ctx.lineTo(r.width*.86,r.height*.59);ctx.lineTo(r.width*.90,r.height*.58);ctx.lineTo(r.width*.82,r.height*.69);
        ctx.strokeStyle='rgba(222,235,255,'+(alpha*.42)+')';ctx.lineWidth=1.1;ctx.stroke();
      }else if(flashAge>=500){lightningAt=now+11000+Math.random()*7000;}
    }
  }

  function fadeByY(y,height){
    var p=y/Math.max(height,1);
    var fx=(CFG.effects || {});
    var start=Number(fx.fadeStart == null ? .72 : fx.fadeStart);
    var end=Number(fx.fadeEnd == null ? 1 : fx.fadeEnd);
    if(p<=start) return 1;
    if(p>=end) return 0;
    return Math.max(0,1-(p-start)/Math.max(.01,end-start));
  }

  function drawWeather(now){
    if(!ctx || !sceneLayer){
      requestAnimationFrame(drawWeather);
      return;
    }

    if(document.hidden){lastFrame=now;requestAnimationFrame(drawWeather);return;}
    if(reducedMotion.matches){ctx.clearRect(0,0,canvas.width,canvas.height);lastFrame=now;requestAnimationFrame(drawWeather);return;}
    var r=sceneLayer.getBoundingClientRect();
    var dt=Math.min((now-lastFrame)/1000,.05);
    lastFrame=now;
    ctx.clearRect(0,0,r.width,r.height);

    if(fxMode==="rain"){
      ctx.lineCap="round";

      for(var i=0;i<particles.length;i++){
        var p=particles[i];
        p.y+=p.speed*(.8+state.intensity*.35)*dt;
        p.x+=(p.drift-state.wind*6)*dt;

        if(p.y>r.height+16 || p.x<-20){
          p.y=-10-Math.random()*45;
          p.x=Math.random()*r.width+20;
        }

        var f=fadeByY(p.y,r.height);
        if(f<=0) continue;

        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x+2.4+state.wind*.8,p.y-p.len*(.8+state.intensity*.3));
        ctx.strokeStyle="rgba(226,244,255,"+(p.alpha*f)+")";
        ctx.lineWidth=p.width;
        ctx.stroke();
      }
    }

    if(fxMode==="snow"){
      for(var j=0;j<particles.length;j++){
        var s=particles[j];
        s.phase+=dt*1.4;
        s.y+=s.speed*(.9+state.intensity*.25)*dt;
        s.x+=(s.drift-state.wind*3+Math.sin(s.phase)*3.2)*dt;

        if(s.y>r.height+7){
          s.y=-7-Math.random()*30;
          s.x=Math.random()*r.width;
        }
        if(s.x<-5) s.x=r.width+5;
        if(s.x>r.width+5) s.x=-5;

        var sf=fadeByY(s.y,r.height);
        if(sf<=0) continue;

        ctx.beginPath();
        ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);
        ctx.fillStyle="rgba(255,255,255,"+(s.alpha*sf)+")";
        ctx.fill();
      }
    }

    if(state.wind>=5 && fxMode!=='rain' && fxMode!=='snow'){
      for(var k=0;k<particles.length;k++){
        var w=particles[k];w.x-=w.speed*dt;
        if(w.x < -w.len){w.x=r.width+w.len;w.y=Math.random()*r.height;}
        ctx.beginPath();ctx.moveTo(w.x,w.y);ctx.quadraticCurveTo(w.x+w.len*.5,w.y-2,w.x+w.len,w.y);
        ctx.strokeStyle='rgba(221,239,246,'+(w.alpha*fadeByY(w.y,r.height))+')';ctx.lineWidth=.7;ctx.stroke();
      }
    }
    drawSeasonDetails(now,dt,r);
    requestAnimationFrame(drawWeather);
  }

  function updateButtons(){
    if(seasonBtn) seasonBtn.textContent="СЕЗОН · "+labels[state.season];
    if(timeBtn) timeBtn.textContent="ВРЕМЯ · "+labels[state.time];
    if(weatherBtn) weatherBtn.textContent="ПОГОДА · "+labels[state.weather];
  }

  // Keep stars inside sky regions, away from the title and circular logo.
  var starsLayer=document.getElementById('starsLayer');
  if(starsLayer){
    var starSeed=217;
    function starRandom(){starSeed=(starSeed*16807)%2147483647;return (starSeed-1)/2147483646;}
    for(var starIndex=0;starIndex<54;starIndex++){
      var star=document.createElement('i');
      var upper=starIndex<34;
      var size=.55+Math.pow(starRandom(),2)*1.55;
      star.className='sky-star';
      star.style.left=(upper?43+starRandom()*54:57+starRandom()*41)+'%';
      star.style.top=(upper?1+starRandom()*8:53+starRandom()*9)+'%';
      star.style.width=star.style.height=size+'px';
      star.style.setProperty('--star-alpha',String(.4+starRandom()*.55));
      star.style.setProperty('--twinkle-duration',(3+starRandom()*6)+'s');
      star.style.animationDelay=(-starRandom()*10)+'s';
      star.style.background=starIndex%7===0?'#ffecd7':starIndex%5===0?'#d2e6ff':'#f1f5ff';
      starsLayer.appendChild(star);
    }
  }
  var pendingBackground='';
  var backgroundRequest=0;
  function updateBackground(url){
    if(pendingBackground===url) return;
    pendingBackground=url;
    var request=++backgroundRequest;
    var image=new Image();
    image.onload=function(){
      if(request!==backgroundRequest)return;
      if(bgMain && bgMain.getAttribute('src')!==url)bgMain.src=url;
      if(bgBlur && bgBlur.getAttribute('src')!==url)bgBlur.src=url;
    };
    image.onerror=function(){if(request===backgroundRequest)pendingBackground='';};
    image.src=url;
  }
  var appliedScene="";
  function applyScene(source){
    var landscape=state.weather==='snow'?'winter':state.season;
    var lightsOn=state.time==='evening'||state.time==='night';
    updateBackground((state.time==="night"?NIGHT_SEASON_IMAGES:lightsOn?SEASON_IMAGES:DAY_SEASON_IMAGES)[landscape]);

    var sceneKey=[state.season,state.time,state.weather,state.intensity,Math.round(state.wind),state.thunder,state.hail,state.fog,state.afterRain].join(":");
    if(sceneKey===appliedScene) return;
    appliedScene=sceneKey;
    fxMode=state.weather;

    if(app)app.dataset.lamps=lightsOn?'on':'off';

    if(app){
      app.classList.remove("time-morning","time-day","time-evening","time-night");
      app.classList.add("time-"+state.time);
    }

    if(sceneLayer){
      sceneLayer.className="scene-layer "+state.time+" "+state.weather+(state.wind>=5?" windy":"")+(state.wind>=10?" strong-wind":"")+(state.weather==="rain"&&state.intensity>=1.4?" heavy-rain":"")+(state.thunder?" thunder":"")+(state.hail?" hail":"")+(state.fog?" fog":"")+(state.afterRain?" after-rain":"");
      sceneLayer.dataset.intensity=String(state.intensity);
    }

    if(sceneBadge){
      sceneBadge.textContent=(source==="auto" ? "АВТО · " : "ДЕМО · ")
        +labels[state.season]+" · "+labels[state.time]+" · "+labels[state.weather];
    }

    updateButtons();
    resizeCanvas();
    seedParticles(state.weather);
    seedWind();
    seedSeasonDetails();
  }


  function kyivHour(){
    try{
      var parts=new Intl.DateTimeFormat("en-GB",{
        timeZone:((CFG.weather && CFG.weather.timezone) || "Europe/Kyiv"),
        hour:"2-digit",
        hour12:false
      }).formatToParts(new Date());
      for(var i=0;i<parts.length;i++){
        if(parts[i].type==="hour") return parseInt(parts[i].value,10);
      }
    }catch(e){}
    return new Date().getHours();
  }

  function kyivMonth(){
    try{
      var parts=new Intl.DateTimeFormat("en-GB",{
        timeZone:((CFG.weather && CFG.weather.timezone) || "Europe/Kyiv"),
        month:"2-digit"
      }).formatToParts(new Date());
      for(var i=0;i<parts.length;i++){
        if(parts[i].type==="month") return parseInt(parts[i].value,10);
      }
    }catch(e){}
    return new Date().getMonth()+1;
  }

  function realSeason(){
    var m=kyivMonth();
    var sm=(CFG.seasons || {});
    var winter=sm.winter || [12,1,2];
    var spring=sm.spring || [3,4,5];
    var summer=sm.summer || [6,7,8];
    if(winter.indexOf(m)!==-1) return "winter";
    if(spring.indexOf(m)!==-1) return "spring";
    if(summer.indexOf(m)!==-1) return "summer";
    return "autumn";
  }

  var weatherSolar=null;
  function realTimeOfDay(){
    var solarTime=window.izmailWeatherSource.timeOfDay(weatherSolar);
    if(solarTime)return solarTime;
    var h=kyivHour();
    var tc=(CFG.time || {});
    var morning=Number(tc.morningStart == null ? 6 : tc.morningStart);
    var day=Number(tc.dayStart == null ? 11 : tc.dayStart);
    var evening=Number(tc.eveningStart == null ? 17 : tc.eveningStart);
    var night=Number(tc.nightStart == null ? 21 : tc.nightStart);
    if(h>=morning && h<day) return "morning";
    if(h>=day && h<evening) return "day";
    if(h>=evening && h<night) return "evening";
    return "night";
  }

  function weatherFromCode(code){
    if([71,73,75,77,85,86].indexOf(code)!==-1) return "snow";
    if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].indexOf(code)!==-1) return "rain";
    if([1,2,3,45,48].indexOf(code)!==-1) return "cloudy";
    return "clear";
  }

  function syncRealScene(){
    state.season=realSeason();
    state.time=realTimeOfDay();
    applyScene("live");
  }

  resizeCanvas();
  requestAnimationFrame(drawWeather);
  syncRealScene();

  setInterval(function(){
    var oldTime=state.time;
    var oldSeason=state.season;
    state.time=realTimeOfDay();
    state.season=realSeason();
    if(oldTime!==state.time || oldSeason!==state.season) applyScene("live");
  },Number((CFG.updates && CFG.updates.clockCheckMs) || 60000));

  // The weather panel and animation share one response below.

  /* Shared view counter; loaded independently of other page features. */
  var viewCounterScript = document.createElement("script");
  viewCounterScript.src = "../view-counter.js?v=6";
  document.head.appendChild(viewCounterScript);

  /* Search results are handled by directory-search.js. */
  var cards=document.querySelectorAll(".card");

  // Keep the saturated blue perimeter visible after a tap, like the service directories.
  document.addEventListener("pointerdown",function(event){
    var searchControl=event.target.closest && event.target.closest("#directorySearchToggle,#directorySearchClear,.search-real");
    if(searchControl){
      var searchWrap=searchControl.closest(".search-wrap");
      if(searchWrap){
        searchWrap.classList.add("tap-lit");
        setTimeout(function(){searchWrap.classList.remove("tap-lit");},420);
      }
    }
    var control=event.target.closest && event.target.closest("#app .pressable");
    if(!control) return;
    control.classList.add("tap-lit");
    setTimeout(function(){control.classList.remove("tap-lit");},420);
  },{passive:true});

  /* LIVE WEATHER PANEL */
  var weatherPending=false;
  function loadWeather(force){
    if(weatherPending) return;
    weatherPending=true;
    window.izmailWeatherSource.load({force:force===true})
      .then(function(d){
        var c=d.current;
        weatherSolar=d.daily||null;
        var panel=document.getElementById("weatherPanel");
        if(panel){panel.dataset.source=d.provider;panel.dataset.weatherTime=String(c.time);panel.title="Измаил · "+d.provider+" · расчёт на "+new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Kyiv',hour:'2-digit',minute:'2-digit'}).format(new Date(c.time*1000));}

        var names={
          0:"Ясно",1:"Преимущественно ясно",2:"Переменная облачность",3:"Облачно",
          45:"Туман",48:"Туман",51:"Морось",53:"Морось",55:"Сильная морось",
          61:"Небольшой дождь",63:"Дождь",65:"Сильный дождь",
          56:"Ледяная морось",57:"Сильная ледяная морось",66:"Ледяной дождь",67:"Сильный ледяной дождь",77:"Снежные зёрна",85:"Снегопад",86:"Сильный снегопад",97:"Сильная гроза",
          71:"Небольшой снег",73:"Снег",75:"Сильный снег",
          80:"Ливень",81:"Ливень",82:"Сильный ливень",95:"Гроза",96:"Гроза с градом",99:"Гроза с сильным градом"
        };
        var icons={
          0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
          51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
          71:"🌨️",73:"❄️",75:"❄️",80:"🌦️",81:"🌧️",82:"🌧️",
          95:"⛈️",96:"⛈️",99:"⛈️"
        };
        var temp=document.getElementById("weatherTemp");
        var txt=document.getElementById("weatherText");
        var icon=document.getElementById("weatherIcon");
        if(c.weather_code == null || !isFinite(Number(c.weather_code))) throw new Error("Invalid weather code");
        var code=Number(c.weather_code);
        var profile=window.izmailWeatherProfile(code,c.wind_speed_10m);
        state.weather=profile.weather;state.intensity=profile.intensity;state.wind=profile.wind;state.thunder=profile.thunder;state.hail=profile.hail;state.fog=profile.fog;
        var lastRain=0;
        try{
          lastRain=Number(localStorage.getItem("izmail.weather.last-rain.v1"))||0;
          if(profile.weather==="rain"){
            lastRain=Date.now();
            localStorage.setItem("izmail.weather.last-rain.v1",String(lastRain));
          }
        }catch(_){if(profile.weather==="rain")lastRain=Date.now();}
        var currentTime=realTimeOfDay();
        state.afterRain=profile.weather!=="rain"&&profile.weather!=="snow"&&!profile.fog&&currentTime!=="night"&&Date.now()-lastRain<45*60*1000;
        syncRealScene();
        if(temp && isFinite(Number(c.temperature_2m))) temp.textContent=Math.round(Number(c.temperature_2m))+"°C";
        if(txt) txt.textContent=names[code]||"Погода";
        if(icon) icon.textContent=(state.time==="night" && (code===0 || code===1))?"🌙":(profile.thunder?"⛈️":icons[code]||(profile.weather==="rain"?"🌧️":profile.weather==="snow"?"❄️":"🌤️"));
      })
      .catch(function(){
        var panel=document.getElementById("weatherPanel"),txt=document.getElementById("weatherText");
        if(panel && !panel.dataset.weatherTime && txt)txt.textContent="Погода недоступна";
        if(panel && panel.dataset.weatherTime && Date.now()-Number(panel.dataset.weatherTime)*1000>7200000 && txt)txt.textContent="Данные погоды устарели";
        if(panel)panel.title="Не удалось обновить погоду. Последние данные сохранены.";
      })
      .finally(function(){weatherPending=false;});
  }

  /* Frank Exchange rates from the shared, periodically updated JSON. */
  var frankRatesScript=document.createElement("script");
  frankRatesScript.src="./frank-rates.js?v=8";
  document.head.appendChild(frankRatesScript);

  loadWeather();
  setInterval(function(){if(!document.hidden)loadWeather();},300000);
  window.addEventListener("online",function(){loadWeather(true);});

  window.addEventListener("izmail:refresh", function(){
    syncRealScene();
    loadWeather(true);
  });

  window.addEventListener("focus", function(){
    syncRealScene();
    loadWeather();
  });

  document.addEventListener("visibilitychange", function(){
    if (!document.hidden) {
      syncRealScene();
      loadWeather();
    }
  });


  /* LINKS */
  var logo=document.getElementById("mainLogoHotspot");
  if(logo) logo.href=((CFG.links && CFG.links.mainGroup) || "https://t.me/SPRAVOCHNIK_IZMAIL");

  var shelter=document.getElementById("shelterBtn");
  if(shelter) shelter.href=((CFG.links && CFG.links.shelter) || "../ukrytia/");

  var agreement=document.getElementById("agreement");
  if(agreement) agreement.href=((CFG.links && CFG.links.agreement) || "../soglashenie/");

  var ads=document.getElementById("adsBtn");
  if(ads) ads.href=((CFG.links && CFG.links.ads) || "https://t.me/Vanku13");

  var currency=document.getElementById("currencyPanel");
  if(currency){
    currency.style.cursor="pointer";
    currency.addEventListener("click",function(event){
      if(event.target.closest("a")) return;
      window.location.href="https://t.me/frankexange";
    });
  }

  function guaranteeButtonNavigation(control,target){
    if(!control || !target) return;
    control.setAttribute("data-nav",target);
  }

  var groups=document.getElementById("groupsBtn");
  guaranteeButtonNavigation(groups,((CFG.links && CFG.links.groups) || "../our-groups-menu/"));

  var zags=document.getElementById("zagsBtn");
  guaranteeButtonNavigation(zags,((CFG.links && CFG.links.zags) || "../zags/"));

  var home=document.getElementById("homeBtn");
  if(home) home.addEventListener("click",function(){
    window.dispatchEvent(new CustomEvent("izmail:refresh"));
  });

  var fav=document.getElementById("favBtn");
  if(fav) fav.addEventListener("click",function(){
    window.location.href="../health-care/#favorites";
  });

  for(var ci=0;ci<cards.length;ci++){
    var card=cards[ci];
    var title=card.getAttribute("data-title")||"";
    var target=(CFG.categoryLinks || {})[title] || "";
    if(!target && title==="Работа / Вакансии") target="https://t.me/rabota_v_izmaile";
    guaranteeButtonNavigation(card,target);
  }

})();

/* Keep every main-card title fully visible at browser and OS text zoom levels. */
(function(){
  "use strict";

  var app=document.getElementById("app");
  if(!app) return;

  var frame=0;

  function fitMainCardTitles(){
    frame=0;
    var titles=Array.prototype.slice.call(document.querySelectorAll(".card-copy strong,.groups-title"));
    var subtitles=Array.prototype.slice.call(document.querySelectorAll(".card-copy small"));
    var navLabels=Array.prototype.slice.call(document.querySelectorAll(".bottom .nav > span:not(.nav-icon):not(.press-glow)"));

    titles.forEach(function(title){title.style.fontSize="";});
    subtitles.forEach(function(subtitle){subtitle.style.fontSize="";});
    navLabels.forEach(function(label){label.style.fontSize="";});
    var desktop=window.matchMedia("(min-width:700px) and (hover:hover) and (pointer:fine)").matches;
    var titleFloor=desktop ? 14 : 7.4;
    var subtitleFloor=desktop ? 11 : 7.2;

    titles.forEach(function(title){
      var span=title.querySelector("span");
      if(span) span.style.transform="none";
    });

    titles.forEach(function(title){
      var box=title.classList.contains("groups-title") ? title : (title.closest(".card-copy")||title.parentElement);
      if(!box) return;

      var available=Math.max(0,box.clientWidth-2);
      var compression=title.closest(".expanded-label") ? .86 : 1;
      var required=title.scrollWidth*compression;
      if(!available || required<=available) return;

      var current=parseFloat(getComputedStyle(title).fontSize);
      if(!isFinite(current) || current<=0) return;
      title.style.fontSize=Math.max(titleFloor,current*(available/required)*.985).toFixed(2)+"px";
    });

    subtitles.forEach(function(subtitle){
      var available=Math.max(0,subtitle.clientWidth-2);
      var required=subtitle.scrollWidth;
      if(!available || required<=available) return;
      var current=parseFloat(getComputedStyle(subtitle).fontSize);
      if(!isFinite(current) || current<=0) return;
      subtitle.style.fontSize=Math.max(subtitleFloor,current*(available/required)*.985).toFixed(2)+"px";
    });

    navLabels.forEach(function(label){
      var nav=label.closest(".nav");
      if(!nav) return;
      var icon=nav.querySelector(".nav-icon");
      var available=Math.max(0,nav.clientWidth-(icon ? icon.getBoundingClientRect().width : 0)-12);
      var required=label.scrollWidth;
      if(!available || required<=available) return;
      var current=parseFloat(getComputedStyle(label).fontSize);
      if(!isFinite(current) || current<=0) return;
      label.style.fontSize=Math.max(9,current*(available/required)*.96).toFixed(2)+"px";
    });
  }

  function scheduleFit(){
    if(frame) cancelAnimationFrame(frame);
    frame=requestAnimationFrame(fitMainCardTitles);
  }

  if("ResizeObserver" in window){
    new ResizeObserver(scheduleFit).observe(app);
  }
  window.addEventListener("resize",scheduleFit,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",scheduleFit,{passive:true});
  }
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(scheduleFit);
  }
  scheduleFit();
  setTimeout(scheduleFit,250);
})();

