/* =========================================================
   СПРАВОЧНИК ИЗМАИЛ
   ЕДИНАЯ УНИВЕРСАЛЬНАЯ НАВИГАЦИЯ
   ========================================================= */

(function () {

  "use strict";


  /* =========================================================
     БАЗОВЫЕ АДРЕСА ПРОЕКТА
     navigation.js лежит в корне telegram-mini-app
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
    "izmail_main_opened";


  /* =========================================================
     НОРМАЛИЗАЦИЯ ПУТЕЙ
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


  function isInsideProject(url) {

    return (

      url.origin ===
        location.origin &&

      url.pathname.indexOf(
        projectRoot.pathname
      ) === 0

    );

  }


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
     ЗАПОМИНАЕМ, ЧТО MAIN-V2 УЖЕ БЫЛ ОТКРЫТ
     ========================================================= */

  function rememberMain() {

    try {

      sessionStorage.setItem(
        MAIN_MARKER,
        "1"
      );

    } catch (e) {}

  }


  function forgetMainMarker() {

    try {

      sessionStorage.removeItem(
        MAIN_MARKER
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


  /* =========================================================
     ПРОВЕРЯЕМ, ПРИШЛИ ЛИ МЫ С MAIN-V2
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
     ВОЗВРАТ В ГЛАВНОЕ МЕНЮ
     ========================================================= */

  function returnToMain() {


    /*
      Если MAIN-V2 уже есть в истории,
      просто возвращаем его.

      Это быстрее и не создаёт новую страницу.
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
      обычный переход на MAIN-V2.
    */

    location.replace(
      mainUrl.href
    );

  }


  /* =========================================================
     МЯГКОЕ ОБНОВЛЕНИЕ ГЛАВНОЙ
     ========================================================= */

  function refreshMain() {


    /*
      Страница не уничтожается,
      поэтому интерфейс не пересобирается.
    */

    window.scrollTo(
      0,
      0
    );


    /*
      Общее событие для погоды,
      валюты и будущих виджетов.
    */

    try {

      window.dispatchEvent(
        new CustomEvent(
          "izmail:refresh"
        )
      );

    } catch (e) {}


    /*
      Также отправляем focus,
      потому что часть существующего кода
      уже может его использовать.
    */

    try {

      window.dispatchEvent(
        new Event(
          "focus"
        )
      );

    } catch (e) {}

  }


  /* =========================================================
     ОПРЕДЕЛЕНИЕ КНОПКИ «ГЛАВНАЯ»
     ========================================================= */

  function isHomeButton(element) {

    if (!element) {

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
     ПОЛУЧАЕМ АДРЕС ИЗ data-nav
     ========================================================= */

  function getDataNavUrl(
    element
  ) {

    var value =
      element.getAttribute(
        "data-nav"
      );


    if (
      !value ||
      value === "home"
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
     ПЕРЕХОД ПО data-nav
     ========================================================= */

  function navigateByDataNav(
    element,
    event
  ) {

    var url =
      getDataNavUrl(
        element
      );


    if (!url) {

      return false;

    }


    event.preventDefault();

    event.stopPropagation();

    event.stopImmediatePropagation();


    /*
      Если кнопка ведёт в главное меню.
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
      Если с MAIN-V2 уходим
      во внутренний раздел —
      запоминаем главную.
    */

    if (
      isMainPage() &&
      isInsideProject(
        url
      )
    ) {

      rememberMain();

    }


    /*
      Внутренний или внешний адрес.
    */

    location.href =
      url.href;


    return true;

  }


  /* =========================================================
     ЕДИНЫЙ ОБРАБОТЧИК ВСЕХ СУЩЕСТВУЮЩИХ
     И БУДУЩИХ КНОПОК
     ========================================================= */

  document.addEventListener(
    "click",
    function (event) {


      var element =
        event.target.closest(
          "a, button, [role='button'], [data-nav], [data-main-back], [data-action]"
        );


      if (!element) {

        return;

      }


      /* =====================================================
         1. ВЕРНУТЬСЯ В ГЛАВНОЕ МЕНЮ
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
         3. НОВЫЕ КНОПКИ С data-nav
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
         4. ОБЫЧНЫЕ ССЫЛКИ <a href="">
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
          Внешние Telegram, Instagram,
          Minfin и т.д. не трогаем.
        */

        if (
          !isInsideProject(
            url
          )
        ) {

          return;

        }


        /*
          Любая ссылка на MAIN-V2
          превращается в умный возврат.
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
          Если с MAIN-V2 открываем
          любую внутреннюю страницу —
          автоматически запоминаем главную.
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
     ВОЗВРАТ НА MAIN-V2 ИЗ ИСТОРИИ
     ========================================================= */

  window.addEventListener(
    "pageshow",
    function () {

      if (
        isMainPage()
      ) {

        window.scrollTo(
          0,
          0
        );

      }

    }
  );


})();
