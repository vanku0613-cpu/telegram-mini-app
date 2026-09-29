/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ
   ЕДИНАЯ УНИВЕРСАЛЬНАЯ НАВИГАЦИЯ
   ПЛАВНЫЙ ВОЗВРАТ БЕЗ ПЕРЕСТРОЙКИ MAIN-V2
   ========================================================= */

(function () {

  "use strict";


  /* =========================================================
     БАЗОВЫЕ АДРЕСА
     ========================================================= */

  var script =
    document.currentScript;


  var scriptUrl;


  try {

    scriptUrl =
      new URL(
        script && script.src
          ? script.src
          : "./navigation.js",
        location.href
      );

  } catch (e) {

    return;

  }


  var projectRoot =
    new URL(
      "./",
      scriptUrl
    );


  var mainUrl =
    new URL(
      "main-v2/",
      projectRoot
    );


  var MAIN_MARKER =
    "izmail_main_opened_v4";


  /* =========================================================
     НОРМАЛИЗАЦИЯ ПУТИ
     ========================================================= */

  function cleanPath(path) {

    path =
      path || "/";


    path =
      path.replace(
        /index\.html$/i,
        ""
      );


    if (
      !path.endsWith("/")
    ) {

      path += "/";

    }


    return path;

  }


  /* =========================================================
     МЫ НА MAIN-V2?
     ========================================================= */

  function isMainPage() {

    return (

      location.origin ===
        mainUrl.origin &&

      cleanPath(
        location.pathname
      ) ===
        cleanPath(
          mainUrl.pathname
        )

    );

  }


  /* =========================================================
     ССЫЛКА ВНУТРИ НАШЕГО ПРОЕКТА?
     ========================================================= */

  function isInsideProject(url) {

    return (

      url.origin ===
        location.origin &&

      url.pathname.indexOf(
        projectRoot.pathname
      ) === 0

    );

  }


  /* =========================================================
     ССЫЛКА ВЕДЁТ НА MAIN-V2?
     ========================================================= */

  function isMainUrl(url) {

    return (

      url.origin ===
        mainUrl.origin &&

      cleanPath(
        url.pathname
      ) ===
        cleanPath(
          mainUrl.pathname
        )

    );

  }


  /* =========================================================
     ЗАПОМИНАЕМ ОТКРЫТУЮ ГЛАВНУЮ
     ========================================================= */

  function rememberMain() {

    try {

      sessionStorage.setItem(
        MAIN_MARKER,
        "1"
      );

    } catch (e) {}

  }


  function hasMainMarker() {

    try {

      return (
        sessionStorage.getItem(
          MAIN_MARKER
        ) === "1"
      );

    } catch (e) {

      return false;

    }

  }


  function forgetMainMarker() {

    try {

      sessionStorage.removeItem(
        MAIN_MARKER
      );

    } catch (e) {}

  }


  /* =========================================================
     ОТКУДА ОТКРЫЛИ ТЕКУЩУЮ СТРАНИЦУ
     ========================================================= */

  function cameFromMain() {

    try {

      if (
        !document.referrer
      ) {

        return false;

      }


      var ref =
        new URL(
          document.referrer
        );


      return isMainUrl(
        ref
      );

    } catch (e) {

      return false;

    }

  }


  /* =========================================================
     ВОЗВРАТ НА MAIN-V2
     ========================================================= */

  function returnToMain() {

    /*
      ВАЖНО:

      Если MAIN-V2 уже был открыт,
      не загружаем его заново.

      history.back() возвращает существующую
      страницу из истории браузера.
    */

    if (
      history.length > 1 &&
      (
        cameFromMain() ||
        hasMainMarker()
      )
    ) {

      forgetMainMarker();

      history.back();

      return;

    }


    /*
      Если внутреннюю страницу открыли напрямую,
      MAIN-V2 в истории может не существовать.

      Только тогда открываем её обычным способом.
    */

    location.replace(
      mainUrl.href
    );

  }


  /* =========================================================
     МЯГКОЕ ДЕЙСТВИЕ КНОПКИ «ГЛАВНАЯ»
     ========================================================= */

  function refreshMain() {

    /*
      НИКАКОГО:
      - location.reload()
      - scrollTo()
      - искусственного focus
      - visibilitychange

      Уже открытая главная остаётся на месте.
    */

    try {

      window.dispatchEvent(
        new CustomEvent(
          "izmail:refresh",
          {
            detail: {
              source: "home"
            }
          }
        )
      );

    } catch (e) {}

  }


  /* =========================================================
     ОПРЕДЕЛЕНИЕ КНОПКИ «ГЛАВНАЯ»
     ========================================================= */

  function isHomeButton(element) {

    if (
      !element
    ) {

      return false;

    }


    var action =
      (
        element.getAttribute(
          "data-action"
        ) || ""
      )
      .trim()
      .toLowerCase();


    var nav =
      (
        element.getAttribute(
          "data-nav"
        ) || ""
      )
      .trim()
      .toLowerCase();


    var id =
      (
        element.id || ""
      )
      .trim()
      .toLowerCase();


    var text =
      (
        element.textContent || ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .toLowerCase();


    return (

      action === "home" ||

      action === "homepage" ||

      nav === "home" ||

      id === "home" ||

      id === "homebtn" ||

      id === "homebutton" ||

      text === "главная"

    );

  }


  /* =========================================================
     DATA-NAV
     ========================================================= */

  function getDataNavUrl(element) {

    var value =
      element.getAttribute(
        "data-nav"
      );


    if (
      !value ||
      value.trim().toLowerCase() === "home"
    ) {

      return null;

    }


    try {

      return new URL(
        value,
        location.href
      );

    } catch (e) {

      return null;

    }

  }


  /* =========================================================
     ПЕРЕХОД ПО DATA-NAV
     ========================================================= */

  function navigateByDataNav(
    element,
    event
  ) {

    var url =
      getDataNavUrl(
        element
      );


    if (
      !url
    ) {

      return false;

    }


    event.preventDefault();

    event.stopPropagation();

    event.stopImmediatePropagation();


    /*
      Если ведёт на MAIN-V2.
    */

    if (
      isMainUrl(
        url
      )
    ) {

      if (
        isMainPage()
      ) {

        refreshMain();

      } else {

        returnToMain();

      }


      return true;

    }


    /*
      Уходим с MAIN-V2
      на внутреннюю страницу проекта.
    */

    if (
      isMainPage() &&
      isInsideProject(
        url
      )
    ) {

      rememberMain();

    }


    location.href =
      url.href;


    return true;

  }


  /* =========================================================
     ЕДИНЫЙ ОБРАБОТЧИК ВСЕХ КНОПОК
     ========================================================= */

  document.addEventListener(
    "click",
    function (event) {


      /*
        Не вмешиваемся в уже обработанный клик.
      */

      if (
        event.defaultPrevented
      ) {

        return;

      }


      var target =
        event.target;


      if (
        !target ||
        !target.closest
      ) {

        return;

      }


      var element =
        target.closest(
          "a, button, [role='button'], [data-nav], [data-main-back], [data-action]"
        );


      if (
        !element
      ) {

        return;

      }


      /* =====================================================
         1. КНОПКА «ВЕРНУТЬСЯ В ГЛАВНОЕ МЕНЮ»
         ===================================================== */

      if (
        element.hasAttribute(
          "data-main-back"
        )
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        returnToMain();

        return;

      }


      /* =====================================================
         2. КНОПКА «ГЛАВНАЯ»
         ===================================================== */

      if (
        isHomeButton(
          element
        )
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        if (
          isMainPage()
        ) {

          refreshMain();

        } else {

          returnToMain();

        }


        return;

      }


      /* =====================================================
         3. БУДУЩИЕ КНОПКИ DATA-NAV
         ===================================================== */

      if (
        element.hasAttribute(
          "data-nav"
        )
      ) {

        if (
          navigateByDataNav(
            element,
            event
          )
        ) {

          return;

        }

      }


      /* =====================================================
         4. ОБЫЧНЫЕ ССЫЛКИ
         ===================================================== */

      if (
        element.tagName === "A" &&
        element.href
      ) {

        var url;


        try {

          url =
            new URL(
              element.href,
              location.href
            );

        } catch (e) {

          return;

        }


        /*
          ВНЕШНИЕ ССЫЛКИ НЕ ТРОГАЕМ.
          Telegram / Instagram / Minfin и т.д.
        */

        if (
          !isInsideProject(
            url
          )
        ) {

          return;

        }


        /*
          Ссылка на MAIN-V2.
        */

        if (
          isMainUrl(
            url
          )
        ) {

          event.preventDefault();

          event.stopPropagation();

          event.stopImmediatePropagation();


          if (
            isMainPage()
          ) {

            refreshMain();

          } else {

            returnToMain();

          }


          return;

        }


        /*
          С MAIN-V2 уходим во внутренний раздел.
        */

        if (
          isMainPage()
        ) {

          rememberMain();

        }

      }

    },
    true
  );


  /* =========================================================
     PAGE SHOW

     Специально НИЧЕГО НЕ ДВИГАЕМ.

     Раньше здесь был scrollTo(0,0),
     который мог визуально дёргать MAIN-V2
     после history.back().
     ========================================================= */

  window.addEventListener(
    "pageshow",
    function () {

      if (
        isMainPage()
      ) {

        /*
          Просто очищаем старый маркер.
          Геометрию страницы не трогаем.
        */

        forgetMainMarker();

      }

    }
  );


})();
