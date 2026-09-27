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
  // ПЛАВНЫЙ ПЕРЕХОД
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

    if (!url) {
      el.href = "#";
      el.removeAttribute("target");
      el.removeAttribute("rel");

      el.addEventListener("click", (event) => {
        event.preventDefault();
      });

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

      el.addEventListener("click", (event) => {
        event.preventDefault();
        fastNavigate(url);
      });

      return;
    }

    // Обычные Telegram-ссылки
    el.target = "_blank";
    el.rel = "noopener noreferrer";

    el.addEventListener("click", () => {
      try {
        tg?.HapticFeedback?.impactOccurred?.("light");
      } catch (e) {}
    });
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
  // ОСТАЛЬНЫЕ РАЗДЕЛЫ
  // =========================================================

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
    const HOME_URL =
      "https://vanku0613-cpu.github.io/telegram-mini-app/";

    homeLink.href = HOME_URL;
    homeLink.removeAttribute("target");
    homeLink.removeAttribute("rel");

    homeLink.addEventListener("click", (event) => {
      event.preventDefault();

      try {
        tg?.HapticFeedback?.impactOccurred?.("light");
      } catch (e) {}

      window.location.assign(
        HOME_URL + "?reload=" + Date.now()
      );
    });
  }

  // =========================================================
  // ЗАКАЗАТЬ РЕКЛАМУ
  // =========================================================

  const adsLink = $("adsLink");

  if (adsLink) {
    const ADS_URL =
      links.MAIN_GROUP ||
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
          ) || "[]"
        );
      } catch (e) {}

      alert(
        saved.length
          ? "В избранном: " + saved.join(", ")
          : "Избранное пока пусто."
      );
    });
  }

  // =========================================================
  // ПОИСК
  // =========================================================

  const searchHotspot =
    $("searchHotspot");

  const searchInput =
    $("directorySearchInput");

  if (searchHotspot && searchInput) {

    const updateSearchState = () => {
      searchHotspot.classList.toggle(
        "search-focused",
        document.activeElement === searchInput ||
        searchInput.value.trim().length > 0
      );
    };

    searchInput.addEventListener(
      "focus",
      updateSearchState
    );

    searchInput.addEventListener(
      "blur",
      updateSearchState
    );

    searchInput.addEventListener(
      "input",
      updateSearchState
    );

    searchInput.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          performSearch(searchInput.value);
        }
      }
    );

    searchHotspot.addEventListener(
      "click",
      (event) => {
        if (event.target !== searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }
    );

    updateSearchState();
  }

  function performSearch(value) {
    const query =
      String(value || "")
        .trim()
        .toLowerCase();

    if (!query) return;

    const items = [
      [
        "healthLink",
        "Здоровье и уход",
        "медицина аптеки красота"
      ],
      [
        "transportLink",
        "Транспорт / Такси",
        "такси автобусы перевозки транспорт"
      ],
      [
        "servicesLink",
        "Услуги и мастера",
        "ремонт строительство специалисты услуги мастера"
      ],
      [
        "foodLink",
        "Продукты питания",
        "магазины рынки доставка продукты питание"
      ],
      [
        "utilitiesLink",
        "Коммунальные службы",
        "свет вода газ тепло коммунальные"
      ],
      [
        "jobsLink",
        "Работа / Вакансии",
        "работа вакансии резюме"
      ],
      [
        "educationLink",
        "Образование и развитие",
        "школы курсы репетиторы образование"
      ],
      [
        "leisureLink",
        "Отдых • Жильё • Море",
        "отдых жилье море базы рестораны кафе"
      ]
    ];

    const found = items.find((item) =>
      (
        item[1] +
        " " +
        item[2]
      )
        .toLowerCase()
        .includes(query)
    );

    if (found) {
      $(found[0])?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      try {
        tg?.HapticFeedback?.impactOccurred?.("light");
      } catch (e) {}

    } else {
      alert(
        "По вашему запросу ничего не найдено."
      );
    }
  }

  // =========================================================
  // ПОГОДА
  // =========================================================

  async function loadWeather() {
    const tempEl =
      $("weatherTemp");

    const textEl =
      $("weatherText");

    if (!tempEl || !textEl) {
      return;
    }

    const latitude =
      Number(weatherConfig.latitude);

    const longitude =
      Number(weatherConfig.longitude);

    const timezone =
      weatherConfig.timezone ||
      "Europe/Kyiv";

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      tempEl.textContent = "—°C";
      textEl.textContent = "Нет данных";
      return;
    }

    try {
      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        "&current=temperature_2m,weather_code" +
        `&timezone=${encodeURIComponent(timezone)}` +
        "&temperature_unit=celsius";

      const response =
        await fetch(
          url,
          {
            method: "GET",
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Weather request failed: " +
          response.status
        );
      }

      const data =
        await response.json();

      const temperature =
        data?.current?.temperature_2m;

      const code =
        data?.current?.weather_code;

      if (
        typeof temperature === "number"
      ) {
        tempEl.textContent =
          `${Math.round(temperature)}°C`;
      } else {
        tempEl.textContent = "—°C";
      }

      textEl.textContent =
        weatherDescription(code);

    } catch (error) {
      console.error(
        "Weather error:",
        error
      );

      tempEl.textContent = "—°C";
      textEl.textContent = "Нет данных";
    }
  }

  function weatherDescription(code) {
    const map = {
      0: "Ясно",
      1: "Преимущественно ясно",
      2: "Переменная облачность",
      3: "Облачно",
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

    return map[code] || "Погода";
  }

  // =========================================================
  // КУРС ВАЛЮТ НБУ
  // =========================================================

  async function loadCurrency() {
    const usdEl =
      $("usdRate");

    const eurEl =
      $("eurRate");

    if (!usdEl || !eurEl) {
      return;
    }

    try {
      const response =
        await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangeNew?json",
          {
            method: "GET",
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          "Currency request failed: " +
          response.status
        );
      }

      const data =
        await response.json();

      const usd =
        data.find(
          (item) =>
            String(item.cc).toUpperCase() ===
            "USD"
        );

      const eur =
        data.find(
          (item) =>
            String(item.cc).toUpperCase() ===
            "EUR"
        );

      usdEl.textContent =
        usd
          ? formatRate(usd.rate)
          : "—";

      eurEl.textContent =
        eur
          ? formatRate(eur.rate)
          : "—";

    } catch (error) {
      console.error(
        "Currency error:",
        error
      );

      usdEl.textContent = "—";
      eurEl.textContent = "—";
    }
  }

  function formatRate(value) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number.toFixed(2)
      : "—";
  }

  // =========================================================
  // ПОСЛЕДНИЕ РАЗДЕЛЫ
  // =========================================================

  [
    "healthLink",
    "transportLink",
    "servicesLink",
    "foodLink",
    "utilitiesLink",
    "jobsLink",
    "educationLink",
    "leisureLink"
  ].forEach((id) => {

    const element = $(id);

    if (!element) return;

    element.addEventListener(
      "click",
      () => {

        const title =
          element.getAttribute(
            "aria-label"
          ) || id;

        let saved = [];

        try {
          saved = JSON.parse(
            localStorage.getItem(
              "izmail_directory_recent"
            ) || "[]"
          );
        } catch (e) {}

        saved =
          saved.filter(
            (item) =>
              item !== title
          );

        saved.unshift(title);

        try {
          localStorage.setItem(
            "izmail_directory_recent",
            JSON.stringify(
              saved.slice(0, 20)
            )
          );
        } catch (e) {}
      }
    );
  });

  // =========================================================
  // ЗАПУСК
  // =========================================================

  loadWeather();
  loadCurrency();

})();
