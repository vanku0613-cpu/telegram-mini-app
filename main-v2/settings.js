/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ
   MAIN-V2
   ЕДИНАЯ НАВИГАЦИЯ + ФИКСИРОВАННАЯ ГЕОМЕТРИЯ
   ========================================================= */

window.IZMAIL_BUILD = "MAIN_V2_NAV_V4";


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

    menuDown: "5.40%",

    viewerTop: "32.90%",

    topRowTop: "36.60%",

    searchTop: "43.50%",

    cardsTop: "51.00%",

    groupsTop: "91.20%",

    bottomTop: "98.20%",

    agreementTop: "106.20%",

    menuLeft: "4.88%",

    menuWidth: "90.24%",

    cardsGap: "0.75vw",

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
     ССЫЛКИ
     ========================================================= */

  links: {

    mainGroup:
      "https://t.me/SPRAVOCHNIK_IZMAIL",

    shelter:
      "../ukrytia/",

    agreement:
      "../soglashenie/",

    ads:
      "https://t.me/Vanku13",

    currency:
      "https://t.me/frankexange",

    groups:
      "../our-groups-menu/",

    zags:
      "../zags/",

    /* Главная — текущий MAIN-V2 */

    home:
      "./"

  },


  /* =========================================================
     КАТЕГОРИИ
     ========================================================= */

  categoryLinks: {

    "Здоровье и уход":
      "../health-care/",

    "Транспорт / Такси":
      "../transport/",

    "Услуги и мастера":
      "../services-masters/?v=hierarchy-colors-2",

    "Продукты питания":
      "../products-food/",

    "Коммунальные службы":
      "../communal-services/?v=utility-cards-9",

    "Работа / Вакансии":
      "https://t.me/rabota_v_izmaile",

    "Образование и развитие":
      "",

    "Отдых • Жильё • Море":
      "../recreation/"

  },


  seasonImages: {}

};


/* =========================================================
   ФИКСАЦИЯ ГЕОМЕТРИИ ДЛЯ ТЕКУЩЕЙ ШИРИНЫ ЭКРАНА
   ========================================================= */

var IZMAIL_SCREEN_WIDTH =
  Math.round(
    window.innerWidth
  );


var IZMAIL_SHIFT_KEY =
  "izmail_cards_shift_v4_" +
  IZMAIL_SCREEN_WIDTH;


var IZMAIL_VIEWER_KEY =
  "izmail_viewer_left_v4_" +
  IZMAIL_SCREEN_WIDTH;


var IZMAIL_SAVED_SHIFT =
  null;


var IZMAIL_SAVED_VIEWER =
  null;


try {

  IZMAIL_SAVED_SHIFT =
    sessionStorage.getItem(
      IZMAIL_SHIFT_KEY
    );


  IZMAIL_SAVED_VIEWER =
    sessionStorage.getItem(
      IZMAIL_VIEWER_KEY
    );

} catch (e) {}


/* =========================================================
   ВОССТАНАВЛИВАЕМ ПОЛОЖЕНИЕ БОЛЬШИХ КНОПОК СРАЗУ
   ========================================================= */

if (
  IZMAIL_SAVED_SHIFT !== null &&
  !isNaN(
    parseFloat(
      IZMAIL_SAVED_SHIFT
    )
  )
) {

  document.documentElement.style.setProperty(

    "--cards-section-shift",

    parseFloat(
      IZMAIL_SAVED_SHIFT
    ).toFixed(2) + "px"

  );

}


/* =========================================================
   ПРИМЕНЕНИЕ НАСТРОЕК
   ========================================================= */

