(() => {
  "use strict";

  const allShelters = Array.isArray(window.SHELTERS) ? window.SHELTERS : [];
  const contacts = Array.isArray(window.EMERGENCY_CONTACTS) ? window.EMERGENCY_CONTACTS : [];
  let activeFilter = "all";
  let searchText = "";

  const $ = (id) => document.getElementById(id);

  function mapsSearch(query = "укрытия Измаил") {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }

  function mapsRoute(address) {
    const destination = `${address}, Измаил, Одесская область, Украина`;
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destination);
  }

  function goHome() {
    try {
      if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) {
        history.back();
        return;
      }
    } catch (_) {}
    location.href = "../";
  }

  function renderContacts() {
    $("contacts").innerHTML = contacts.map(c => `
      <a class="contact" href="tel:${c.number}" aria-label="Позвонить ${c.number}">
        <strong>${c.number}</strong><span>${c.label}</span>
      </a>
    `).join("");
  }

  function matches(item) {
    const typeOk = activeFilter === "all" || item.type === activeFilter;
    const hay = `${item.name} ${item.address} ${item.type}`.toLowerCase();
    const textOk = !searchText || hay.includes(searchText);
    return typeOk && textOk;
  }

  function render() {
    const filtered = allShelters.filter(matches);
    $("count").textContent = `Найдено: ${filtered.length}`;

    $("list").innerHTML = filtered.map(item => {
      const map = mapsSearch(`${item.address}, Измаил`);
      const route = mapsRoute(item.address);
      return `
        <article class="shelter">
          <div class="shelter-icon">⌂</div>
          <div class="shelter-main">
            <b>${escapeHtml(item.address)}</b>
            <small>${escapeHtml(item.type)}${item.name && item.name !== `Укрытие №${item.id}` ? " · " + escapeHtml(item.name) : ""}</small>
            <span class="distance">📍 Адрес в списке</span>
          </div>
          <div class="actions">
            <a class="action" href="${map}" target="_blank" rel="noopener">🗺 Карта</a>
            <a class="action route" href="${route}" target="_blank" rel="noopener">➤ Маршрут</a>
          </div>
        </article>`;
    }).join("");

    $("empty").hidden = filtered.length !== 0;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[ch]));
  }

  document.querySelectorAll("[data-back]").forEach(btn => btn.addEventListener("click", goHome));

  $("search").addEventListener("input", e => {
    searchText = e.target.value.trim().toLowerCase();
    render();
  });

  $("clearSearch").addEventListener("click", () => {
    $("search").value = "";
    searchText = "";
    $("search").focus();
    render();
  });

  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
      render();
    });
  });

  $("mapBtn").addEventListener("click", () => window.open(mapsSearch(), "_blank", "noopener"));
  $("allMapBtn").addEventListener("click", () => window.open(mapsSearch(), "_blank", "noopener"));

  $("nearbyBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      window.open(mapsSearch("укрытия рядом с Измаилом"), "_blank", "noopener");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => window.open(mapsSearch("укрытия Измаил"), "_blank", "noopener"),
      () => window.open(mapsSearch("укрытия Измаил"), "_blank", "noopener"),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  });

  renderContacts();
  render();
})();
