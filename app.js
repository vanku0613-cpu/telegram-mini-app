(() => {
  "use strict";

  const tg = window.Telegram?.WebApp;

  if (tg) {
    tg.ready();
    tg.expand();

    try {
      tg.setHeaderColor("#061a33");
      tg.setBackgroundColor("#061a33");
    } catch (e) {}
  }

  const $ = (id) => document.getElementById(id);

  /* =========================================================
     НАСТРОЙКИ
     ========================================================= */

  const LINKS_SAFE =
    window.LINKS ||
    (typeof LINKS !== "undefined" ? LINKS : {});

  const WEATHER_SAFE =
    window.WEATHER ||
    (typeof WEATHER !== "undefined"
      ? WEATHER
      : {
          latitude: 45.35,
          longitude: 28.84,
          timezone: "Europe/Kyiv"
        });

  /* =========================================================
     МОДАЛЬНОЕ ОКНО
     ========================================================= */

  function show(title, body) {
    const modal = $("modal");
    const modalTitle = $("modalTitle");
    const modalBody = $("modalBody");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title || "Главный справочник Измаил";
    modalBody.innerHTML = body || "";

    modal.classList.remove("hidden");
  }

  function closeModal() {
    const modal = $("modal");
    if (modal) modal.classList.add("hidden");
  }

  const closeButton = $("close");

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  const modal = $("modal");

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  /* =========================================================
     ОТКРЫТИЕ ССЫЛОК
     ========================================================= */

  function openLink(url, message) {
    if (!url) {
      show(
        "Раздел готов",
        `<p>${message || "Ссылка на этот раздел пока не подключена."}</p>`
      );
      return;
    }

    try {
      if (
        tg?.openTelegramLink &&
        /^https?:\/\/t\.me\//i.test(url)
      ) {
        tg.openTelegramLink(url);
        return;
      }

      if (tg?.openLink) {
        tg.openLink(url);
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      window.location.href = url;
    }
  }

  /* =========================================================
     КАТЕГОРИИ
     ========================================================= */

  const names = {
    health: [
      "Здоровье и уход",
      LINKS_SAFE.HEALTH
    ],

    transport: [
      "Транспорт и такси",
      LINKS_SAFE.TRANSPORT
    ],

    services: [
      "Услуги и мастера",
      LINKS_SAFE.SERVICES
    ],

    food: [
      "Продукты питания",
      LINKS_SAFE.FOOD
    ],

    utilities: [
      "Коммунальные службы",
      LINKS_SAFE.UTILITIES
    ],

    jobs: [
      "Работа и вакансии",
      LINKS_SAFE.JOBS
    ],

    education: [
      "Образование и развитие",
      LINKS_SAFE.EDUCATION
    ],

    leisure: [
      "Отдых, жильё, море",
      LINKS_SAFE.LEISURE
    ]
  };

  function category(key) {
    const item = names[key];

    if (!item) return;

    const title = item[0];
    const url = item[1];

    openLink(
      url,
      `Раздел «${title}» готов к работе. Ссылка на него пока не подключена.`
    );
  }

  /* =========================================================
     ПОИСК
     ========================================================= */

  function search() {
    show(
      "Поиск по справочнику",
      `
        <input
          class="search-input"
          id="q"
          placeholder="Например: такси, аптека, ремонт..."
          autocomplete="off"
        >

        <div
          id="results"
          class="small"
        >
          Начни вводить запрос.
        </div>
      `
    );

    const input = $("q");

    if (!input) return;

    setTimeout(() => {
      input.focus();
    }, 50);

    input.addEventListener("input", () => {
      const value = input.value.trim().toLowerCase();
      const results = $("results");

      if (!results) return;

      if (!value) {
        results.innerHTML = "Начни вводить запрос.";
        return;
      }

      const found = Object.entries(names)
        .filter(([key, item]) => {
          return item[0].toLowerCase().includes(value);
        })
        .map(([key, item]) => {
          return `
            <div class="result">
              <b>${escapeHtml(item[0])}</b>

              <br>

              <span class="small">
                Раздел справочника
              </span>

              <br>

              <button
                type="button"
                class="search-open"
                data-category="${escapeHtml(key)}"
              >
                Открыть раздел
              </button>
            </div>
          `;
        })
        .join("");

      results.innerHTML =
        found ||
        "Ничего не найдено. Попробуй другой запрос.";

      results
        .querySelectorAll(".search-open")
        .forEach((button) => {
          button.addEventListener("click", () => {
            category(button.dataset.category);
          });
        });
    });
  }

  /* =========================================================
     ИЗБРАННОЕ
     ========================================================= */

  function favorites() {
    let list = [];

    try {
      list = JSON.parse(
        localStorage.getItem("izmail_favorites") || "[]"
      );
    } catch (e) {
      list = [];
    }

    if (!list.length) {
      show(
        "Избранное",
        "<p>Избранное пока пустое.</p>"
      );
      return;
    }

    const html = list
      .map((item) => {
        return `
          <div class="result">
            <b>${escapeHtml(item.title || "")}</b>
            <br>
            ${escapeHtml(item.value || "")}
          </div>
        `;
      })
      .join("");

    show("Избранное", html);
  }

  /* =========================================================
     ПОГОДА
     ========================================================= */

  async function weather() {
    const weatherElement = $("liveWeather");

    if (!weatherElement) return;

   
