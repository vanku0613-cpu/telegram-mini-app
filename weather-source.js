/* One validated weather response supplies the panel and landscape. */
(function(root){
 'use strict';
 const KEY='izmail.weather.icon-eu.v1';
 const MAX_AGE=2*60*60*1000;
 const FRESH_MS=10*60*1000;
 const codes=new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99]);
 let pending=null;
 function valid(d,now=Date.now()){
  const c=d?.current;if(!c)return false;
  return Number.isFinite(c.temperature_2m)&&c.temperature_2m>=-60&&c.temperature_2m<=60&&codes.has(c.weather_code)&&Number.isFinite(c.wind_speed_10m)&&c.wind_speed_10m>=0&&c.wind_speed_10m<=100&&Number.isFinite(c.time)&&now-c.time*1000<=MAX_AGE&&c.time*1000-now<=30*60000;
 }
 function readCache(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
 function isFresh(d,now=Date.now()){return valid(d,now)&&Number.isFinite(d._cachedAt)&&now-d._cachedAt<FRESH_MS}
 function url(model){return 'https://api.open-meteo.com/v1/forecast?latitude=45.35&longitude=28.84&models='+model+'&current=temperature_2m,weather_code,wind_speed_10m,precipitation,rain,showers,snowfall,cloud_cover,is_day&daily=sunrise,sunset&forecast_days=2&wind_speed_unit=ms&timeformat=unixtime&timezone=Europe%2FKyiv'}
 function timeOfDay(daily,now=Date.now()){
  if(!daily || !Array.isArray(daily.time))return null;
  const i=daily.time.findIndex((t,i)=>now>=t*1000&&now<(daily.time[i+1]||t+86400)*1000);
  if(i<0)return null;const rise=daily.sunrise?.[i]*1000,set=daily.sunset?.[i]*1000;
  if(!Number.isFinite(rise)||!Number.isFinite(set)||set<=rise)return null;
  if(now<rise-1800000||now>=set+1800000)return 'night';
  if(now<rise+3600000)return 'morning';
  if(now>=set-3600000)return 'evening';
  return 'day';
 }
 async function requestModel(model){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
  try{
   const response=await fetch(url(model),{cache:'no-cache',signal:controller.signal});
   if(!response.ok)throw Error('weather-http');
   const data=await response.json();
   if(!valid(data))throw Error('weather-data');
   data.provider=model==='icon_eu'?'DWD ICON Europe / Open-Meteo':'ECMWF IFS / Open-Meteo';
   data._cachedAt=Date.now();
   try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}
   return data;
  }finally{clearTimeout(timer)}
 }
 async function update(){
  for(const model of ['icon_eu','ecmwf_ifs']){try{return await requestModel(model)}catch{}}
  const cached=readCache();if(valid(cached))return cached;
  throw Error('weather-unavailable');
 }
 function load(options={}){
  const cached=readCache();
  if(!options.force&&isFresh(cached))return Promise.resolve(cached);
  if(pending)return pending;
  pending=update().finally(()=>{pending=null});
  return pending;
 }
 const api={load,valid,url,timeOfDay,isFresh};if(typeof module==='object'&&module.exports)module.exports=api;else root.izmailWeatherSource=api;
})(typeof window==='object'?window:globalThis);
