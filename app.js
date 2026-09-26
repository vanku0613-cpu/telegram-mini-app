(() => {
  "use strict";


  /*
   * =========================================================
   * НАСТРОЙКИ
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
   * ССЫЛКИ
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

    adsLink: "",
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
   * ПУСТЫЕ ССЫЛКИ
   * =========================================================
   */

  document.querySelectorAll(".hotspot").forEach((element) => {

    /*
     * Поиск не является ссылкой.
     */
    if (element.id === "searchHotspot") {
      return;
    }

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

      const latitude =
        Number(WEATHER.latitude);

      const longitude =
        Number(WEATHER.longitude);

      const timezone =
        WEATHER.timezone ||
        "Europe/Kyiv";


      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        "&current=temperature_2m,weather_code" +
        `&timezone=${encodeURIComponent(timezone)}`;


      const response =
        await fetch(url, {
          cache: "no-store"
        });


      if (!response.ok) {
        throw new Error(
          "Weather request failed"
        );
      }


      const data =
        await response.json();


      if (!data.current) {
        throw new Error(
          "No current weather"
        );
      }


      const temperature =
        Math.round(
          Number(
            data.current.temperature_2m
          )
        );


      const code =
        Number(
          data.current.weather_code
        );


      if (weatherTemp) {

        weatherTemp.textContent =
          `${temperature}°C`;

      }


      if (weatherText) {

        weatherText.textContent =
          weatherNames[code] ||
          "Погода";

      }

    } catch (_) {

      if (weatherTemp) {
        weatherTemp.textContent =
          "—°C";
      }

      if (weatherText) {
        weatherText.textContent =
          "Нет данных";
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


      const response =
        await fetch(url, {
          cache: "no-store"
        });


      if (!response.ok) {
        throw new Error(
          "Currency request failed"
        );
      }


      const data =
        await response.json();


      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid currency data"
        );
      }


      const usd =
        data.find(
          (item) =>
            String(item.cc)
              .toUpperCase() === "USD"
        );


      const eur =
        data.find(
          (item) =>
            String(item.cc)
              .toUpperCase() === "EUR"
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
   * =========================================================
   */

  const searchHotspot =
    $("searchHotspot");

  const searchInput =
    $("directorySearchInput");


  if (searchHotspot && searchInput) {


    /*
     * ---------------------------------------------------------
     * ВАЖНО:
     *
     * Никаких preventDefault()
     * Никаких touchstart
     * Никаких pointerdown
     *
     * Это настоящий HTML input.
     * Android должен сам открыть клавиатуру.
     * ---------------------------------------------------------
     */


    /*
     * ---------------------------------------------------------
     * Стили настоящего input
     * ---------------------------------------------------------
     */

    searchInput.style.position =
      "absolute";

    searchInput.style.left =
      "0";

    searchInput.style.top =
      "0";

    searchInput.style.width =
      "100%";

    searchInput.style.height =
      "100%";


    searchInput.style.margin =
      "0";

    searchInput.style.padding =
      "0 12% 0 13.5%";


    searchInput.style.border =
      "0";

    searchInput.style.outline =
      "none";

    searchInput.style.background =
      "transparent";


    searchInput.style.fontFamily =
      "Arial, Helvetica, sans-serif";

    searchInput.style.fontSize =
      "clamp(12px, 2.5vw, 18px)";

    searchInput.style.fontWeight =
      "700";

    searchInput.style.lineHeight =
      "1";

    searchInput.style.textAlign =
      "left";


    /*
     * Пока пусто — текст невидимый.
     */

    searchInput.style.color =
      "transparent";

    searchInput.style.caretColor =
      "transparent";


    searchInput.style.zIndex =
      "10";


    searchInput.style.webkitAppearance =
      "none";

    searchInput.style.appearance =
      "none";


    searchInput.style.borderRadius =
      "inherit";


    /*
     * ---------------------------------------------------------
     * Убираем стандартную кнопку X
     * ---------------------------------------------------------
     */

    const searchStyle =
      document.createElement("style");


    searchStyle.textContent = `

      #searchHotspot {
        overflow: hidden;
      }

      #searchHotspot::before {
        transition: opacity 100ms ease;
      }

      #searchHotspot.search-focused::before {
        opacity: 0;
      }

      #directorySearchInput {
        -webkit-user-select: text;
        user-select: text;
        -webkit-touch-callout: default;
      }

      #directorySearchInput:focus {
        color: #ffffff !important;
        caret-color: #ffffff !important;
      }

      #directorySearchInput::-webkit-search-cancel-button {
        display: none;
      }

      #directorySearchInput::-webkit-search-decoration {
        display: none;
      }

    `;


    document.head.appendChild(
      searchStyle
    );


    /*
     * ---------------------------------------------------------
     * ФОКУС
     * ---------------------------------------------------------
     */

    searchInput.addEventListener(
      "focus",
      () => {

        searchHotspot.classList.add(
          "search-focused"
        );

        searchInput.style.color =
          "#ffffff";

        searchInput.style.caretColor =
          "#ffffff";

      }
    );


    /*
     * ---------------------------------------------------------
     * ВВОД
     * ---------------------------------------------------------
     */

    searchInput.addEventListener(
      "input",
      () => {

        const query =
          searchInput.value
            .trim()
            .toLowerCase();


        /*
         * Если поле пустое —
         * возвращаем надпись.
         */

        if (!query) {

          searchHotspot.classList.remove(
            "search-focused"
          );

          searchInput.style.color =
            "transparent";

          searchInput.style.caretColor =
            "transparent";

          clearSearchResults();

          return;
        }


        /*
         * Есть текст —
         * надпись скрываем.
         */

        searchHotspot.classList.add(
          "search-focused"
        );


        searchInput.style.color =
          "#ffffff";

        searchInput.style.caretColor =
          "#ffffff";


        performSearch(query);

      }
    );


    /*
     * ---------------------------------------------------------
     * ПОТЕРЯ ФОКУСА
     * ---------------------------------------------------------
     */

    searchInput.addEventListener(
      "blur",
      () => {

        if (!searchInput.value.trim()) {

          searchHotspot.classList.remove(
            "search-focused"
          );

          searchInput.style.color =
            "transparent";

          searchInput.style.caretColor =
            "transparent";

          clearSearchResults();

        }

      }
    );


    /*
     * ---------------------------------------------------------
     * ENTER
     * ---------------------------------------------------------
     */

    searchInput.addEventListener(
      "keydown",
      (event) => {

        if (event.key !== "Enter") {
          return;
        }


        const query =
          searchInput.value
            .trim()
            .toLowerCase();


        if (!query) {
          return;
        }


        performSearch(query);

      }
    );

  }


  /*
   * =========================================================
   * ПОИСК ПО КАТЕГОРИЯМ
   * =========================================================
   */

  function performSearch(query) {

    const categories = [

      {
        hotspot: ".health-hotspot",

        words: [
          "здоровье",
          "медицина",
          "аптека",
          "аптеки",
          "красота",
          "врач",
          "доктор"
        ]
      },


      {
        hotspot: ".transport-hotspot",

        words: [
          "транспорт",
          "такси",
          "автобус",
          "автобусы",
          "перевозки"
        ]
      },


      {
        hotspot: ".services-hotspot",

        words: [
          "услуги",
          "мастер",
          "мастера",
          "ремонт",
          "строительство",
          "специалист",
          "специалисты"
        ]
      },


      {
        hotspot: ".food-hotspot",

        words: [
          "продукты",
          "еда",
          "магазин",
          "магазины",
          "рынок",
          "рынки",
          "доставка"
        ]
      },


      {
        hotspot: ".utilities-hotspot",

        words: [
          "коммунальные",
          "свет",
          "вода",
          "газ",
          "тепло"
        ]
      },


      {
        hotspot: ".jobs-hotspot",

        words: [
          "работа",
          "работы",
          "вакансия",
          "вакансии",
          "резюме"
        ]
      },


      {
        hotspot: ".education-hotspot",

        words: [
          "образование",
          "школа",
          "школы",
          "курсы",
          "репетитор",
          "репетиторы"
        ]
      },


      {
        hotspot: ".leisure-hotspot",

        words: [
          "отдых",
          "жильё",
          "жилье",
          "море",
          "база",
          "базы",
          "рестораны",
          "ресторан",
          "кафе"
        ]
      }

    ];


    categories.forEach(
      (category) => {

        const element =
          document.querySelector(
            category.hotspot
          );


        if (!element) {
          return;
        }


        const matched =
          category.words.some(
            (word) =>
              word.includes(query) ||
              query.includes(word)
          );


        element.classList.toggle(
          "search-match",
          matched
        );

      }
    );

  }


  /*
   * =========================================================
   * ОЧИСТКА РЕЗУЛЬТАТОВ
   * =========================================================
   */

  function clearSearchResults() {

    document
      .querySelectorAll(
        ".search-match"
      )
      .forEach(
        (element) => {

          element.classList.remove(
            "search-match"
          );

        }
      );

  }


  /*
   * =========================================================
   * ОБНОВЛЕНИЕ ПОГОДЫ И КУРСА
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
