(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const LINKS = window.LINKS || {};

  const WEATHER = window.WEATHER || {
    latitude: 45.35,
    longitude: 28.84,
    timezone: "Europe/Kyiv"
  };

  const categories = {
    health: ["Здоровье и уход", LINKS.HEALTH],
    transport: ["Транспорт и такси", LINKS.TRANSPORT],
    services: ["Услуги и мастера", LINKS.SERVICES],
    food: ["Продукты питания", LINKS.FOOD],
    utilities: ["Коммунальные службы", LINKS.UTILITIES],
    jobs: ["Работа и вакансии", LINKS.JOBS],
    education: ["Образование и развитие", LINKS.EDUCATION],
    leisure: ["Отдых, жильё, море", LINKS.LEISURE]
  };


  /* =====================================================
     TELEGRAM
     ===================================================== */

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();

    try {
      tg.setHeaderColor("#061a33");
      tg.setBackgroundColor("#061a33");
    } catch (_) {}
  }


  /* =====================================================
     РАЗМЕР КАРТИНКИ
     ===================================================== */

  function fitImageToScreen() {
    const screen = $("screen");
    const image = $("menuImage");

    if (!screen || !image) return;

    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    if (!naturalWidth || !naturalHeight) return;

    const viewportWidth =
      window.innerWidth;

    const viewportHeight =
      window.innerHeight;

    const imageRatio =
      naturalWidth / naturalHeight;

    const viewportRatio =
      viewportWidth / viewportHeight;

    let width;
    let height;

    /*
     * Картинка полностью помещается
     * в экран без обрезки.
     */

    if (imageRatio > viewportRatio) {

      width = viewportWidth;
      height = width / imageRatio;

    } else {

      height = viewportHeight;
      width = height * imageRatio;

    }

    screen.style.width = `${width}px`;
    screen.style.height = `${height}px`;
  }


  const menuImage = $("menuImage");

  if (menuImage) {

    if (menuImage.complete) {
      fitImageToScreen();
    } else {
      menuImage.addEventListener(
        "load",
        fitImageToScreen,
        { once: true }
      );
    }

  }

  window.addEventListener(
    "orientationchange",
    () => {
      setTimeout(fitImageToScreen, 150);
    }
  );

  window.addEventListener(
    "resize",
    fitImageToScreen
  );


  /* =====================================================
     MODAL
     ===================================================== */

  function show(title, content) {

    $("modalTitle").textContent = title;

    $("modalBody").innerHTML = content;

    $("modal").classList.remove("hidden");
  }


  function closeModal() {

    $("modal").classList.add("hidden");
  }


  $("close").addEventListener(
    "click",
    closeModal
  );


  $("modal").addEventListener(
    "click",
    (event) => {

      if (
        event.target === $("modal")
      ) {
        closeModal();
      }

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {
        closeModal();
      }

    }
  );


  /* =====================================================
     ОТКРЫТИЕ ССЫЛОК
     ===================================================== */

  function openLink(url, title) {

    if (!url) {

      show(
        title || "Раздел справочника",
        "<p>Ссылка для этого раздела пока не добавлена.</p>"
      );

      return;
    }


    if (
      tg &&
      /^https?:\/\/t\.me\//i.test(url)
    ) {

      tg.openTelegramLink(url);

    } else if (tg) {

      tg.openLink(url);

    } else {

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    }

  }


  /* =====================================================
     КАТЕГОРИЯ
     ===================================================== */

  function category(key) {

    const item =
      categories[key];

    if (!item) return;

    openLink(
      item[1],
      item[0]
    );
  }


  /* =====================================================
     ПОИСК — ПРЯМО НА КАРТИНКЕ
     ===================================================== */

  const searchInput =
    $("searchInput");

  const searchResults =
    $("searchResults");


  function clearSearchResults() {

    searchResults.innerHTML = "";

    searchResults.classList.add(
      "hidden"
    );
  }


  function performSearch() {

    const query =
      searchInput.value
        .trim()
        .toLowerCase();


    if (!query) {

      clearSearchResults();

      return;
    }


    const matches =
      Object.entries(categories)
        .filter(([, item]) => {

          return item[0]
            .toLowerCase()
            .includes(query);

        });


    searchResults.innerHTML = "";


    if (!matches.length) {

      const empty =
        document.createElement("div");

      empty.className =
        "search-result";

      empty.textContent =
        "Ничего не найдено";

      searchResults.appendChild(
        empty
      );

      searchResults.classList.remove(
        "hidden"
      );

      return;
    }


    matches.forEach(
      ([key, item]) => {

        const result =
          document.createElement("button");

        result.type = "button";

        result.className =
          "search-result";

        result.textContent =
          item[0];


        result.addEventListener(
          "click",
          () => {

            clearSearchResults();

            searchInput.blur();

            category(key);

          }
        );


        searchResults.appendChild(
          result
        );

      }
    );


    searchResults.classList.remove(
      "hidden"
    );
  }


  searchInput.addEventListener(
    "input",
    performSearch
  );


  searchInput.addEventListener(
    "focus",
    () => {

      if (
        searchInput.value.trim()
      ) {
        performSearch();
      }

    }
  );


  /* =====================================================
     КЛИК ВНЕ РЕЗУЛЬТАТОВ
     ===================================================== */

  document.addEventListener(
    "pointerdown",
    (event) => {

      if (
        !event.target.closest(
          ".search-area"
        )
      ) {

        clearSearchResults();

      }

    }
  );


  /* =====================================================
     ГЛАВНАЯ
     ===================================================== */

  function main() {

    openLink(
      LINKS.MAIN_GROUP,
      "Главная"
    );

  }


  /* =====================================================
     УКРЫТИЯ
     ===================================================== */

  function shelters() {

    openLink(
      LINKS.SHELTERS,
      "Укрытия Измаил"
    );

  }


  /* =====================================================
     НАШИ ГРУППЫ
     ===================================================== */

  function groups() {

    openLink(
      LINKS.OUR_GROUPS,
      "Наши группы"
    );

  }


  /* =====================================================
     РЕКЛАМА
     ===================================================== */

  function ad() {

    openLink(
      LINKS.INSTAGRAM,
      "Реклама"
    );

  }


  /* =====================================================
     ИЗБРАННОЕ
     ===================================================== */

  function favorites() {

    show(
      "Избранное",
      "<p>Избранное пока пустое.</p>"
    );

  }


  /* =====================================================
     ПОГОДА
     ===================================================== */

  function weatherDescription(code) {

    const descriptions = {

      0: "Ясно",

      1: "Преимущественно ясно",

      2: "Переменная облачность",

      3: "Облачно",

      45: "Туман",

      48: "Изморозь",

      51: "Морось",

      53: "Морось",

      55: "Сильная морось",

      61: "Небольшой дождь",

      63: "Дождь",

      65: "Сильный дождь",

      71: "Небольшой снег",

      73: "Снег",

      75: "Сильный снег",

      80: "Ливень",

      81: "Ливень",

      82: "Сильный ливень",

      95: "Гроза",

      96: "Гроза с градом",

      99: "Сильная гроза"

    };


    return (
      descriptions[code] ||
      "Погодные условия"
    );

  }


  /* =====================================================
     ПОЛУЧЕНИЕ ПОГОДЫ
     ===================================================== */

  async function loadWeather() {

    const element =
      $("liveWeather");


    try {

      const url =
        new URL(
          "https://api.open-meteo.com/v1/forecast"
        );


      url.search =
        new URLSearchParams({

          latitude:
            WEATHER.latitude,

          longitude:
            WEATHER.longitude,

          current:
            "temperature_2m,weather_code",

          timezone:
            WEATHER.timezone

        });


      const response =
        await fetch(url);


      if (!response.ok) {
        throw new Error();
      }


      const data =
        await response.json();


      const current =
        data.current;


      element.textContent =
        `${Math.round(
          current.temperature_2m
        )}°`;


      element.title =
        weatherDescription(
          current.weather_code
        );


      window.currentWeather = {

        temperature:
          current.temperature_2m,

        description:
          weatherDescription(
            current.weather_code
          )

      };


    } catch (_) {

      element.textContent =
        "—°";

      element.title =
        "Погода временно недоступна";

    }

  }


  /* =====================================================
     ПОДРОБНАЯ ПОГОДА
     ===================================================== */

  async function showWeather() {

    show(
      "Погода в Измаиле",
      "<p>Загружаем погоду...</p>"
    );


    try {

      const url =
        new URL(
          "https://api.open-meteo.com/v1/forecast"
        );


      url.search =
        new URLSearchParams({

          latitude:
            WEATHER.latitude,

          longitude:
            WEATHER.longitude,

          current:
            "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",

          timezone:
            WEATHER.timezone

        });


      const response =
        await fetch(url);


      if (!response.ok) {
        throw new Error();
      }


      const data =
        await response.json();


      const current =
        data.current;


      $("modalBody").innerHTML = `

        <p>
          <b>
            ${Math.round(
              current.temperature_2m
            )}°C
          </b>

          —
          ${weatherDescription(
            current.weather_code
          )}
        </p>

        <p>
          Влажность:
          ${current.relative_humidity_2m}%
        </p>

        <p>
          Ветер:
          ${current.wind_speed_10m} км/ч
        </p>

      `;


    } catch (_) {

      $("modalBody").innerHTML =
        "<p class='data-error'>" +
        "Не удалось загрузить погоду." +
        "</p>";

    }

  }


  /* =====================================================
     КУРС ВАЛЮТ
     ===================================================== */

  async function loadCurrency() {

    try {

      const [
        usdResponse,
        eurResponse
      ] = await Promise.all([

        fetch(
          "https://api.frankfurter.dev/v1/latest?base=USD&symbols=UAH"
        ),

        fetch(
          "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=UAH"
        )

      ]);


      if (
        !usdResponse.ok ||
        !eurResponse.ok
      ) {

        throw new Error();

      }


      const usdData =
        await usdResponse.json();

      const eurData =
        await eurResponse.json();


      const usd =
        usdData.rates.UAH;

      const eur =
        eurData.rates.UAH;


      $("liveUsd").textContent =
        `USD ${usd.toFixed(2)}`;


      $("liveEur").textContent =
        `EUR ${eur.toFixed(2)}`;


      window.currentCurrency = {
        usd,
        eur
      };


    } catch (_) {

      $("liveUsd").textContent =
        "USD —";

      $("liveEur").textContent =
        "EUR —";

    }

  }


  /* =====================================================
     ПОДРОБНЫЙ КУРС
     ===================================================== */

  async function showCurrency() {

    show(
      "Курс валют",
      "<p>Загружаем курсы...</p>"
    );


    try {

      const [
        usdResponse,
        eurResponse
      ] = await Promise.all([

        fetch(
          "https://api.frankfurter.dev/v1/latest?base=USD&symbols=UAH"
        ),

        fetch(
          "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=UAH"
        )

      ]);


      if (
        !usdResponse.ok ||
        !eurResponse.ok
      ) {

        throw new Error();

      }


      const usdData =
        await usdResponse.json();

      const eurData =
        await eurResponse.json();


      $("modalBody").innerHTML = `

        <p>
          <b>1 USD</b> =
          ${usdData.rates.UAH.toFixed(2)}
          грн
        </p>

        <p>
          <b>1 EUR</b> =
          ${eurData.rates.UAH.toFixed(2)}
          грн
        </p>

        <p class="small">
          Дата курса:
          ${usdData.date}
        </p>

      `;


    } catch (_) {

      $("modalBody").innerHTML =
        "<p class='data-error'>" +
        "Не удалось загрузить курс валют." +
        "</p>";

    }

  }


  /* =====================================================
     ДЕЙСТВИЯ
     ===================================================== */

  const actions = {

    main,

    weather:
      showWeather,

    currency:
      showCurrency,

    shelters,

    search:
      () => searchInput.focus(),

    groups,

    ad,

    favorites,

    health:
      () => category("health"),

    transport:
      () => category("transport"),

    services:
      () => category("services"),

    food:
      () => category("food"),

    utilities:
      () => category("utilities"),

    jobs:
      () => category("jobs"),

    education:
      () => category("education"),

    leisure:
      () => category("leisure")

  };


  /* =====================================================
     КНОПКИ
     ===================================================== */

  document
    .querySelectorAll("[data-action]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const action =
            actions[
              button.dataset.action
            ];


          if (action) {
            action();
          }

        }
      );

    });


  /* =====================================================
     ЗАПУСК
     ===================================================== */

  loadWeather();

  loadCurrency();


  setInterval(
    loadWeather,
    30 * 60 * 1000
  );


  setInterval(
    loadCurrency,
    60 * 60 * 1000
  );

})();
/* =========================================
   ПОГОДА + КУРС ВАЛЮТ
   ========================================= */

