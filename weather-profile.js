/* Visual precipitation intensity follows Open-Meteo WMO codes, not a forecast guess. */
(function(root){
  'use strict';
  function profile(code,wind){
    code=Number(code);
    const rain={51:.35,53:.55,55:.75,56:.35,57:.75,61:.55,63:1,65:1.8,66:.55,67:1.8,80:.8,81:1.4,82:2.2,95:1.8,96:2,97:2.2,99:2.2};
    const snow={71:.5,73:1,75:1.6,77:.4,85:.7,86:1.6};
    const weather=code in rain?'rain':code in snow?'snow':[2,3,45,48].includes(code)?'cloudy':'clear';
    return {weather,thunder:[95,96,97,99].includes(code),hail:[96,99].includes(code),fog:[45,48].includes(code),intensity:rain[code]||snow[code]||0,wind:Math.max(0,Math.min(35,Number(wind)||0))};
  }
  if(typeof module==='object'&&module.exports)module.exports=profile;
  else root.izmailWeatherProfile=profile;
})(typeof window==='object'?window:globalThis);