(function (cfg) {

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

  var cardsGap =
    layout.cardsGap || "0.75vw";


  var savedViewerCss =
    "";


  if (
    IZMAIL_SAVED_VIEWER !== null &&
    !isNaN(
      parseFloat(
        IZMAIL_SAVED_VIEWER
      )
    )
  ) {

    savedViewerCss =

      "left:" +
      parseFloat(
        IZMAIL_SAVED_VIEWER
      ).toFixed(2) +
      "px !important;";

  }


  var css = [

    /* СТРАНИЦА */

    "html{" +
      "overflow:hidden !important;" +
    "}",


    "body{" +
      "overflow:visible !important;" +
    "}",


    "#app{" +
      "overflow:visible !important;" +
    "}",


    /* ФОН */

    ".bg-main{" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* ПОГОДНЫЕ ЭФФЕКТЫ */

    ".scene-layer{" +

      "height:" +
      (
        layout.weatherStageHeight ||
        "41.5%"
      ) +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:50% 0%;" +

    "}",


    /* ПРОСМОТРЕНО */

    ".viewer{" +

      savedViewerCss +

      "top:calc(" +
      (
        layout.viewerTop ||
        "32.90%"
      ) +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* ПОГОДА / ВАЛЮТА / УКРЫТИЕ */

    ".top-row{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (
        layout.topRowTop ||
        "36.60%"
      ) +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* ПОИСК */

    ".search-wrap{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (
        layout.searchTop ||
        "43.50%"
      ) +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

    "}",


    /* БОЛЬШИЕ КНОПКИ */

    ".cards{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (
        layout.cardsTop ||
        "51.00%"
      ) +
      " + " +
      down +
      ") !important;" +

      "gap:" +
      cardsGap +
      " !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* НАШИ ГРУППЫ */

    ".groups-row{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "gap:" +
      cardsGap +
      " !important;" +

      "top:calc(" +
      (
        layout.groupsTop ||
        "91.20%"
      ) +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* ГЛАВНАЯ / РЕКЛАМА / ИЗБРАННОЕ */

    ".bottom{" +

      "left:" +
      menuLeft +
      " !important;" +

      "width:" +
      menuWidth +
      " !important;" +

      "top:calc(" +
      (
        layout.bottomTop ||
        "98.20%"
      ) +
      " + " +
      down +
      ") !important;" +

      "scale:" +
      scale +
      ";" +

      "transform-origin:center center;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* СОГЛАШЕНИЕ */

    ".agreement{" +

      "top:calc(" +
      (
        layout.agreementTop ||
        "106.20%"
      ) +
      " + " +
      down +
      ") !important;" +

      "translate:0 var(--cards-section-shift, 0px);" +

    "}",


    /* АВАТАРКА */

    "#mainLogoHotspot{" +

      "background:transparent !important;" +

      "border:0 !important;" +

      "box-shadow:none !important;" +

      "outline:0 !important;" +

    "}"

  ].join(
    "\n"
  );


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


})(
  window.IZMAIL_SETTINGS
);


/* =========================================================
   АКТИВЕН ЛИ ПОИСК
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
   ЗАПУСК ПОСЛЕ ГОТОВНОСТИ DOM
   ========================================================= */

function izmailWhenReady(
  callback
) {

  if (
    document.readyState ===
    "loading"
  ) {

    window.addEventListener(
      "DOMContentLoaded",
      callback,
      {
        once: true
      }
    );

  } else {

    callback();

  }

}


/* =========================================================
   ВЫРАВНИВАНИЕ «ПРОСМОТРЕНО»

   При возврате из внутренних разделов повторного
   пересчёта по visibilitychange нет.
   ========================================================= */

