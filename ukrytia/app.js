(() => {
  "use strict";

  const allShelters = Array.isArray(window.SHELTERS)
    ? window.SHELTERS
    : [];

  const contacts = Array.isArray(window.EMERGENCY_CONTACTS)
    ? window.EMERGENCY_CONTACTS
    : [];

  let activeFilter = "all";
  let searchText = "";

  const $ = (id) => document.getElementById(id);


  // =========================================================
  // GOOGLE MAPS
  // =========================================================

  function mapsSearch(query = "укрытия Измаил") {
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(query)
    );
  }

  function mapsRoute(address) {
    const destination =
      `${address}, Измаил, Одесская область, Украина`;

    return (
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(destination)
    );
  }


  // =========================================================
  // ВОЗВРАТ В ГЛАВНОЕ МЕНЮ
  // =========================================================

  function goHome() {
    try {
      if (
        history.length > 1 &&
        document.referrer &&
        new URL(document.referrer).origin === location.origin
      ) {
        history.back();
        return;
      }
    } catch (_) {}

    location.href = "../";
  }


  // =========================================================
  // НОРМАЛИЗАЦИЯ ТЕКСТА
  // =========================================================

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^а-яa-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }


  // =========================================================
  // ПОНИМАНИЕ СОКРАЩЕНИЙ
  //
  // пр. мира
  // пр мира
  // просп. мира
  // просп мира
  // проспект мира
  //
  // ул. михайловская
  // ул михайловская
  // улица михайловская
  // =========================================================

  function expandSearch(value) {
    return normalizeText(value)
      .replace(/\bпр\b/g, "проспект")
      .replace(/\bпросп\b/g, "проспект")
      .replace(/\bул\b/g, "улица")
      .replace(/\bсв\b/g, "святая")
      .replace(/\bсвят\b/g, "святая");
  }


  // =========================================================
  // ПОИСК
  // =========================================================

  function matches(item) {

    const typeOk =
      activeFilter === "all" ||
      normalizeText(item.type) === normalizeText(activeFilter);

    if (!typeOk) {
      return false;
    }

    if (!searchText) {
      return true;
    }

    const haystack = expandSearch(
      `${item.name} ${item.address} ${item.type}`
    );

    const words = searchText
      .split(" ")
      .filter(Boolean);

    return words.every(word =>
      haystack.includes(word)
    );
  }


  // =========================================================
  // КОНТАКТЫ
  // =========================================================

  function renderContacts() {

    const contactsBox = $("contacts");

    if (!contactsBox) {
      return;
    }

    contactsBox.innerHTML = contacts
      .map(c => `
        <a
          class="contact"
          href="tel:${c.number}"
          aria-label="Позвонить ${c.number}"
        >
          <strong>${escapeHtml(c.number)}</strong>
          <span>${escapeHtml(c.label)}</span>
        </a>
      `)
      .join("");
  }


  // =========================================================
  // ОТОБРАЖЕНИЕ СПИСКА
  // =========================================================

  function render() {

    const list = $("list");
    const count = $("count");
    const empty = $("empty");

    if (!list) {
      return;
    }

    const filtered = allShelters.filter(matches);


    // Количество найденных
    if (count) {
      count.textContent =
        `Найдено: ${filtered.length}`;
    }


    // Список
    list.innerHTML = filtered
      .map(item => {

        const map =
          mapsSearch(`${item.address}, Измаил`);

        const route =
          mapsRoute(item.address);

        return `
          <article class="shelter">

            <div class="shelter-icon">
              ⌂
            </div>

            <div class="shelter-main">

              <b>
                ${escapeHtml(item.address)}
              </b>

              <small>
                ${escapeHtml(item.type)}

                ${
                  item.name &&
                  item.name !== `Укрытие №${item.id}`
                    ? " · " + escapeHtml(item.name)
                    : ""
                }
              </small>

              <span class="distance">
                📍 Адрес в списке
              </span>

            </div>

            <div class="actions">

              <a
                class="action"
                href="${map}"
                target="_blank"
                rel="noopener"
              >
                🗺 Карта
              </a>

              <a
                class="action route"
                href="${route}"
                target="_blank"
                rel="noopener"
              >
                ➤ Маршрут
              </a>

            </div>

          </article>
        `;
      })
      .join("");


    // Если ничего не найдено
    if (empty) {
      empty.hidden =
        filtered.length !== 0;
    }
  }


  // =========================================================
  // ЗАЩИТА HTML
  // =========================================================

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/[&<>"']/g, ch => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[ch]));
  }


  // =========================================================
  // КНОПКИ "НАЗАД"
  // =========================================================

  document
    .querySelectorAll("[data-back]")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        goHome
      );

    });


  // =========================================================
  // ПОИСК
  // =========================================================

  const search = $("search");

  if (search) {

    search.addEventListener(
      "input",
      e => {

        searchText =
          expandSearch(e.target.value);

        render();

      }
    );
  }


  // =========================================================
  // ОЧИСТИТЬ ПОИСК
  // =========================================================

  const clearSearch =
    $("clearSearch");

  if (clearSearch) {

    clearSearch.addEventListener(
      "click",
      () => {

        if (search) {

          search.value = "";
          search.focus();

        }

        searchText = "";

        render();

      }
    );
  }


  // =========================================================
  // ФИЛЬТРЫ
  // =========================================================

  document
    .querySelectorAll(".filter")
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          activeFilter =
            btn.dataset.filter || "all";


          document
            .querySelectorAll(".filter")
            .forEach(b => {

              b.classList.toggle(
                "active",
                b === btn
              );

            });


          render();

        }
      );

    });


  // =========================================================
  // ОТКРЫТЬ КАРТУ
  // =========================================================

  const mapBtn =
    $("mapBtn");

  if (mapBtn) {

    mapBtn.addEventListener(
      "click",
      () => {

        window.open(
          mapsSearch(),
          "_blank",
          "noopener"
        );

      }
    );
  }


  // =========================================================
  // КАРТА ВСЕХ УКРЫТИЙ
  // =========================================================

  const allMapBtn =
    $("allMapBtn");

  if (allMapBtn) {

    allMapBtn.addEventListener(
      "click",
      () => {

        window.open(
          mapsSearch(),
          "_blank",
          "noopener"
        );

      }
    );
  }


  // =========================================================
  // НАЙТИ РЯДОМ
  // =========================================================

  const nearbyBtn =
    $("nearbyBtn");

  if (nearbyBtn) {

    nearbyBtn.addEventListener(
      "click",
      () => {

        if (!navigator.geolocation) {

          window.open(
            mapsSearch(
              "укрытия рядом с Измаилом"
            ),
            "_blank",
            "noopener"
          );

          return;
        }


        navigator.geolocation.getCurrentPosition(

          () => {

            window.open(
              mapsSearch(
                "укрытия Измаил"
              ),
              "_blank",
              "noopener"
            );

          },

          () => {

            window.open(
              mapsSearch(
                "укрытия Измаил"
              ),
              "_blank",
              "noopener"
            );

          },

          {
            enableHighAccuracy: true,
            timeout: 7000
          }

        );
      }
    );
  }


  // =========================================================
  // ЗАПУСК
  // =========================================================

  renderContacts();
  render();

})();
