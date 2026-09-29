/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — ЕДИНЫЙ ФАЙЛ НАСТРОЕК

   ВАЖНО:
   index.html после этой версии больше не трогаем.
   Все будущие изменения делаем здесь: positions, links,
   weather, rain, snow, timings and additional code.
   ========================================================= */

window.IZMAIL_SETTINGS = {

  /* ---------- ПОЛОЖЕНИЕ ЭЛЕМЕНТОВ ---------- */
  layout: {
    viewerTop: "29.05%",
    topRowTop: "32.15%",
    searchTop: "37.50%",
    cardsTop: "43.25%",
    groupsTop: "81.15%",
    bottomTop: "88.05%",
    agreementTop: "95.25%",

    /* Высота зоны дождя/снега поверх верхней фотографии */
    weatherStageHeight: "41.5%"
  },

  /* ---------- ПОГОДА / ГОРОД ---------- */
  weather: {
    latitude: 45.35,
    longitude: 28.84,
    timezone: "Europe/Kyiv"
  },

  /* ---------- ВРЕМЯ СУТОК ---------- */
  time: {
    morningStart: 6,
    dayStart: 11,
    eveningStart: 17,
    nightStart: 21
  },

  /* ---------- СЕЗОНЫ ---------- */
  seasons: {
    winter: [12, 1, 2],
    spring: [3, 4, 5],
    summer: [6, 7, 8]
    /* остальные месяцы = осень */
  },

  /* ---------- ЧАСТОТА ОБНОВЛЕНИЯ ---------- */
  updates: {
    clockCheckMs: 60000,       // проверка времени суток — 1 минута
    sceneWeatherMs: 600000,    // погода для фона — 10 минут
    weatherPanelMs: 600000,    // блок погоды — 10 минут
    currencyMs: 1800000,       // курс НБУ — 30 минут
    viewIntervalMs: 180000     // +1 просмотр не чаще чем раз в 3 минуты
  },

  /* ---------- ДОЖДЬ / СНЕГ ---------- */
  effects: {
    fadeStart: 0.72,
    fadeEnd: 1.00,

    rain: {
      count: 118,
      frontEvery: 5,

      frontMinLength: 8,
      frontLengthRange: 7,
      backMinLength: 5,
      backLengthRange: 5,

      frontMinSpeed: 190,
      frontSpeedRange: 150,
      backMinSpeed: 155,
      backSpeedRange: 120,

      driftMin: 24,
      driftRange: 20,

      frontAlpha: 0.26,
      frontAlphaRange: 0.20,
      backAlpha: 0.18,
      backAlphaRange: 0.16,

      frontWidth: 0.82,
      frontWidthRange: 0.48,
      backWidth: 0.56,
      backWidthRange: 0.32
    },

    snow: {
      count: 78,
      minRadius: 0.55,
      radiusRange: 1.15,
      minSpeed: 11,
      speedRange: 18,
      driftMin: 5,
      driftRange: 10,
      alpha: 0.34,
      alphaRange: 0.34
    }
  },

  /* ---------- ССЫЛКИ ---------- */
  links: {
    mainGroup: "https://t.me/SPRAVOCHNIK_IZMAIL",
    shelter: "./ukrytia/",
    agreement: "./soglashenie/",
    ads: "https://t.me/Vanku13",
    currency: "https://minfin.com.ua/currency/izmail/",
    groups: "./our-groups-menu/",
    home: "./"
  },

  /* ---------- ССЫЛКИ КАТЕГОРИЙ ---------- */
  categoryLinks: {
    "Здоровье и уход": "",
    "Транспорт / Такси": "",
    "Услуги и мастера": "",
    "Продукты питания": "",
    "Коммунальные службы": "",
    "Работа / Вакансии": "https://t.me/rabota_v_izmaile",
    "Образование и развитие": "",
    "Отдых • Жильё • Море": ""
  },

  /*
    При необходимости сюда можно потом положить новые
    сезонные изображения, НЕ меняя index.html:

    seasonImages: {
      spring: "./assets/spring.webp",
      summer: "./assets/summer.webp",
      autumn: "./assets/autumn.webp",
      winter: "./assets/winter.webp"
    }
  */
  seasonImages: {}
};


/* =========================================================
   ПРИМЕНЕНИЕ ВИЗУАЛЬНЫХ НАСТРОЕК
   Этот блок менять не нужно.
   ========================================================= */
(function(cfg){
  var l = cfg.layout || {};

  var css = [
    ".viewer{top:" + (l.viewerTop || "29.05%") + " !important;}",
    ".top-row{top:" + (l.topRowTop || "32.15%") + " !important;}",
    ".search-wrap{top:" + (l.searchTop || "37.50%") + " !important;}",
    ".cards{top:" + (l.cardsTop || "43.25%") + " !important;}",
    ".groups{top:" + (l.groupsTop || "81.15%") + " !important;}",
    ".bottom{top:" + (l.bottomTop || "88.05%") + " !important;}",
    ".agreement{top:" + (l.agreementTop || "95.25%") + " !important;}",
    ".scene-layer{height:" + (l.weatherStageHeight || "41.5%") + " !important;}"
  ].join("\n");

  var style = document.createElement("style");
  style.id = "izmail-settings-style";
  style.textContent = css;
  document.head.appendChild(style);
})(window.IZMAIL_SETTINGS);


/* =========================================================
   ДОПОЛНИТЕЛЬНЫЕ ИЗМЕНЕНИЯ НА БУДУЩЕЕ
   Если позже понадобится новая функция, дизайн, кнопка,
   надпись или поведение — код добавляем СЮДА.
   index.html при этом не меняем.
   ========================================================= */

window.addEventListener("DOMContentLoaded", function(){
  /* Пока здесь ничего дополнительного не требуется. */
});