(function () {


  function alignViewerWithWeather() {


    if (
      izmailSearchIsActive()
    ) {

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


    // Match the visible width after settings.js scales the two elements.
    var viewerScale = parseFloat(window.getComputedStyle(viewer).scale);

    if (!isFinite(viewerScale) || viewerScale <= 0) {

      viewerScale = 1;

    }

    var alignedWidth = weatherRect.width / viewerScale;

    viewer.style.setProperty(
      "--weather-button-width",
      alignedWidth.toFixed(2) + "px"

    );

    viewer.style.setProperty("min-width", alignedWidth.toFixed(2) + "px", "important");
    viewer.style.setProperty("width", "max-content", "important");


    var viewerRect = viewer.getBoundingClientRect();

    // Keep long counts fully inside the app frame on narrow phones.
    centerX = Math.max(
      viewerRect.width / 2,
      Math.min(centerX, appRect.width - viewerRect.width / 2)
    );
    viewer.style.setProperty("left", (centerX - viewerRect.width / viewerScale / 2).toFixed(2) + "px", "important");


    try {

      sessionStorage.setItem(

        IZMAIL_VIEWER_KEY,

        correctedLeft.toFixed(2)

      );

    } catch (e) {}

  }


  /* Только первый расчёт */

  izmailWhenReady(
    function () {

      requestAnimationFrame(
        function () {

          requestAnimationFrame(
            alignViewerWithWeather
          );

        }
      );

    }
  );

  window.addEventListener("load", alignViewerWithWeather, { once: true });


  /*
    Клавиатура меняет высоту.
    Пересчитываем только при реальной смене ширины.
  */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function () {


      var newWidth =
        window.innerWidth;


      var widthChanged =

        Math.abs(

          newWidth -
          lastWidth

        ) > 4;


      if (
        !widthChanged
      ) {

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
    function () {

      setTimeout(
        function () {

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
   ========================================================= */

(function () {


  function getCurrentShift() {


    var raw =

      getComputedStyle(
        document.documentElement
      )
      .getPropertyValue(
        "--cards-section-shift"
      );


    var value =
      parseFloat(
        raw
      );


    if (
      isNaN(
        value
      )
    ) {

      return 0;

    }


    return value;

  }


  function saveShift(
    value
  ) {

    try {

      sessionStorage.setItem(

        IZMAIL_SHIFT_KEY,

        Number(
          value
        ).toFixed(2)

      );

    } catch (e) {}

  }


  function equalizeOuterGaps() {


    if (
      izmailSearchIsActive()
    ) {

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
      function () {


        if (
          izmailSearchIsActive()
        ) {

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


        if (
          newShift < 0
        ) {

          newShift = 0;

        }


        if (

          Math.abs(

            newShift -
            currentShift

          ) < 0.5

        ) {

          saveShift(
            currentShift
          );

          return;

        }


        document.documentElement
          .style
          .setProperty(

            "--cards-section-shift",

            newShift.toFixed(2) +
            "px"

          );


        saveShift(
          newShift
        );

      }
    );

  }


  /* Первый расчёт */

  izmailWhenReady(
    function () {

      requestAnimationFrame(
        function () {

          requestAnimationFrame(
            equalizeOuterGaps
          );

        }
      );

    }
  );


  /*
    Повторный расчёт — только при
    настоящем изменении ширины.
  */

  var lastWidth =
    window.innerWidth;


  window.addEventListener(
    "resize",
    function () {


      var newWidth =
        window.innerWidth;


      var widthChanged =

        Math.abs(

          newWidth -
          lastWidth

        ) > 4;


      if (
        !widthChanged
      ) {

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
    function () {

      setTimeout(
        function () {

          lastWidth =
            window.innerWidth;


          equalizeOuterGaps();

        },
        250
      );

    }
  );


})();


/* =========================================================
   УСКОРЕНИЕ MAIN-V2
   ========================================================= */

(function () {


  /* =====================================================
     SERVICE WORKER
     ===================================================== */

  if (
    "serviceWorker" in
    navigator
  ) {

    window.addEventListener(
      "load",
      function () {

        navigator.serviceWorker

          .register(
            "./sw.js"
          )

          .then(
            function (
              registration
            ) {

              registration.update();

            }
          )

          .catch(
            function (
              error
            ) {

              console.log(
                "Service Worker:",
                error
              );

            }
          );

      }
    );

  }


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
