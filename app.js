
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

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor("#061a33");
      tg.setBackgroundColor("#061a33");
    } catch (_) {}
  }

  function show(title, content) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = content;
    $("modal").classList.remove("hidden");
  }

  function closeModal() {
    $("modal").classList.add("hidden");
  }

  $("close").addEventListener("click", closeModal);

  $("modal").addEventListener("click", (event) => {
    if (event.target === $("modal")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  function openLink(url, title) {
    if (!url) {
      show(
        title || "Раздел справочника",
        "<p>Раздел готов. Ссылка будет добавлена позже.</p>"
      );
      return;
    }

    if (tg && /^https?:\/\/t\.me\//i.test(url)) {
      tg.openTelegramLink(url);
    } else if (tg) {
      tg.openLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function category(key) {
    const item = categories[key];
    if (!item) return;
    openLink(item[1], item[0]);
  }

  function search() {
    show(
      "Поиск по справочнику",
      `
        <input
          class="search-input"
          id="searchInput"
          placeholder="Например: здоровье, транспорт..."
          autocomplete="off"
        >
        <div id="searchResults" class="small">
          Начни вводить запрос.
        </div>
      `
    );

    const input = $("searchInput");
    const results = $("searchResults");

    input.focus();

    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();

      if (!query) {
        results.textContent = "Начни вводить запрос.";
        return;
      }

      const matches = Object.entries(categories).filter(
        ([, item]) => item[0].toLowerCase().includes(query)
      );

      results.innerHTML = "";

      if (!matches.length) {
        results.textContent = "Ничего не найдено.";
        return;
      }

      matches.forEach(([key, item]) => {
        const row = document.createElement("div");
        row.className = "result";

        const name = document.createElement("b");
        name.textContent = item[0];

        const button = document.createElement("button");
        button.className = "search-open";
        button.textContent = "Открыть раздел";
        button.addEventListener("click", () => category(key));

        row.append(name, document.createElement("br"), button);
        results.appendChild(row);
      });
    });
  }

  function favorites() {
    show(
      "Избранное",
      "<p>Избранное пока пустое. Возможность добавления избранных разделов можно подключить позже.</p>"
    );
  }

  function main() {
    openLink(LINKS.MAIN_GROUP, "Главная");
  }

  function shelters() {
    openLink(LINKS.SHELTERS, "Укрытия Измаил");
  }

  function groups() {
    openLink(LINKS.OUR_GROUPS, "Наши группы");
  }

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

    return descriptions[code] || "Погодные условия";
  }

  async function loadWeather() {
    const element = $("liveWeather");

    try {
      const url = new URL(
        "https://api.open-meteo.com/v1/forecast"
      );

      url.search = new URLSearchParams({
        latitude: WEATHER.latitude,
        longitude: WEATHER.longitude,
        current: "temperature_2m,weather_code",
        timezone: WEATHER.timezone
      });

      const response = await fetch(url);

      if (!response.ok) throw new Error("Weather unavailable");

      const data = await response.json();
      const current = data.current;

      element.textContent =
        `${Math.round(current.temperature_2m)}°`;

      element.title = weatherDescription(current.weather_code);

      window.currentWeather = {
        temperature: current.temperature_2m,
        description: weatherDescription(current.weather_code)
      };
    } catch (error) {
      element.textContent = "—°";
      element.title = "Погода временно недоступна";
    }
  }

  async function showWeather() {
    show("Погода в Измаиле", "<p>Загружаем погоду...</p>");

    try {
      const url = new URL(
        "https://api.open-meteo.com/v1/forecast"
      );

      url.search = new URLSearchParams({
        latitude: WEATHER.latitude,
        longitude: WEATHER.longitude,
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        timezone: WEATHER.timezone
      });

      const response = await fetch(url);

      if (!response.ok) throw new Error();

      const data = await response.json();
      const current = data.current;

      $("modalBody").innerHTML = `
        <p><b>${Math.round(current.temperature_2m)}°C</b> — ${weatherDescription(current.weather_code)}</p>
        <p>Влажность: ${current.relative_humidity_2m}%</p>
        <p>Ветер: ${current.wind_speed_10m} км/ч</p>
        <p class="small">Данные обновляются автоматически.</p>
      `;
    } catch (_) {
      $("modalBody").innerHTML =
        '<p class="data-error">Не удалось загрузить погоду. Попробуй позже.</p>';
    }
  }

  async function loadCurrency() {
    try {
      const [usdResponse, eurResponse] = await Promise.all([
        fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=UAH"),
        fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=UAH")
      ]);

      if (!usdResponse.ok || !eurResponse.ok) throw new Error();

      const usdData = await usdResponse.json();
      const eurData = await eurResponse.json();

      const usd = usdData.rates.UAH;
      const eur = eurData.rates.UAH;

      $("liveUsd").textContent = `USD ${usd.toFixed(2)}`;
      $("liveEur").textContent = `EUR ${eur.toFixed(2)}`;

      window.currentCurrency = { usd, eur };
    } catch (_) {
      $("liveUsd").textContent = "USD —";
      $("liveEur").textContent = "EUR —";
    }
  }

  async function showCurrency() {
    show("Курс валют", "<p>Загружаем курсы...</p>");

    try {
      const [usdResponse, eurResponse] = await Promise.all([
        fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=UAH"),
        fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=UAH")
      ]);

      if (!usdResponse.ok || !eurResponse.ok) throw new Error();

      const usdData = await usdResponse.json();
      const eurData = await eurResponse.json();

      $("modalBody").innerHTML = `
        <p><b>1 USD</b> = ${usdData.rates.UAH.toFixed(2)} грн</p>
        <p><b>1 EUR</b> = ${eurData.rates.UAH.toFixed(2)} грн</p>
        <p class="small">Дата курса: ${usdData.date}</p>
        <p class="small">Курс справочный и может отличаться от банковского.</p>
      `;
    } catch (_) {
      $("modalBody").innerHTML =
        '<p class="data-error">Не удалось загрузить курсы валют. Попробуй позже.</p>';
    }
  }

  const actions = {
    main,
    weather: showWeather,
    currency: showCurrency,
    shelters,
    search,
    groups,
    favorites,
    health: () => category("health"),
    transport: () => category("transport"),
    services: () => category("services"),
    food: () => category("food"),
    utilities: () => category("utilities"),
    jobs: () => category("jobs"),
    education: () => category("education"),
    leisure: () => category("leisure")
  };

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = actions[button.dataset.action];
      if (action) action();
    });
  });

  loadWeather();
  loadCurrency();

  setInterval(loadWeather, 30 * 60 * 1000);
  setInterval(loadCurrency, 60 * 60 * 1000);
})();
