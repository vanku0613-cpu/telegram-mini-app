/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ — ЕДИНЫЙ ФАЙЛ НАСТРОЕК

   index.html больше НЕ ТРОГАЕМ.
   Все дальнейшие изменения делаем только здесь.
   ========================================================= */

window.IZMAIL_SETTINGS = {

  /* =========================================================
     РАЗМЕР ИНТЕРФЕЙСА
     ========================================================= */

  design: {

    /* Текущий идеальный размер */
    masterScale: 1.09

  },


  /* =========================================================
     ПОЛОЖЕНИЕ ЭЛЕМЕНТОВ
     ========================================================= */

  layout: {

    /* Верхняя картинка / круглая аватарка */
    headerMoveDown: "0.75%",

    /* Счётчик просмотров */
    viewerTop: "32.10%",

    /* Погода / Курс / Укрытие */
    topRowTop: "35.80%",

    /* Поиск */
    searchTop: "42.70%",

    /* 8 больших кнопок */
    cardsTop: "50.20%",

    /* Наши группы */
    groupsTop: "90.40%",

    /* Главная / Реклама / Избранное */
    bottomTop: "97.40%",

    /* Пользовательское соглашение */
    agreementTop: "104.20%",

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
     ОБНОВЛЕНИЕ ДАННЫХ
     ========================================================= */

  updates: {

    /* Проверка времени суток — 1 минута */
    clockCheckMs: 60000,

    /* Погода фонового изображения — 10 минут */
    sceneWeatherMs: 600000,

    /* Блок погоды — 10 минут */
    weatherPanelMs: 600000,

    /* Курс валют — 30 минут */
    currencyMs: 1800000,

    /* Новый просмотр не чаще раза в 3 минуты */
    viewIntervalMs: 180000

  },


  /* =========================================================
     ЭФФЕКТЫ ПОГОДЫ
     ========================================================= */

  effects: {

    fadeStart: 0.72,

    fadeEnd: 1.00,


    /* =====================================================
       ДОЖДЬ
       ===================================================== */

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


    /* =====================================================
       СНЕГ
       ===================================================== */

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


  /* Сезонные картинки остаются внутри index.html */

  seasonImages: {}

};


/* =========================================================
   ПРИМЕНЕНИЕ ОСНОВНЫХ НАСТРОЕК
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


  var css = [

    /* =====================================================
       ГЛАВНОЕ ИСПРАВЛЕНИЕ

       Раньше #app обрезал всё,
       что выходило ниже его фиксированной высоты.

       Теперь нижняя часть меню может спокойно
       отображаться в свободной тёмной области экрана.

       При этом прокрутку страницы не включаем.
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
       ВЕРХНЯЯ КАРТИНКА
       ===================================================== */

    ".bg-main{" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

      "translate:0 " +
      (layout.headerMoveDown || "0%") +
      ";" +

    "}",


    /* =====================================================
       ПОГОДНЫЕ ЭФФЕКТЫ
       ===================================================== */

    ".scene-layer{" +

      "height:" +
      (layout.weatherStageHeight || "41.5%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

      "translate:0 " +
      (layout.headerMoveDown || "0%") +
      ";" +

    "}",


    /* =====================================================
       СЧЁТЧИК
       ===================================================== */

    ".viewer{" +

      "top:" +
      (layout.viewerTop || "32.10%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       ПОГОДА / КУРС / УКРЫТИЕ
       ===================================================== */

    ".top-row{" +

      "top:" +
      (layout.topRowTop || "35.80%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       ПОИСК
       ===================================================== */

    ".search-wrap{" +

      "top:" +
      (layout.searchTop || "42.70%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* =====================================================
       8 БОЛЬШИХ КНОПОК
       ===================================================== */

    ".cards{" +

      "top:" +
      (layout.cardsTop || "50.20%") +
      " !important;" +

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

      "top:" +
      (layout.groupsTop || "90.40%") +
      " !important;" +

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

      "top:" +
      (layout.bottomTop || "97.40%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
       ===================================================== */

    ".agreement{" +

      "top:" +
      (layout.agreementTop || "104.20%") +
      " !important;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* =====================================================
       НЕВИДИМАЯ ОБЛАСТЬ КРУГЛОГО ЛОГОТИПА
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
   АВТОМАТИЧЕСКИ ДЕЛАЕМ ОДИНАКОВЫЕ ОТСТУПЫ

   Поиск
        ↓
      воздух

   Большие кнопки

      воздух
        ↓
   Наши группы

   Нижний отступ НЕ меняем.
   Он используется как образец для верхнего.
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


    /* Сначала убираем предыдущий расчёт */

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


        /* Текущий верхний отступ */

        var topGap =
          cardsRect.top -
          searchRect.bottom;


        /* Нижний отступ — наш образец */

        var bottomGap =
          groupsRect.top -
          cardsRect.bottom;


        /*
          Определяем,
          насколько нужно опустить
          большие кнопки и всё под ними.
        */

        var shift =
          bottomGap -
          topGap;


        /*
          Верх мы не уменьшаем.
          Если он уже достаточный —
          ничего не двигаем.
        */

        if (shift < 0) {

          shift = 0;

        }


        /*
          Большие кнопки,
          Наши группы,
          нижнее меню
          и соглашение
          двигаются вместе.

          Поэтому существующий нижний
          отступ сохраняется.
        */

        document.documentElement.style.setProperty(

          "--cards-section-shift",

          shift.toFixed(2) + "px"

        );


      }
    );

  }


  /* =====================================================
     ПЕРВЫЙ РАСЧЁТ
     ===================================================== */

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


  /* =====================================================
     ПЕРЕСЧЁТ ПРИ ИЗМЕНЕНИИ ЭКРАНА
     ===================================================== */

  window.addEventListener(
    "resize",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


  /* =====================================================
     ПЕРЕСЧЁТ ПРИ ВОЗВРАТЕ В ПРИЛОЖЕНИЕ
     ===================================================== */

  window.addEventListener(
    "focus",
    function() {


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


})();
