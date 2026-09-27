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
  // ПЛАВНЫЙ ПЕРЕХОД НА ДРУГУЮ СТРАНИЦУ
  // =========================================================

  function fastNavigate(url) {
    if (!url) return;

    try {
      tg?.HapticFeedback?.impactOccurred?.("light");
    } catch (e) {}

    const overlay = document.createElement("div");

    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999";
    overlay.style.background = "#06152b";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity .08s ease";

    document.body.appendChild(overlay);

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

    if (url) {
      el.href = url;

      if (id === "shelterLink") {
        el.removeAttribute("target");
        el.removeAttribute("rel");

        el.addEventListener("click", (event) => {
          event.preventDefault();
          fastNavigate(url);
        });

      } else {
        el.target = "_blank";
        el.rel = "noopener noreferrer";

        el.addEventListener("click", () => {
          try {
            tg?.HapticFeedback?.impactOccurred?.("light");
          } catch (e) {}
        });
      }

    } else {
      el.href = "#";

      el.removeAttribute("target");
      el.removeAttribute("rel");

      el.addEventListener("click", (event) => {
        event.preventDefault();
      });
    }
  }


  // =========================================================
  // ОСНОВНЫЕ ССЫЛКИ
  // =========================================================

  setLink("mainGroup", links.MAIN_GROUP);


  // =========================================================
  // УКРЫТИЯ
  // =========================================================

  const SHELTERS_URL =
    "https://vanku0613-cpu.github.io/telegram-mini-app/ukrytia/";

  setLink("shelterLink", SHELTERS_URL);


  // =========================================================
  // ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
  // =========================================================

  const AGREEMENT_URL =
    "https://vanku0613-cpu.github.io/telegram-mini-app/soglashenie/index.html";

  const agreementLink =
    document.querySelector(".user-agreement");

  if (agreementLink) {
    agreementLink.href = AGREEMENT_URL;

    agreementLink.removeAttribute("target");
    agreementLink.removeAttribute("rel");

    agreementLink.addEventListener("click", (event) => {
      event.preventDefault();
      fastNavigate(AGREEMENT_URL);
    });
  }


  // =========================================================
  // ОСТАЛЬНЫЕ ССЫЛКИ
  // =========================================================

  setLink("groupsLink", links.OUR_GROUPS);
  setLink("healthLink", links.HEALTH);
  setLink("transportLink", links.TRANSPORT);
  setLink("servicesLink", links.SERVICES);
  setLink("foodLink", links.FOOD);
  setLink("utilitiesLink", links.UTILITIES);
  setLink("jobsLink", links.JOBS);
  setLink("educationLink", links.EDUCATION);
  setLink("leisureLink", links.LEISURE);


  // =========================================================
  // ГЛАВНАЯ
  // =========================================================

  const homeLink = $("homeLink");

  if (homeLink) {

    homeLink.href =
      "https://vanku0613-cpu.github.io/telegram-mini-app/";

    homeLink.removeAttribute("target");
    homeLink.removeAttribute("rel");

    homeLink.addEventListener("click", (event) => {

      event.preventDefault();

      try {
        tg?.HapticFeedback?.impactOccurred?.("light");
      } catch (e) {}

      const HOME_URL =
        "https://vanku0613-cpu.github.io/telegram-mini-app/";

      const reloadUrl =
        HOME_URL +
        "?reload=" +
        Date.now();

      window.location.assign(reloadUrl);
    });
  }


  // =========================================================
  // ЗАКАЗАТЬ РЕКЛАМУ
  // =========================================================

  const adsLink = $("adsLink");

  if (adsLink) {

    const ADS_URL =
      "https://t.me/Vanku13";

    adsLink.href = ADS_URL;

    adsLink.removeAttribute("target");
    adsLink.removeAttribute("rel");

    adsLink.addEventListener("click", (event) => {
      event.preventDefault();
      fastNavigate(ADS_URL);
    });
  }


  // =========================================================
  // ИЗБРАННОЕ
  // =========================================================

  const favoritesLink = $("favoritesLink");

  if (favoritesLink) {
    favoritesLink.href = "#";

    favoritesLink.addEventListener("click", (event) => {
      event.preventDefault();

      try {
        tg?.HapticFeedback?.impactOccurred?.("light");
      } catch (e) {}

      let saved = [];

      try {
        saved = JSON.parse(
          localStorage.getItem(
            "izmail_directory_favorites"
          ) || "
