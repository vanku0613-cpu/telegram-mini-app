/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ
   ФИНАЛЬНАЯ ЗАМОРОЖЕННАЯ ВЕРСИЯ

   СТАТУС: FROZEN_FINAL

   ЭТУ ВЕРСИЮ ПОСЛЕ ПРОВЕРКИ БОЛЬШЕ НЕ РЕДАКТИРУЕМ.
   Все следующие работы — только в новой отдельной папке.

   index.html НЕ ТРОГАЕМ.
   ========================================================= */

window.IZMAIL_BUILD = "FROZEN_FINAL";


window.IZMAIL_SETTINGS = {

  /* =========================================================
     ОБЩИЙ РАЗМЕР
     ========================================================= */

  design: {

    masterScale: 1.09

  },


  /* =========================================================
     ПОЛОЖЕНИЕ ИНТЕРФЕЙСА
     ========================================================= */

  layout: {

    /*
      Было: 3.60%

      Вместо двойного увеличения до 7.20%
      делаем один аккуратный шаг:

      3.60 + 1.80 = 5.40%

      ФОН И КРУГЛАЯ АВАТАРКА НЕ ДВИГАЮТСЯ.
    */

    menuDown: "5.40%",


    /* Просмотрено */
    viewerTop: "32.90%",


    /* Погода / Курс / Укрытие */
    topRowTop: "36.60%",


    /* Поиск */
    searchTop: "43.50%",


    /* Большие кнопки */
    cardsTop: "51.00%",


    /* Наши группы */
    groupsTop: "91.20%",


    /* Главная / Реклама / Избранное */
    bottomTop: "98.20%",


    /* Пользовательское соглашение */
    agreementTop: "105.00%",


    /* Поля слева и справа */
    menuLeft: "4.88%",

    menuWidth: "90.24%",


    /* Одинаковое расстояние между большими кнопками */
    cardsGap: "0.75vw",


    /* Зона погодных эффектов */
    weatherStageHeight: "41.5%"

  },


  /* =========================================================
     ПОГОДА
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
     СЕЗОНЫ
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

    weatherPanelMs: 300000,

    currencyMs: 300000,

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
      "https://t.me/frankexange",

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
      "./health-care/",

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
   ЗАМОРОЗКА НАСТРОЕК ВО ВРЕМЯ РАБОТЫ СТРАНИЦЫ

   Это защищает конфигурацию от случайного изменения
   другими JS-скриптами.

   Ручное редактирование файла в GitHub это не блокирует.
   После утверждения мы просто больше не редактируем
   этот файл и переходим в новую папку.
   ========================================================= */

(function deepFreeze(obj) {

  if (
    !obj ||
    typeof obj !== "object"
  ) {

    return obj;

  }


  Object.getOwnPropertyNames(obj).forEach(
    function(key) {

      var value =
        obj[key];


      if (
        value &&
        typeof value === "object" &&
        !Object.isFrozen(value)
      ) {

        deepFreeze(value);

      }

    }
  );


  return Object.freeze(obj);

})(window.IZMAIL_SETTINGS);


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

    /* -----------------------------------------------------
       НИЖНЯЯ ЧАСТЬ НЕ ОБРЕЗАЕТСЯ
       ----------------------------------------------------- */

    "html{" +
      "overflow:hidden !important;" +
    "}",


    "body{" +
      "overflow:visible !important;" +
    "}",


    "#app{" +
      "overflow:visible !important;" +
    "}",


    /* -----------------------------------------------------
       ФОН

       НЕ ОПУСКАЕМ.
       ----------------------------------------------------- */

    ".bg-main{" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* -----------------------------------------------------
       ПОГОДНЫЕ ЭФФЕКТЫ

       ОСТАЮТСЯ ВМЕСТЕ С ФОНОМ.
       ----------------------------------------------------- */

    ".scene-layer{" +

      "height:" +
      (layout.weatherStageHeight || "41.5%") +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* -----------------------------------------------------
       ПРОСМОТРЕНО
       ----------------------------------------------------- */

    ".viewer{" +

      "top:calc(" +
      (layout.viewerTop || "32.90%") +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform:translateX(-50%);" +

      "transform-origin:center center;" +

    "}",


    /* -----------------------------------------------------
       ПОГОДА / КУРС / УКРЫТИЕ
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ПОИСК
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       БОЛЬШИЕ КНОПКИ
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       НАШИ ГРУППЫ
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ГЛАВНАЯ / РЕКЛАМА / ИЗБРАННОЕ
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
       ----------------------------------------------------- */

    ".agreement{" +

      "top:calc(" +
      (layout.agreementTop || "105.00%") +
      " + " +
      down +
      ") !important;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* -----------------------------------------------------
       НЕВИДИМАЯ ОБЛАСТЬ АВАТАРКИ
       ----------------------------------------------------- */

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
   ПРОВЕРКА АКТИВНОГО ПОИСКА

   Пока клавиатура открыта,
   геометрию меню НЕ пересчитываем.
   ========================================================= */

function izmailSearchIsActive() {

  var active =
    document.activeElement;


  if (!active) {

    return false;

  }


  return !!(
    active.matches &&
    active.matches(
      "#directorySearch, .search-real, input[type='search']"
    )
  );

}


/* =========================================================
   ВЫРАВНИВАНИЕ "ПРОСМОТРЕНО"
   РОВНО ПО ЦЕНТРУ КНОПКИ "ПОГОДА"
   ========================================================= */

(function() {


  function alignViewerWithWeather() {


    if (izmailSearchIsActive()) {

      return;

    }


    var viewer =
      document.querySelector(
        ".viewer"
      );


    var weather =
      document.querySelector(
        ".weather-panel"
      ) ||

      document.querySelector(
        "#weatherWidget"
      ) ||

      document.querySelector(
        ".weather"
      ) ||

      document.querySelector(
        ".top-row > *"
      );


    var app =
      document.getElementById(
        "app"
      );


    if (
      !viewer ||
      !weather ||
      !app
    ) {

      return;

    }


    var weatherRect =
      weather.getBoundingClientRect();


    var appRect =
      app.getBoundingClientRect();


    var centerX =
      weatherRect.left -
      appRect.left +
      weatherRect.width / 2;


    viewer.style.left =
      centerX.toFixed(2) + "px";

  }


  /* Первый расчёт */

  window.addEventListener(
    "DOMContentLoaded",
    function() {


      requestAnimationFrame(
        function() {


          requestAnimationFrame(
            alignViewerWithWeather
          );


        }
      );


    }
  );


  /* Возвращение в приложение */

  document.addEventListener(
    "visibilitychange",
    function() {


      if (
        document.visibilityState === "visible" &&
        !izmailSearchIsActive()
      ) {

        requestAnimationFrame(
          alignViewerWithWeather
        );

      }


    }
  );


  /* -----------------------------------------------------
     КЛАВИАТУРУ ANDROID ИГНОРИРУЕМ

     Пересчитываем только реальное изменение ширины.
     ----------------------------------------------------- */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function() {


      var newWidth =
        window.innerWidth;


      var widthChanged =
        Math.abs(
          newWidth -
          lastWidth
        ) > 4;


      if (!widthChanged) {

        return;

      }


      lastWidth =
        newWidth;


      requestAnimationFrame(
        alignViewerWithWeather
      );


    }
  );


  /* Поворот телефона */

  window.addEventListener(
    "orientationchange",
    function() {


      setTimeout(
        function() {


          lastWidth =
            window.innerWidth;


          alignViewerWithWeather();


        },
        250
      );


    }
  );


})();


