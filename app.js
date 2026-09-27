(() => {
  "use strict";

  const tg = window.Telegram?.WebApp;

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.("#061b35");
      tg.setBackgroundColor?.("#061b35");
    } catch (e) {}
  }

  const links = window.LINKS || {};
  const weatherConfig = window.WEATHER || {};

  const $ = (id) => document.getElementById(id);

  // =========================================================
  // УДАЛЕНИЕ СЛУЖЕБНОГО ЭКРАНА ПЕРЕХОДА
  // =========================================================

  function removeNavigationOverlay() {
    const overlay =
      document.getElementById("navigationOverlay");

    if (overlay) {
      overlay.remove();
    }
  }

  // Если Telegram восстановил старую страницу из памяти,
  // удаляем оставшийся после перехода синий экран.
  window.addEventListener(
    "pageshow",
    function () {
      removeNavigationOverlay();

      setTimeout(() => {
        removeNavigationOverlay();

        try {
          tg?.ready?.();
          tg?.expand?.();
        } catch (e) {}
      }, 100);
    }
  );

  window.addEventListener(
    "focus",
    function () {
      removeNavigationOverlay();
    }
  );

  document.addEventListener(
    "visibilitychange",
    function () {
      if (
        document.visibilityState === "visible"
      ) {
        removeNavigationOverlay();

        setTimeout(() => {
          removeNavigationOverlay();

          try {
            tg?.ready?.();
            tg?.expand?.();
          } catch (e) {}
        }, 150);
      }
    }
  );

  // =========================================================
  // ПЛАВНЫЙ ПЕРЕХОД ВНУТРИ MINI APP
  // =========================================================

  function fastNavigate(url) {
    if (!url) return;

    try {
      tg?.HapticFeedback?.impactOccurred?.("light");
    } catch (e) {}

    removeNavigationOverlay();

    const overlay =
      document.createElement("div");

    overlay.id =
      "navigationOverlay";

    overlay.style.position =
      "fixed";

    overlay.style.inset =
      "0";

    overlay.style.zIndex =
      "999999";

    overlay.style.background =
      "#06152b";

    overlay.style.opacity =
      "0";

    overlay.style.transition =
      "opacity .08s ease";

    document.body.appendChild(
      overlay
    );

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    setTimeout(() => {
      window.location.href = url;
    }, 70);
  }

  // =========================================================
  // ССЫЛКИ
  // =========================================================

  function setLink(id, url) {
    const el = $(id);

    if (!el) return;

    if (!url) {
      el.href = "#";
      el.removeAttribute("target");
      el.removeAttribute("rel");

      el.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
        }
      );

      return;
    }

    el.href = url;

    // Эти страницы открываются внутри Mini App
    if (
      id === "shelterLink" ||
      id === "groupsLink"
    ) {
      el.removeAttribute("target");
      el.removeAttribute("rel");

      el.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          fastNavigate(url);

        }
      );

      return;
    }

    // Обычные Telegram-ссылки
    el.target = "_blank";
    el.rel =
      "noopener noreferrer";

    el.addEventListener(
      "click",
      () => {

        try {
          tg?.HapticFeedback?.impactOccurred?.(
            "light"
          );
        } catch (e) {}

      }
    );
  }

  // =========================================================
  // ОСНОВНАЯ ГРУППА
  // =========================================================

  setLink(
    "mainGroup",
    links.MAIN_GROUP
  );

  // =========================================================
  // УКРЫТИЯ
  // =========================================================

  const SHELTERS_URL =
    "https://vanku0613-cpu.github.io/telegram-mini-app/ukrytia/";

  setLink(
    "shelterLink",
    SHELTERS_URL
  );

  // =========================================================
  // ВСЕ НАШИ ГРУППЫ
  // =========================================================

  const GROUPS_URL =
    "https://vanku0613-cpu.github.io/telegram-mini-app/our-groups-menu/";

  setLink(
    "groupsLink",
    GROUPS_URL
  );

  // =========================================================
  // ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
  // =========================================================

  const AGREEMENT_URL =
    "https://vanku0613-cpu.github.io/telegram-mini-app/soglashenie/index.html";

  const agreementLink =
    document.querySelector(
      ".user-agreement"
    );

  if (agreementLink) {

    agreementLink.href =
      AGREEMENT_URL;

    agreementLink.removeAttribute(
      "target"
    );

    agreementLink.removeAttribute(
      "rel"
    );

    agreementLink.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        fastNavigate(
          AGREEMENT_URL
        );

      }
    );
  }

  // =========================================================
  // ОСТАЛЬНЫЕ РАЗДЕЛЫ
  // =========================================================

  setLink(
    "healthLink",
    links.HEALTH
  );

  setLink(
    "transportLink",
    links.TRANSPORT
  );

  setLink(
    "servicesLink",
    links.SERVICES
  );

  setLink(
    "foodLink",
    links.FOOD
  );

  setLink(
    "utilitiesLink",
    links.UTILITIES
  );

  setLink(
    "jobsLink",
    links.JOBS
  );

  setLink(
    "educationLink",
    links.EDUCATION
  );

  setLink(
    "leisureLink",
    links.LEISURE
  );

  // =========================================================
  // ГЛАВНАЯ
  // =========================================================

  const homeLink =
    $("homeLink");

  if (homeLink) {

    const HOME_URL =
      "https://vanku0613-cpu.github.io/telegram-mini-app/";

    homeLink.href =
      HOME_URL;

    homeLink.removeAttribute(
      "target"
    );

    homeLink.removeAttribute(
      "rel"
    );

    homeLink.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        try {
          tg?.HapticFeedback?.impactOccurred?.(
            "light"
          );
        } catch (e) {}

        window.location.assign(
          HOME_URL +
          "?reload=" +
          Date.now()
        );

      }
    );
  }

  // =========================================================
  // ЗАКАЗАТЬ РЕКЛАМУ
  // =========================================================

  const adsLink =
    $("adsLink");

  if (adsLink) {

    const ADS_URL =
      "https://t.me/Vanku13";

    adsLink.href =
      ADS_URL;

    // Оставляем обычную ссылку.
    // Не используем fastNavigate(),
    // openTelegramLink() или window.location.href.
    adsLink.target =
      "_blank";

    adsLink.rel =
      "noopener noreferrer";

    adsLink.addEventListener(
      "click",
      () => {

        try {
          tg?.HapticFeedback?.impactOccurred?.(
            "light"
          );
        } catch (e) {}

      }
    );
  }

  // =========================================================
  // ИЗБРАННОЕ
  // =========================================================

  const favoritesLink =
    $("favoritesLink");

  if (favoritesLink) {

    favoritesLink.href = "#";

    favoritesLink.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        try {
          tg?.HapticFeedback?.impactOccurred?.(
            "light"
          );
        } catch (e) {}

        let saved = [];

        try {

          saved =
            JSON.parse(
              localStorage.getItem(
                "izmail_directory_favorites"
              ) || "[]"
            );

        } catch (e) {}

        alert(
          saved.length
            ? "В избранном: " +
              saved.join(", ")
            : "Избранное пока пусто."
        );

      }
    );
  }

  // =========================================================
  // ПОИСК
  // =========================================================

  const searchHotspot =
    $("searchHotspot");

  const searchInput =
    $("directorySearchInput");

  if (
    searchHotspot &&
    searchInput
  ) {

    const updateSearchState =
      () => {

        searchHotspot.classList.toggle(
          "search-focused",
         
