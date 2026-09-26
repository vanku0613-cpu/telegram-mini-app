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
   * ПУСТЫЕ ССЫЛКИ НЕ ДЕЛАЮТ НИЧЕГО
   * =========================================================
   */

  document.querySelectorAll(".hotspot").forEach((element) => {

    element.addEventListener("click", (event) => {

      /*
       * Поисковый input должен получать нажатие сам.
       */
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement
      ) {
        return;
      }

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
   * ПОИСК ПО СПРАВОЧНИКУ
   * =========================================================
   *
   * Декоративная надпись остаётся в CSS.
   *
   * Настоящий input создаётся программно
   * и полностью прозрачный.
   *
   * При нажатии:
   * - input получает фокус;
   * - декоративная надпись исчезает;
   * - появляется курсор;
   * - пользователь может вводить текст.
   *
   * При очистке:
   * - декоративная надпись возвращается.
   * =========================================================
   */

  const searchHotspot = $("searchHotspot");

  let searchInput = null;


  /*
   * Данные категорий справочника.
   */

  const searchCategories = [
    {
      selector: ".health-hotspot",
      title: "Здоровье и уход",
      text:
        "медицина аптеки красота врач клиника больница стоматология косметология здоровье"
    },

    {
      selector: ".transport-hotspot",
      title: "Транспорт Такси",
      text:
        "такси транспорт автобусы перевозки маршрутка водитель трансфер"
    },

    {
      selector: ".services-hotspot",
      title: "Услуги и мастера",
      text:
        "услуги мастера ремонт строительство специалисты сантехник электрик ремонт квартир"
    },

    {
      selector: ".food-hotspot",
      title: "Продукты питания",
      text:
        "продукты магазины рынки доставка супермаркет еда продукты питание"
    },

    {
      selector: ".utilities-hotspot",
      title: "Коммунальные службы",
      text:
        "коммунальные службы свет вода газ тепло электричество отопление"
    },

    {
      selector: ".jobs-hotspot",
      title: "Работа Вакансии",
      text:
        "работа вакансии найти работу резюме трудоустройство работодатель"
    },

    {
      selector: ".education-hotspot",
      title: "Образование и развитие",
      text:
        "образование школы курсы репетиторы обучение уроки английский язык развитие"
    },

    {
      selector: ".leisure-hotspot",
      title: "Отдых Жильё Море",
      text:
        "отдых жилье море базы отдыха рестораны кафе гостиницы отели туризм"
    }
  ];


  /*
   * Нормализация текста.
   */

  function normalizeSearchText(value) {

    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .trim();

  }


  /*
   * Создаём невидимое поле поиска.
   */

  if (searchHotspot) {

    searchInput =
      document.createElement("input");

    searchInput.type = "search";

    searchInput.className =
      "search-input";

    searchInput.autocomplete = "off";

    searchInput.autocorrect = "off";

    searchInput.autocapitalize = "none";

    searchInput.spellcheck = false;

    searchInput.setAttribute(
      "aria-label",
      "Поиск по справочнику Измаил"
    );

    /*
     * Сам input невидимый.
     * Визуально остаётся только
     * декоративная надпись из CSS.
     */

    searchHotspot.appendChild(searchInput);


    /*
     * Нажатие прямо на input.
     */

    searchInput.addEventListener(
      "focus",
      () => {

        searchHotspot.classList.add(
          "search-focused"
        );

      }
    );


    /*
     * Когда пользователь печатает.
     */

    searchInput.addEventListener(
      "input",
      () => {

        performSearch(
          searchInput.value
        );

        /*
         * Если поле снова пустое —
         * декоративная надпись возвращается.
         */

        if (
          normalizeSearchText(
            searchInput.value
          ) === ""
        ) {

          searchHotspot.classList.remove(
            "search-focused"
          );

        } else {

          searchHotspot.classList.add(
            "search-focused"
          );

        }

      }
    );


    /*
     * Потеря фокуса:
     *
     * если ничего не введено —
     * возвращаем декоративную надпись.
     */

    searchInput.addEventListener(
      "blur",
      () => {

        if (
          normalizeSearchText(
            searchInput.value
          ) === ""
        ) {

          searchHotspot.classList.remove(
            "search-focused"
          );

        }

      }
    );


    /*
     * Нажатие на всю область поиска.
     *
     * Фокусируем невидимый input.
     */

    searchHotspot.addEventListener(
      "pointerdown",
      (event) => {

        /*
         * Если нажали именно на input,
         * браузер сам обработает фокус.
         */

        if (
          event.target === searchInput
        ) {
          return;
        }

        event.preventDefault();

        searchInput.focus();

      }
    );


    /*
     * Enter.
     */

    searchInput.addEventListener(
      "keydown",
      (event) => {

        if (event.key !== "Enter") {
          return;
        }

        event.preventDefault();

        const results =
          getSearchResults(
            searchInput.value
          );

        /*
         * Если найден один раздел
         * и у него есть рабочая ссылка —
         * открываем её.
         */

        if (results.length === 1) {

          const element =
            document.querySelector(
              results[0].selector
            );

          if (!element) {
            return;
          }

          const href =
            element.getAttribute("href");

          if (
            href &&
            href !== "#"
          ) {

            if (
              /^https?:\/\//i.test(href)
            ) {

              window.open(
                href,
                "_blank",
                "noopener,noreferrer"
              );

            } else {

              window.location.href = href;

            }

          }

        }

      }
    );

  }


  /*
   * =========================================================
   * ПОЛУЧИТЬ РЕЗУЛЬТАТЫ ПОИСКА
   * =========================================================
   */

  function getSearchResults(value) {

    const query =
      normalizeSearchText(value);

    if (!query) {
      return [];
    }

    const words =
      query
        .split(/\s+/)
        .filter(Boolean);


    return searchCategories.filter(
      (category) => {

        const haystack =
          normalizeSearchText(
            `${category.title} ${category.text}`
          );

        return words.every(
          (word) =>
            haystack.includes(word)
        );

      }
    );

  }


  /*
   * =========================================================
   * ВЫПОЛНИТЬ ПОИСК
   * =========================================================
   */

  function performSearch(value) {

    const query =
      normalizeSearchText(value);


    const categoryElements =
      searchCategories
        .map(
          (category) =>
            document.querySelector(
              category.selector
            )
        )
        .filter(Boolean);


    /*
     * Пустой поиск:
     * возвращаем всё как было.
     */

    if (!query) {

      categoryElements.forEach(
        (element) => {

          element.classList.remove(
            "search-match"
          );

          element.classList.remove(
            "search-no-match"
          );

        }
      );

      return;

    }


    const results =
      getSearchResults(query);

    const resultSelectors =
      new Set(
        results.map(
          (item) => item.selector
        )
      );


    categoryElements.forEach(
      (element) => {

        const category =
          searchCategories.find(
            (item) =>
              document.querySelector(
                item.selector
              ) === element
          );

        if (
          category &&
          resultSelectors.has(
            category.selector
          )
        ) {

          element.classList.add(
            "search-match"
          );

          element.classList.remove(
            "search-no-match"
          );

        } else {

          element.classList.remove(
            "search-match"
          );

          element.classList.add(
            "search-no-match"
          );

        }

      }
    );

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
