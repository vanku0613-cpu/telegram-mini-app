(() => {
  "use strict";

  const tg = window.Telegram?.WebApp;
  if (tg) {
    try { tg.ready(); tg.expand(); tg.setHeaderColor?.("#061b35"); tg.setBackgroundColor?.("#061b35"); } catch (e) {}
  }

  const links = window.LINKS || {};
  const weatherConfig = window.WEATHER || {};
  const $ = (id) => document.getElementById(id);

  function setLink(id, url) {
    const el = $(id);
    if (!el) return;
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    } else {
      el.href = "#";
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }
    el.addEventListener("click", (event) => {
      if (!url) event.preventDefault();
      try { tg?.HapticFeedback?.impactOccurred?.("light"); } catch (e) {}
    });
  }

  setLink("mainGroup", links.MAIN_GROUP);
  setLink("shelterLink", links.SHELTERS);
  setLink("groupsLink", links.OUR_GROUPS);
  setLink("healthLink", links.HEALTH);
  setLink("transportLink", links.TRANSPORT);
  setLink("servicesLink", links.SERVICES);
  setLink("foodLink", links.FOOD);
  setLink("utilitiesLink", links.UTILITIES);
  setLink("jobsLink", links.JOBS);
  setLink("educationLink", links.EDUCATION);
  setLink("leisureLink", links.LEISURE);

  const homeLink = $("homeLink");
  if (homeLink) {
    homeLink.href = "#";
    homeLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      try { tg?.HapticFeedback?.impactOccurred?.("light"); } catch (e) {}
    });
  }

  const adsLink = $("adsLink");
  if (adsLink) {
    adsLink.href = links.MAIN_GROUP || "#";
    if (links.MAIN_GROUP) {
      adsLink.target = "_blank";
      adsLink.rel = "noopener noreferrer";
    } else {
      adsLink.addEventListener("click", (event) => event.preventDefault());
    }
  }

  const favoritesLink = $("favoritesLink");
  if (favoritesLink) {
    favoritesLink.href = "#";
    favoritesLink.addEventListener("click", (event) => {
      event.preventDefault();
      try { tg?.HapticFeedback?.impactOccurred?.("light"); } catch (e) {}
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem("izmail_directory_favorites") || "[]"); } catch (e) {}
      alert(saved.length ? "В избранном: " + saved.join(", ") : "Избранное пока пусто.");
    });
  }

  const searchHotspot = $("searchHotspot");
  const searchInput = $("directorySearchInput");
  if (searchHotspot && searchInput) {
    const updateSearchState = () => {
      searchHotspot.classList.toggle("search-focused", document.activeElement === searchInput || searchInput.value.trim().length > 0);
    };
    searchInput.addEventListener("focus", updateSearchState);
    searchInput.addEventListener("blur", updateSearchState);
    searchInput.addEventListener("input", updateSearchState);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performSearch(searchInput.value);
      }
    });
    searchHotspot.addEventListener("click", (event) => {
      if (event.target !== searchInput) {
        event.preventDefault();
        searchInput.focus();
      }
    });
    updateSearchState();
  }

  function performSearch(value) {
    const query = String(value || "").trim().toLowerCase();
    if (!query) return;
    const items = [
      ["healthLink", "Здоровье и уход", "медицина аптеки красота"],
      ["transportLink", "Транспорт / Такси", "такси автобусы перевозки транспорт"],
      ["servicesLink", "Услуги и мастера", "ремонт строительство специалисты услуги мастера"],
      ["foodLink", "Продукты питания", "магазины рынки доставка продукты питание"],
      ["utilitiesLink", "Коммунальные службы", "свет вода газ тепло коммунальные"],
      ["jobsLink", "Работа / Вакансии", "работа вакансии резюме"],
      ["educationLink", "Образование и развитие", "школы курсы репетиторы образование"],
      ["leisureLink", "Отдых • Жильё • Море", "отдых жилье море базы рестораны кафе"]
    ];
    const found = items.find((item) => (item[1] + " " + item[2]).toLowerCase().includes(query));
    if (found) {
      $(found[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
      try { tg?.HapticFeedback?.impactOccurred?.("light"); } catch (e) {}
    } else {
      alert("По вашему запросу ничего не найдено.");
    }
  }

  async function loadWeather() {
    const tempEl = $("weatherTemp");
    const textEl = $("weatherText");
    if (!tempEl || !textEl) return;
    const latitude = Number(weatherConfig.latitude);
    const longitude = Number(weatherConfig.longitude);
    const timezone = weatherConfig.timezone || "Europe/Kyiv";
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    try {
      const url = "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${encodeURIComponent(latitude)}` +
        `&longitude=${encodeURIComponent(longitude)}` +
        "&current=temperature_2m,weather_code" +
        `&timezone=${encodeURIComponent(timezone)}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Weather request failed");
      const data = await response.json();
      const temperature = data?.current?.temperature_2m;
      const code = data?.current?.weather_code;
      tempEl.textContent = typeof temperature === "number" ? `${Math.round(temperature)}°C` : "—°C";
      textEl.textContent = weatherDescription(code);
    } catch (error) {
      tempEl.textContent = "—°C";
      textEl.textContent = "Нет данных";
    }
  }

  function weatherDescription(code) {
    const map = {
      0:"Ясно",1:"Преимущественно ясно",2:"Переменная облачность",3:"Облачно",45:"Туман",48:"Туман",
      51:"Морось",53:"Морось",55:"Морось",56:"Ледяная морось",57:"Ледяная морось",61:"Небольшой дождь",
      63:"Дождь",65:"Сильный дождь",66:"Ледяной дождь",67:"Ледяной дождь",71:"Небольшой снег",73:"Снег",
      75:"Сильный снег",77:"Снежные зёрна",80:"Ливень",81:"Ливень",82:"Сильный ливень",85:"Снегопад",
      86:"Сильный снегопад",95:"Гроза",96:"Гроза с градом",99:"Гроза с градом"
    };
    return map[code] || "Погода";
  }

  async function loadCurrency() {
    const usdEl = $("usdRate");
    const eurEl = $("eurRate");
    if (!usdEl || !eurEl) return;
    try {
      const response = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json", { cache: "no-store" });
      if (!response.ok) throw new Error("Currency request failed");
      const data = await response.json();
      const usd = data.find((item) => item.cc === "USD");
      const eur = data.find((item) => item.cc === "EUR");
      usdEl.textContent = usd ? formatRate(usd.rate) : "—";
      eurEl.textContent = eur ? formatRate(eur.rate) : "—";
    } catch (error) {
      usdEl.textContent = "—";
      eurEl.textContent = "—";
    }
  }

  function formatRate(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "—";
  }

  ["healthLink","transportLink","servicesLink","foodLink","utilitiesLink","jobsLink","educationLink","leisureLink"].forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("click", () => {
      const title = element.getAttribute("aria-label") || id;
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem("izmail_directory_recent") || "[]"); } catch (e) {}
      saved = saved.filter((item) => item !== title);
      saved.unshift(title);
      try { localStorage.setItem("izmail_directory_recent", JSON.stringify(saved.slice(0, 20))); } catch (e) {}
    });
  });

  loadWeather();
  loadCurrency();
})();