/* =========================================================
   ОДИНАКОВЫЕ ВНЕШНИЕ ОТСТУПЫ

   ПОИСК
      ↓
   ОТСТУП

   БОЛЬШИЕ КНОПКИ

   ОТСТУП
      ↓
   НАШИ ГРУППЫ

   БЕЗ ДЁРГАНИЯ ПРИ ОТКРЫТИИ КЛАВИАТУРЫ.
   ========================================================= */

(function() {


  function getCurrentShift() {


    var raw =
      getComputedStyle(
        document.documentElement
      ).getPropertyValue(
        "--cards-section-shift"
      );


    var value =
      parseFloat(raw);


    if (isNaN(value)) {

      return 0;

    }


    return value;

  }


  function equalizeOuterGaps() {


    if (izmailSearchIsActive()) {

      return;

    }


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


    requestAnimationFrame(
      function() {


        if (izmailSearchIsActive()) {

          return;

        }


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


        var currentShift =
          getCurrentShift();


        var newShift =
          currentShift +
          (
            bottomGap -
            topGap
          );


        if (newShift < 0) {

          newShift = 0;

        }


        /*
          Если изменение меньше половины пикселя,
          положение вообще не трогаем.
        */

        if (
          Math.abs(
            newShift -
            currentShift
          ) < 0.5
        ) {

          return;

        }


        document.documentElement.style.setProperty(

          "--cards-section-shift",

          newShift.toFixed(2) + "px"

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


  /* Возвращение в приложение */

  document.addEventListener(
    "visibilitychange",
    function() {


      if (
        document.visibilityState === "visible" &&
        !izmailSearchIsActive()
      ) {

        requestAnimationFrame(
          equalizeOuterGaps
        );

      }


    }
  );


  /* -----------------------------------------------------
     ОТКРЫТИЕ КЛАВИАТУРЫ НЕ ТРОГАЕТ МЕНЮ
     ----------------------------------------------------- */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function() {


      var newWidth =
        window.innerWidth;


      var widthChanged =
        Math.abs(
          newWidth -
          lastWidth
        ) > 4;


      if (!widthChanged) {

        return;

      }


      lastWidth =
        newWidth;


      requestAnimationFrame(
        equalizeOuterGaps
      );


    }
  );


  /* Поворот телефона */

  window.addEventListener(
    "orientationchange",
    function() {


      setTimeout(
        function() {


          lastWidth =
            window.innerWidth;


          equalizeOuterGaps();


        },
        250
      );


    }
  );


})();

/* Replace cached NBU HTML once; settings are also loaded by legacy pages. */
(function () {
  function refreshLegacyCurrencyPage() {
    if (!navigator.onLine) return;
    var panel = document.getElementById("currencyPanel");
    if (!panel || panel.querySelector('a[href="https://t.me/frankexange"]')) return;
    var url = new URL(window.location.href);
    if (url.searchParams.get("frank_revision") === "3") return;
    url.searchParams.set("frank_revision", "3");
    window.location.replace(url.href);
  }
  window.addEventListener("DOMContentLoaded", refreshLegacyCurrencyPage);
  window.addEventListener("pageshow", refreshLegacyCurrencyPage);
  window.addEventListener("online", refreshLegacyCurrencyPage);
})();
