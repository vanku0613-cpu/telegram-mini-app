(() => {
  "use strict";

  /*
   * =========================================================
   * БЕРЁМ НАСТРОЙКИ ИЗ config.js
   * =========================================================
   */

  const LINKS = window.LINKS || {};

  const WEATHER = window.WEATHER || {
    latitude: 45.35,
    longitude: 28.84,
    timezone: "Europe/Kyiv"
  };


  /*
   * =========================================================
   * TELEGRAM
   * =========================================================
   */

  const tg = window.Telegram?.WebApp;

  if (tg) {
    try {
      tg.ready();
      tg.expand();

      if (typeof tg.setHeaderColor === "function") {
        tg.setHeaderColor("#061b35");
      }

      if (typeof tg.setBackgroundColor === "function") {
        tg.setBackgroundColor("#061b35");
      }
    } catch (_) {}
  }


  /*
   * =========================================================
   * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
   * =========================================================
   */

  const $ = (id) => document.getElementById(id);


  /*
   * =========================================================
   * ПОДКЛЮЧАЕМ ССЫЛКИ
   * =========================================================
   */

  const linkMap = {
    mainGroup: LINKS.MAIN_GROUP,
    shelterLink: LINKS.SHELTERS,

    healthLink: LINKS.HEALTH,
    transportLink: LINKS.TRANSPORT,
    servicesLink: LINKS.SERVICES,
    foodLink: LINKS.FOOD,
    utilitiesLink: LINKS.UTILITIES,
    jobsLink: LINKS.JOBS,
    educationLink: LINKS.EDUCATION,
    leisureLink: LINKS.LEISURE,

    groupsLink: LINKS.OUR_GROUPS,

    homeLink: LINKS.MAIN_GROUP,

    /*
     * Пока отдельной ссылки на рекламу
     * в config.js нет.
     */
    adsLink: "",

    /*
     * Пока отдельной ссылки на избранное
     * в config.js нет.
     */
    favoritesLink: ""
  };


  Object.entries(linkMap).forEach(([id, url]) => {
    const element = $(id);

    if (!element || !url) {
      return;
    }

    element.href = url;

    if (/^https?:\/\//i.test(url)) {
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
  });


  /*
   * =========================================================
   * ПУСТЫЕ ССЫЛКИ НЕ ДЕЛАЮТ НИЧЕГО
   * НИКАКИХ ВСПЛЫВАЮЩИХ ОКОН.
   * =========================================================
   */

  document.querySelectorAll(".hotspot").forEach((element) => {

    element.addEventListener("click", (event) => {

      const href = element.getAttribute("href");

      if (!href || href === "#") {
        event.preventDefault();
      }

    });

  });


  /*
   * =========================================================
   * ПОГОДА
   * =========================================================
   */

  const weatherTemp = $("weatherTemp");
  const weatherText = $("weatherText");

  const weatherNames = {
    0: "Ясно",

    1: "Преимущественно ясно",
    2: "Переменная облачность",
    3: "Пасмурно",

    45: "Туман",
    48: "Туман",

    51: "Морось",
    53: "Морось",
    55: "Морось",

    56: "Ледяная морось",
    57: "Ледяная морось",

    61: "Небольшой дождь",
    63: "Дождь",
    65: "Сильный дождь",

    66: "Ледяной дождь",
    67: "Ледяной дождь",

    71: "Небольшой снег",
    73: "Снег",
    75: "Сильный снег",

    77: "Снежные зёрна",

    80: "Ливень",
    81: "Ливень",
    82: "Сильный ливень",

    85: "Снегопад",
    86: "Сильный снегопад",

    95: "Гроза",
    96: "Гроза с градом",
    99: "Гроза с градом"
  };


  async function loadWeather() {

    try {

      const latitude = Number(WEATHER.latitude);
      const longitude = Number(WEATHER.longitude);
      const timezone =
        WEATHER.timezone || "Europe/Kyiv";

      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        "&current=temperature_2m,weather_code" +
        `&timezone=${encodeURIComponent(timezone)}`;

      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Weather request failed");
      }

      const data = await response.json();

      if (!data.current) {
        throw new Error("No current weather");
      }

      const temperature =
        Math.round(Number(data.current.temperature_2m));

      const code =
        Number(data.current.weather_code);

      if (weatherTemp) {
        weatherTemp.textContent =
          `${temperature}°C`;
      }

      if (weatherText) {
        weatherText.textContent =
          weatherNames[code] || "Погода";
      }

    } catch (_) {

      if (weatherTemp) {
        weatherTemp.textContent = "—°C";
      }

      if (weatherText) {
        weatherText.textContent = "Нет данных";
      }

    }

  }

  loadWeather();


  /*
   * =========================================================
   * КУРС НБУ
   * =========================================================
   */

  const usdRate = $("usdRate");
  const eurRate = $("eurRate");


  async function loadCurrency() {

    try {

      const url =
        "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew?json";

      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Currency request failed");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid currency data");
      }

      const usd = data.find(
        (item) =>
          String(item.cc).toUpperCase() === "USD"
      );

      const eur = data.find(
        (item) =>
          String(item.cc).toUpperCase() === "EUR"
      );


      if (usd && usdRate) {
        usdRate.textContent =
          `${Number(usd.rate).toFixed(2)} ₴`;
      }

      if (eur && eurRate) {
        eurRate.textContent =
          `${Number(eur.rate).toFixed(2)} ₴`;
      }

    } catch (_) {

      if (usdRate) {
        usdRate.textContent = "—";
      }

      if (eurRate) {
        eurRate.textContent = "—";
      }

    }

  }

  loadCurrency();


  /*
   * =========================================================
   * ПОИСК
   *
   * Пока ссылка поиска не задана,
   * НИЧЕГО НЕ ВЫСКАКИВАЕТ.
   * =========================================================
   */

  const searchButton = $("searchHotspot");

  if (searchButton) {

    searchButton.addEventListener("click", () => {

      if (LINKS.SEARCH) {

        window.open(
          LINKS.SEARCH,
          "_blank",
          "noopener,noreferrer"
        );

      }

    });

  }


  /*
   * =========================================================
   * ОБНОВЛЕНИЕ ДАННЫХ
   * =========================================================
   */

  setInterval(
    loadWeather,
    30 * 60 * 1000
  );

  setInterval(
    loadCurrency,
    30 * 60 * 1000
  );

})();
