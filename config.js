(() => {
  "use strict";

  /*
   * =========================================================
   * ГЛАВНЫЙ СПРАВОЧНИК ИЗМАИЛ
   * Основная логика главного экрана
   * =========================================================
   */

  const tg = window.Telegram?.WebApp;

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#061a33");
      tg.setBackgroundColor("#061a33");
    } catch (e) {
      console.warn("Telegram WebApp:", e);
    }
  }

  /* ---------------------------------------------------------
     Элементы
     --------------------------------------------------------- */

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeButton = document.getElementById("close");

  const liveWeather = document.getElementById("liveWeather");
  const liveUsd = document.getElementById("liveUsd");
  const liveEur = document.getElementById("liveEur");

  /* ---------------------------------------------------------
     Конфигурация
     --------------------------------------------------------- */

  const links = window.LINKS || {};

  const weatherConfig = window.WEATHER || {
    latitude: 45.35,
    longitude: 28.84,
    timezone: "Europe/Kyiv"
  };

  /* ---------------------------------------------------------
     Категории
     --------------------------------------------------------- */

  const categories = {
    health: {
      title: "Здоровье и уход",
      text: "Медицина, аптеки, стоматология, салоны красоты и услуги для здоровья."
    },

    transport: {
      title: "Транспорт и такси",
      text: "Такси, транспорт, перевозки, автосервисы и всё, что связано с передвижением."
    },

    services: {
      title: "Услуги и мастера",
      text: "Мастера, ремонт, строительство, бытовые и профессиональные услуги."
    },

    food: {
      title: "Продукты питания",
      text: "Магазины, продукты, доставка еды, кафе и другие места с едой."
    },

    utilities: {
      title: "Коммунальные службы",
      text: "Коммунальные службы, аварийные телефоны и полезные контакты."
    },

    jobs: {
      title: "Работа и вакансии",
      text: "Вакансии, работа, подработка и полезная информация для соискателей."
    },

    education: {
      title: "Образование и развитие",
      text: "Школы, курсы, репетиторы, обучение и развитие."
    },

    leisure: {
      title: "Отдых, жильё, море",
      text: "Отдых, жильё, туризм, развлечения и места для поездок."
    }
  };

  /* ---------------------------------------------------------
     Открытие модального окна
     --------------------------------------------------------- */

  function openModal(title, content) {
    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = content;

    modal.classList.remove("hidden");

    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.add("hidden");

    document.body.style.overflow = "";
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  /* ---------------------------------------------------------
     Безопасное открытие ссылки
     --------------------------------------------------------- */

  function openLink(url) {
    if (!url) return false;

    try {
      if (tg && typeof tg.openTelegramLink === "function") {
        if (
          url.startsWith("https://t.me/") ||
          url.startsWith("tg://")
        ) {
          tg.openTelegramLink(url);
          return true;
        }
      }

      if (tg && typeof tg.openLink === "function") {
        tg.openLink(url);
        return true;
      }

      window.open(url, "_blank", "
