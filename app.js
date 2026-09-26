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

  const weatherWidget = $("weatherWidget");
  const weatherTemp = $("weatherTemp");
  const weatherText = $("weatherText");


  /*
   * ПРИНУДИТЕЛЬНО НАСТРАИВАЕМ ВНУТРЕННЕЕ РАСПОЛОЖЕНИЕ
   * ТЕКСТА ПОГОДЫ.
   *
   * Размер и положение самого виджета НЕ меняются.
   */

  if (weatherWidget) {

    weatherWidget.style.display = "flex";
    weatherWidget.style.flexDirection = "column";
    weatherWidget.style.justifyContent = "center";
    weatherWidget.style.alignItems = "flex-start";
    weatherWidget.style.overflow = "hidden";
    weatherWidget.style.padding = "5px 12px";
    weatherWidget.style.gap = "0";

  }


  if (weatherTemp) {

    weatherTemp.style.display = "block";
    weatherTemp.style.width = "100%";
    weatherTemp.style.margin = "2px 0 0 0";
    weatherTemp.style.padding = "0";
    weatherTemp.style.lineHeight = "1";
    weatherTemp.style.whiteSpace = "nowrap";

  }


  if (weatherText) {

    weatherText.style.display = "block";
    weatherText.style.width = "100%";
    weatherText.style.minWidth = "0";
    weatherText.style.margin = "3px 0 0 0";
    weatherText.style.padding = "0";
    weatherText.style.lineHeight = "1";
    weatherText.style.whiteSpace = "nowrap";
    weatherText.style.overflow = "hidden";
    weatherText.style.textOverflow = "ellipsis";
    weatherText.style.opacity = "0.95";

  }


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

    const searchValue =
      document.createElement("div");


    searchValue.id =
      "directorySearchValue";


    searchValue.setAttribute(
      "aria-hidden",
      "true"
    );


    searchValue.style.position =
      "absolute";

    searchValue.style.zIndex =
      "11";

    searchValue.style.left =
      "13.5%";

    searchValue.style.right =
      "12%";

    searchValue.style.top =
      "50%";

    searchValue.style.transform =
      "translateY(-50%)";


    searchValue.style.margin =
      "0";

    searchValue.style.padding =
      "0";


    searchValue.style.background =
      "transparent";

    searchValue.style.backgroundColor =
      "transparent";


    searchValue.style.border =
      "0";

    searchValue.style.boxShadow =
      "none";


    searchValue.style.color =
      "#ffffff";

    searchValue.style.fontFamily =
      "Arial, Helvetica, sans-serif";

    searchValue.style.fontSize =
      "clamp(12px, 2.5vw, 18px)";

    searchValue.style.fontWeight =
      "700";

    searchValue.style.lineHeight =
      "1";

    searchValue.style.textAlign =
      "left";

    searchValue.style.whiteSpace =
      "nowrap";

    searchValue.style.overflow =
      "hidden";

    searchValue.style.textOverflow =
      "ellipsis";


    searchValue.style.pointerEvents =
      "none";


    searchHotspot.appendChild(
      searchValue
    );


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
      "0";


    searchInput.style.background =
      "transparent";

    searchInput.style.backgroundColor =
      "transparent";

    searchInput.style.backgroundImage =
      "none";


    searchInput.style.border =
      "0";

    searchInput.style.outline =
      "0";

    searchInput.style.boxShadow =
      "none";


    searchInput.style.opacity =
      "0";

    searchInput.style.color =
      "transparent";

    searchInput.style.caretColor =
      "transparent";


    searchInput.style.zIndex =
      "20";


    searchInput.style.webkitAppearance =
      "none";

    searchInput.style.appearance =
      "none";


    searchInput.style.webkitTextFillColor =
      "transparent";


    searchInput.style.borderRadius =
      "inherit";


    searchInput.style.cursor =
      "text";


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
        opacity: 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
        border: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        -webkit-appearance: none !important;
        appearance: none !important;
        -webkit-text-fill-color: transparent !important;
        color: transparent !important;
        caret-color: transparent !important;
      }

      #directorySearchInput::-webkit-search-cancel-button,
      #directorySearchInput::-webkit-search-decoration,
      #directorySearchInput::-webkit-search-results-button,
      #directorySearchInput::-webkit-search-results-decoration {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }

      #directorySearchValue {
        pointer-events: none !important;
      }

    `;


    document.head.appendChild(
      searchStyle
    );


    function updateSearchVisual() {

      const value =
        searchInput.value.trim();


      if (!value) {

        searchValue.textContent =
          "";

        searchHotspot.classList.remove(
          "search-focused"
        );

        return;
      }


      searchValue.textContent =
        searchInput.value;


      searchHotspot.classList.add(
        "search-focused"
      );

    }


    searchInput.addEventListener(
      "focus",
      () => {

        searchHotspot.classList.add(
          "search-focused"
        );

        updateSearchVisual();

      }
    );


    searchInput.addEventListener(
      "input",
      () => {

        updateSearchVisual();


        const query =
          searchInput.value
            .trim()
            .toLowerCase();


        if (!query) {

          clearSearchResults();

          return;
        }


        performSearch(query);

      }
    );


    searchInput.addEventListener(
      "blur",
      () => {

        if (!searchInput.value.trim()) {

          searchHotspot.classList.remove(
            "search-focused"
          );

          searchValue.textContent =
            "";

          clearSearchResults();

        }

      }
    );


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
