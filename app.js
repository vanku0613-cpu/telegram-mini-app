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