(() => {
  "use strict";

  /* -----------------------------------------
     ИЗМАИЛ
     ----------------------------------------- */

  const WEATHER = {
    latitude: 45.35,
    longitude: 28.84,
    timezone: "Europe/Kyiv"
  };


  /* =========================================
     ПОГОДА
     ========================================= */

  const weatherDescriptions = {
    0: ["Ясно", "☀️"],
    1: ["Преимущественно ясно", "🌤️"],
    2: ["Переменная облачность", "⛅"],
    3: ["Пасмурно", "☁️"],
    45: ["Туман", "🌫️"],
    48: ["Туман", "🌫️"],
    51: ["Небольшой дождь", "🌦️"],
    53: ["Дождь", "🌦️"],
    55: ["Сильный дождь", "🌧️"],
    61: ["Небольшой дождь", "🌦️"],
    63: ["Дождь", "🌧️"],
    65: ["Сильный дождь", "🌧️"],
    71: ["Небольшой снег", "🌨️"],
    73: ["Снег", "❄️"],
    75: ["Сильный снег", "❄️"],
    80: ["Ливень", "🌦️"],
    81: ["Ливень", "🌧️"],
    82: ["Сильный ливень", "⛈️"],
    95: ["Гроза", "⛈️"],
    96: ["Гроза", "⛈️"],
    99: ["Сильная гроза", "⛈️"]
  };


  async function loadWeather() {

    try {

      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${WEATHER.latitude}` +
        `&longitude=${WEATHER.longitude}` +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
        "&timezone=Europe%2FKyiv";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Weather API error");
      }

      const data = await response.json();
      const current = data.current;

      const code = current.weather_code;
      const description =
        weatherDescriptions[code] || ["Погода", "🌤️"];

      const temp = Math.round(current.temperature_2m);
      const feels = Math.round(current.apparent_temperature);
      const humidity = Math.round(current.relative_humidity_2m);
      const wind = Math.round(current.wind_speed_10m);

      const tempElement = document.getElementById("weatherTemp");
      const feelsElement = document.getElementById("weatherFeels");
      const humidityElement = document.getElementById("weatherHumidity");
      const windElement = document.getElementById("weatherWind");
      const descriptionElement =
        document.getElementById("weatherDescription");
      const iconElement =
        document.getElementById("weatherIcon");

      if (tempElement) tempElement.textContent = temp;
      if (feelsElement) feelsElement.textContent = `${feels}°`;
      if (humidityElement) humidityElement.textContent = `${humidity}%`;
      if (windElement) windElement.textContent = `${wind} км/ч`;

      if (descriptionElement) {
        descriptionElement.textContent = description[0];
      }

      if (iconElement) {
        iconElement.textContent = description[1];
      }

    } catch (error) {

      console.error("Ошибка загрузки погоды:", error);

      const description =
        document.getElementById("weatherDescription");

      if (description) {
        description.textContent = "Не удалось загрузить погоду";
      }
    }
  }


  /* =========================================
     КУРС ВАЛЮТ
     ========================================= */

  async function loadCurrency() {

    try {

      /*
       * Frankfurter API
       * EUR → USD / MDL / UAH
       */

      const url =
        "https://api.frankfurter.app/latest?from=EUR&to=USD,UAH,MDL";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Currency API error");
      }

      const data = await response.json();
      const rates = data.rates;

      /*
       * Пересчитываем всё относительно гривны.
       *
       * Frankfurter даёт официальный reference rate,
       * поэтому для покупки/продажи используем один
       * справочный курс.
       */

      const eurUah = rates.UAH;
      const usdUah = eurUah / rates.USD;
      const mdlUah = eurUah / rates.MDL;

      const usdBuy = (usdUah * 0.995).toFixed(2);
      const usdSell = (usdUah * 1.005).toFixed(2);

      const eurBuy = (eurUah * 0.995).toFixed(2);
      const eurSell = (eurUah * 1.005).toFixed(2);

      const mdlRate = mdlUah.toFixed(2);

      const usdBuyElement =
        document.getElementById("usdBuy");

      const usdSellElement =
        document.getElementById("usdSell");

      const eurBuyElement =
        document.getElementById("eurBuy");

      const eurSellElement =
        document.getElementById("eurSell");

      const mdlRateElement =
        document.getElementById("mdlRate");

      if (usdBuyElement) {
        usdBuyElement.textContent = `${usdBuy} ₴`;
      }

      if (usdSellElement) {
        usdSellElement.textContent = `${usdSell} ₴`;
      }

      if (eurBuyElement) {
        eurBuyElement.textContent = `${eurBuy} ₴`;
      }

      if (eurSellElement) {
        eurSellElement.textContent = `${eurSell} ₴`;
      }

      if (mdlRateElement) {
        mdlRateElement.textContent = `${mdlRate} ₴`;
      }

      const updateElement =
        document.getElementById("currencyUpdate");

      if (updateElement) {

        const date = new Date();

        updateElement.textContent =
          "Справочный курс • обновлено " +
          date.toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit"
          });
      }

    } catch (error) {

      console.error("Ошибка загрузки курса:", error);

      const updateElement =
        document.getElementById("currencyUpdate");

      if (updateElement) {
        updateElement.textContent =
          "Курс временно недоступен";
      }
    }
  }


  /* =========================================
     ЗАПУСК
     ========================================= */

  loadWeather();
  loadCurrency();

  /*
   * Обновляем погоду каждые 10 минут.
   */

  setInterval(loadWeather, 10 * 60 * 1000);

  /*
   * Обновляем валюту каждый час.
   */

  setInterval(loadCurrency, 60 * 60 * 1000);

})();
