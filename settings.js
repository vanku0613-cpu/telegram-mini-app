/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — ЕДИНЫЙ ФАЙЛ НАСТРОЕК

   index.html НЕ ТРОГАЕМ.
   Все дальнейшие изменения делаем только здесь.
   ========================================================= */

window.IZMAIL_SETTINGS = {

  /* =========================================================
     РАЗМЕР
     ========================================================= */

  design: {

    /* Текущий идеальный размер */
    masterScale: 1.08

  },


  /* =========================================================
     ПОЛОЖЕНИЕ
     ========================================================= */

  layout: {

    /*
      Фон и круглая аватарка остаются
      ТОЧНО НА СВОЁМ МЕСТЕ.
    */
    headerMoveDown: "0%",

    /*
      Очень небольшая коррекция влево,
      чтобы визуально выровнять меню.
    */
    menuShiftX: "-0.40vw",


    /* ---------------------------------------------------------
       ВСЁ МЕНЮ НЕМНОГО СПУЩЕНО НИЖЕ
       --------------------------------------------------------- */

    /* Счётчик */
    viewerTop: "32.90%",

    /* Погода / Курс / Укрытие */
    topRowTop: "36.60%",

    /* Поиск */
    searchTop: "43.50%",

    /* 8 больших кнопок */
    cardsTop: "51.00%",

    /* Наши группы */
    groupsTop: "91.20%",

    /* Главная / Реклама / Избранное */
    bottomTop: "98.20%",

    /* Пользовательское соглашение */
    agreementTop: "105.00%",


    /* Погодная зона */
    weatherStageHeight: "41.5%",


    /* Одинаковое расстояние между большими кнопками */
    cardsGap: "0.75vw"

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

  var shiftX =
    layout.menuShiftX || "0vw";


  var css = [

    /* =====================================================
       НЕ ОБРЕЗАЕМ НИЖНЮЮ ЧАСТЬ
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

       ВАЖНО:
       вниз его больше НЕ двигаем.
       ===================================================== */

    ".bg-main{" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* =====================================================
       ПОГОДНЫЕ ЭФФЕКТЫ

       Остаются точно на фоне.
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

      "top:" +
      (layout.viewerTop || "32.90%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " 0;" +

    "}",


    /* =====================================================
       ПОГОДА / КУРС / УКРЫТИЕ
       ===================================================== */

    ".top-row{" +

      "top:" +
      (layout.topRowTop || "36.60%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " 0;" +

    "}",


    /* =====================================================
       ПОИСК
       ===================================================== */

    ".search-wrap{" +

      "top:" +
      (layout.searchTop || "43.50%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " 0;" +

    "}",


    /* =====================================================
       8 БОЛЬШИХ КНОПОК
       ===================================================== */

    ".cards{" +

      "top:" +
      (layout.cardsTop || "51.00%") +
      " !important;" +

      "gap:" +
      (layout.cardsGap || "0.75vw") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       НАШИ ГРУППЫ
       ===================================================== */

    ".groups{" +

      "top:" +
      (layout.groupsTop || "91.20%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       ГЛАВНАЯ / РЕКЛАМА / ИЗБРАННОЕ
       ===================================================== */

    ".bottom{" +

      "top:" +
      (layout.bottomTop || "98.20%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:" +
      shiftX +
      " var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
       ===================================================== */

    ".agreement{" +

      "top:" +
      (layout.agreementTop || "105.00%") +
      " !important;" +

      "translate:" +
      shiftX +
      " var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       НЕВИДИМАЯ КНОПКА КРУГЛОГО ЛОГОТИПА

       Саму картинку НЕ двигаем.
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
   ОДИНАКОВЫЙ ВОЗДУХ:

   ПОИСК
      ↓
   ОТСТУП

   БОЛЬШИЕ КНОПКИ

   ОТСТУП
      ↓
   НАШИ ГРУППЫ

   Нижний отступ остаётся образцом.
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


        /* Верхний отступ */

        var topGap =
          cardsRect.top -
          searchRect.bottom;


        /* Нижний отступ */

        var bottomGap =
          groupsRect.top -
          cardsRect.bottom;


        /* Разница */

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


  /* Первый расчёт */

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


  /* При изменении размера экрана */

  window.addEventListener(
    "resize",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


  /* При возвращении в приложение */

  window.addEventListener(
    "focus",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


})();
