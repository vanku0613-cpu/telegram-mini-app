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

    /* Текущий идеальный размер */
    masterScale: 1.09

  },


  /* =========================================================
     ПОЛОЖЕНИЕ ИНТЕРФЕЙСА
     ========================================================= */

  layout: {

    /*
      Весь интерфейс опущен вниз.
      Фон и круглая аватарка остаются на месте.
    */
    menuDown: "3.60%",


    /* Просмотры */
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


    /* Одинаковые боковые поля */
    menuLeft: "4.88%",

    menuWidth: "90.24%",


    /* Расстояние между большими кнопками */
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
       ПРОСМОТРЫ
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

      "transform:translateX(-50%);" +

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
       БОЛЬШИЕ КНОПКИ
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
       ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
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
   ПРОВЕРКА:
   НАХОДИТСЯ ЛИ ПОЛЬЗОВАТЕЛЬ СЕЙЧАС В ПОИСКЕ

   Пока клавиатура открыта,
   геометрию страницы НЕ пересчитываем.
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

   Блок ставится ровно по центру кнопки Погода.
   ========================================================= */

(function() {

  function alignViewerWithWeather() {

    /*
      Если сейчас открыт поиск —
      вообще ничего не трогаем.
    */

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


  /*
    Первый расчёт —
    только после загрузки страницы.
  */

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


  /*
    При возвращении в приложение.
    Но НЕ когда активен поиск.
  */

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


  /*
    Клавиатура Android меняет ВЫСОТУ окна.
    Мы на это больше НЕ реагируем.

    Пересчитываем только тогда,
    когда реально изменилась ШИРИНА экрана.
  */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function() {

      var newWidth =
        window.innerWidth;


      var widthChanged =
        Math.abs(
          newWidth - lastWidth
        ) > 4;


      if (!widthChanged) {

        /* Это почти наверняка клавиатура */
        return;

      }


      lastWidth =
        newWidth;


      requestAnimationFrame(
        alignViewerWithWeather
      );

    }
  );


  /*
    При настоящем повороте телефона.
  */

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
   ОДИНАКОВЫЕ ОТСТУПЫ

   ПОИСК
      ↓
   ОТСТУП

   БОЛЬШИЕ КНОПКИ

   ОТСТУП
      ↓
   НАШИ ГРУППЫ

   ВАЖНО:
   больше НЕТ промежуточного сброса в 0px.
   Поэтому карточки не должны дёргаться.
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

    /*
      Если пользователь нажал поиск —
      ничего вообще не пересчитываем.
    */

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


        /*
          Ещё раз проверяем:
          за один кадр пользователь уже мог
          нажать на строку поиска.
        */

        if (izmailSearchIsActive()) {
          return;
        }


        var searchRect =
          search.getBoundingClientRect();


        var cardsRect =
          cards.getBoundingClientRect();


        var groupsRect =
          groups.getBoundingClientRect();


        /*
          Текущий верхний отступ.
        */

        var topGap =
          cardsRect.top -
          searchRect.bottom;


        /*
          Нижний отступ.
          Он не зависит от общего сдвига,
          потому что cards и groups
          двигаются вместе.
        */

        var bottomGap =
          groupsRect.top -
          cardsRect.bottom;


        /*
          Текущий уже применённый сдвиг.
        */

        var currentShift =
          getCurrentShift();


        /*
          Рассчитываем новое положение
          СРАЗУ, без предварительного
          прыжка в 0px.
        */

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
          Если разница меньше половины пикселя,
          вообще ничего не меняем.
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


  /*
    Первый расчёт после загрузки.
  */

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


  /*
    Возврат в Telegram.
  */

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


  /*
    КЛАВИАТУРУ ИГНОРИРУЕМ.

    Если изменилась только высота,
    карточки остаются абсолютно
    на своих местах.
  */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function() {

      var newWidth =
        window.innerWidth;


      var widthChanged =
        Math.abs(
          newWidth - lastWidth
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


  /*
    Настоящий поворот телефона.
  */

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
