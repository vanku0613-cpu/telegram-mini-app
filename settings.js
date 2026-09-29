/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — ЕДИНЫЙ ФАЙЛ НАСТРОЕК

   index.html больше НЕ ТРОГАЕМ.
   Все изменения делаем только здесь.
   ========================================================= */

window.IZMAIL_SETTINGS = {

  /* =========================================================
     ОБЩИЙ РАЗМЕР
     ========================================================= */

  design: {

    /* Уже подобранный идеальный размер */
    masterScale: 1.09

  },


  /* =========================================================
     ПОЛОЖЕНИЕ ИНТЕРФЕЙСА
     ========================================================= */

  layout: {

    /*
      ВЕСЬ ИНТЕРФЕЙС ОПУСКАЕМ НИЖЕ.

      Было: 0.90%
      Теперь: 1.80%

      Фон и круглая аватарка НЕ двигаются.
    */
    menuDown: "1.80%",


    /* Базовые положения */

    viewerTop: "32.90%",

    topRowTop: "36.60%",

    searchTop: "43.50%",

    cardsTop: "51.00%",

    groupsTop: "91.20%",

    bottomTop: "98.20%",

    agreementTop: "105.00%",


    /* Одинаковый боковой отступ */

    menuLeft: "4.88%",

    menuWidth: "90.24%",


    /* Одинаковое расстояние между большими кнопками */

    cardsGap: "0.75vw",


    /* Погодная зона */

    weatherStageHeight: "41.5%"

  },


  /* =========================================================
     ПОГОДА — ИЗМАИЛ
     ========================================================= */

  weather: {

    latitude: 45.35,

    longitude: 28.84,

    timezone: "Europe/Kyiv"

  },


  /* =========================================================
     ВРЕМЯ СУТОК
     ========================================================= */

  time: {

    morningStart: 6,

    dayStart: 11,

    eveningStart: 17,

    nightStart: 21

  },


  /* =========================================================
     ВРЕМЕНА ГОДА
     ========================================================= */

  seasons: {

    winter: [12, 1, 2],

    spring: [3, 4, 5],

    summer: [6, 7, 8]

    /* Остальные месяцы = осень */

  },


  /* =========================================================
     ОБНОВЛЕНИЕ
     ========================================================= */

  updates: {

    clockCheckMs: 60000,

    sceneWeatherMs: 600000,

    weatherPanelMs: 600000,

    currencyMs: 1800000,

    viewIntervalMs: 180000

  },


  /* =========================================================
     ЭФФЕКТЫ ПОГОДЫ
     ========================================================= */

  effects: {

    fadeStart: 0.72,

    fadeEnd: 1.00,


    /* ДОЖДЬ */

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


    /* СНЕГ */

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


  /* =========================================================
     ОСНОВНЫЕ ССЫЛКИ
     ========================================================= */

  links: {

    mainGroup:
      "https://t.me/SPRAVOCHNIK_IZMAIL",

    shelter:
      "./ukrytia/",

    agreement:
      "./soglashenie/",

    ads:
      "https://t.me/Vanku13",

    currency:
      "https://minfin.com.ua/currency/izmail/",

    groups:
      "./our-groups-menu/",

    home:
      "./"

  },


  /* =========================================================
     ССЫЛКИ КАТЕГОРИЙ
     ========================================================= */

  categoryLinks: {

    "Здоровье и уход":
      "",

    "Транспорт / Такси":
      "",

    "Услуги и мастера":
      "",

    "Продукты питания":
      "",

    "Коммунальные службы":
      "",

    "Работа / Вакансии":
      "https://t.me/rabota_v_izmaile",

    "Образование и развитие":
      "",

    "Отдых • Жильё • Море":
      ""

  },


  seasonImages: {}

};


/* =========================================================
   ПРИМЕНЕНИЕ НАСТРОЕК
   ========================================================= */

(function(cfg) {

  var layout =
    cfg.layout || {};

  var design =
    cfg.design || {};

  var scale =
    Number(
      design.masterScale || 1
    );

  var down =
    layout.menuDown || "0%";

  var menuLeft =
    layout.menuLeft || "4.88%";

  var menuWidth =
    layout.menuWidth || "90.24%";


  var css = [

    /* =====================================================
       НИЖНЯЯ ЧАСТЬ НЕ ОБРЕЗАЕТСЯ
       ===================================================== */

    "html{" +
      "overflow:hidden !important;" +
    "}",

    "body{" +
      "overflow:visible !important;" +
    "}",

    "#app{" +
      "overflow:visible !important;" +
    "}",


    /* =====================================================
       ФОН

       НЕ ДВИГАЕМ.
       ===================================================== */

    ".bg-main{" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* =====================================================
       ПОГОДНЫЕ ЭФФЕКТЫ

       Остаются на фоне.
       ===================================================== */

    ".scene-layer{" +

      "height:" +
      (layout.weatherStageHeight || "41.5%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* =====================================================
       СЧЁТЧИК
       ===================================================== */

    ".viewer{" +

      "top:calc(" +
      (layout.viewerTop || "32.90%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       ПОГОДА / КУРС / УКРЫТИЕ
       ===================================================== */

    ".top-row{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (layout.topRowTop || "36.60%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       ПОИСК
       ===================================================== */

    ".search-wrap{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (layout.searchTop || "43.50%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       8 БОЛЬШИХ КНОПОК
       ===================================================== */

    ".cards{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (layout.cardsTop || "51.00%") +
      " + " +
      down +
      ") !important;" +

      "gap:" +
      (layout.cardsGap || "0.75vw") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       НАШИ ГРУППЫ
       ===================================================== */

    ".groups{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (layout.groupsTop || "91.20%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       ГЛАВНАЯ / РЕКЛАМА / ИЗБРАННОЕ
       ===================================================== */

    ".bottom{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (layout.bottomTop || "98.20%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       СОГЛАШЕНИЕ
       ===================================================== */

    ".agreement{" +

      "top:calc(" +
      (layout.agreementTop || "105.00%") +
      " + " +
      down +
      ") !important;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       КРУГЛАЯ АВАТАРКА

       НЕ ДВИГАЕМ.
       НЕ УВЕЛИЧИВАЕМ.
       ===================================================== */

    "#mainLogoHotspot{" +

      "background:transparent !important;" +

      "border:0 !important;" +

      "box-shadow:none !important;" +

      "outline:0 !important;" +

    "}"

  ].join("\n");


  var style =
    document.createElement(
      "style"
    );


  style.id =
    "izmail-settings-style";


  style.textContent =
    css;


  document.head.appendChild(
    style
  );

})(window.IZMAIL_SETTINGS);


/* =========================================================
   ОДИНАКОВЫЕ ВЕРХНИЙ И НИЖНИЙ ОТСТУПЫ

   ПОИСК
      ↓
   ОТСТУП

   БОЛЬШИЕ КНОПКИ

   ОТСТУП
      ↓
   НАШИ ГРУППЫ
   ========================================================= */

(function() {


  function equalizeOuterGaps() {


    var search =
      document.querySelector(
        ".search-wrap"
      );


    var cards =
      document.querySelector(
        ".cards"
      );


    var groups =
      document.querySelector(
        ".groups"
      );


    if (
      !search ||
      !cards ||
      !groups
    ) {

      return;

    }


    document.documentElement.style.setProperty(
      "--cards-section-shift",
      "0px"
    );


    requestAnimationFrame(
      function() {


        var searchRect =
          search.getBoundingClientRect();


        var cardsRect =
          cards.getBoundingClientRect();


        var groupsRect =
          groups.getBoundingClientRect();


        var topGap =
          cardsRect.top -
          searchRect.bottom;


        var bottomGap =
          groupsRect.top -
          cardsRect.bottom;


        var shift =
          bottomGap -
          topGap;


        if (shift < 0) {

          shift = 0;

        }


        document.documentElement.style.setProperty(

          "--cards-section-shift",

          shift.toFixed(2) + "px"

        );


      }
    );

  }


  window.addEventListener(
    "DOMContentLoaded",
    function() {


      requestAnimationFrame(
        function() {


          requestAnimationFrame(
            equalizeOuterGaps
          );


        }
      );


    }
  );


  window.addEventListener(
    "resize",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


  window.addEventListener(
    "focus",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


})();
