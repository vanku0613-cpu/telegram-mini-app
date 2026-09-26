(() => {

  "use strict";


  /* =========================================================
     ССЫЛКИ

     Пока реальные ссылки от тебя не получены.
     Поэтому здесь ничего не выдумываем.
     ========================================================= */

  const LINKS = {

    MAIN_GROUP: "",

    SHELTERS: "",

    HEALTH: "",
    TRANSPORT: "",
    SERVICES: "",
    FOOD: "",
    UTILITIES: "",
    JOBS: "",
    EDUCATION: "",
    LEISURE: "",

    GROUPS: "",

    ADS: "",

    FAVORITES: ""

  };


  /* =========================================================
     ИЗМАИЛ — КООРДИНАТЫ ПОГОДЫ
     ========================================================= */

  const WEATHER = {

    latitude: 45.3493,

    longitude: 28.8408,

    timezone: "Europe/Kyiv"

  };


  const $ = (id) =>
    document.getElementById(id);


  /* =========================================================
     TELEGRAM
     ========================================================= */

  const tg =
    window.Telegram?.WebApp;


  if (tg) {

    try {

      tg.ready();

      tg.expand();

      tg.setHeaderColor("#061b35");

      tg.setBackgroundColor("#061b35");

    } catch (_) {}

  }


  /* =========================================================
     ПОДКЛЮЧАЕМ ССЫЛКИ
     ========================================================= */

  const linkMap = {

    mainGroup:
      LINKS.MAIN_GROUP,

    shelterLink:
      LINKS.SHELTERS,

    healthLink:
      LINKS.HEALTH,

    transportLink:
      LINKS.TRANSPORT,

    servicesLink:
      LINKS.SERVICES,

    foodLink:
      LINKS.FOOD,

    utilitiesLink:
      LINKS.UTILITIES,

    jobsLink:
      LINKS.JOBS,

    educationLink:
      LINKS.EDUCATION,

    leisureLink:
      LINKS.LEISURE,

    groupsLink:
      LINKS.GROUPS,

    adsLink:
      LINKS.ADS,

    favoritesLink:
      LINKS.FAVORITES,

    homeLink:
      ""

  };


  Object.entries(linkMap)
    .forEach(([id, url]) => {

      const element =
        $(id);

      if (!element || !url)
        return;


      element.href =
        url;

      element.target =
        "_blank";

      element.rel =
        "noopener noreferrer";

    });


  /* =========================================================
     ПОГОДА — OPEN-METEO
     ========================================================= */

  const weatherText = {

    0: "Ясно",

    1: "Преимущественно ясно",

    2: "Переменная облачность",

    3: "Пасмурно",

    45: "Туман",

    48: "Изморозь / туман",

    51: "Морось",

    53: "Морось",

    55: "Сильная морось",

    56: "Ледяная морось",

    57: "Сильная ледяная морось",

    61: "Небольшой дождь",

    63: "Дождь",

    65: "Сильный дождь",

    66: "Ледяной дождь",

    67: "Сильный ледяной дождь",

    71: "Небольшой снег",

    73: "Снег",

    75: "Сильный снег",

    77: "Снежные зёрна",

    80: "Ливни",

    81: "Ливни",

    82: "Сильные ливни",

    85: "Снегопад",

    86: "Сильный снегопад",

    95: "Гроза",

    96: "Гроза с градом",

    99: "Сильная гроза с градом"

  };


  async function loadWeather() {

    const tempElement =
      $("weatherTemp");

    const textElement =
      $("weatherText");


    try {

      const url =

        "https://api.open-meteo.com/v1/forecast" +

        `?latitude=${WEATHER.latitude}` +

        `&longitude=${WEATHER.longitude}` +

        "&current=temperature_2m,weather_code" +

        "&temperature_unit=celsius" +

        `&timezone=${encodeURIComponent(
          WEATHER.timezone
        )}`;


      const response =
        await fetch(url, {

          method: "GET",

          cache: "no-store"

        });


      if (!response.ok)
        throw new Error(
          "Weather request failed"
        );


      const data =
        await response.json();


      const temperature =
        Math.round(
          Number(
            data?.current?.temperature_2m
          )
        );


      const code =
        Number(
          data?.current?.weather_code
        );


      tempElement.textContent =
        Number.isFinite(temperature)
          ? `${temperature}°`
          : "—°";


      textElement.textContent =
        weatherText[code]
          || "Погода обновляется";


    } catch (error) {

      console.error(error);


      tempElement.textContent =
        "—°";


      textElement.textContent =
        "Не удалось загрузить";

    }

  }


  /* =========================================================
     КУРС ВАЛЮТ

     Minfin имеет отдельную страницу именно Измаила.

     Прямой API Minfin требует API-ключ.
     Поэтому никаких придуманных курсов здесь нет.

     Нажатие на карточку открывает актуальную
     страницу курса Измаила на Minfin.
     ========================================================= */

  $("usdRate").textContent =
    "открыть";

  $("eurRate").textContent =
    "открыть";


  /* =========================================================
     ПОИСК
     ========================================================= */

  $("searchHotspot")
    ?.addEventListener(
      "click",
      () => {

        if (tg?.showPopup) {

          tg.showPopup({

            title: "Поиск",

            message:
              "Поиск по справочнику подключим следующим этапом."

          });

        } else {

          alert(
            "Поиск по справочнику подключим следующим этапом."
          );

        }

      }
    );


  /* =========================================================
     ЗАПУСК
     ========================================================= */

  loadWeather();

})();
