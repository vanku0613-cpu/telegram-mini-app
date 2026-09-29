(() => {
  "use strict";

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const mapBtn = document.getElementById("mapBtn");
  const nearbyBtn = document.getElementById("nearbyBtn");

  function mapsSearch(query) {
    return "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(query || "укрытия Измаил");
  }

  function openMaps(query) {
    window.open(mapsSearch(query), "_blank", "noopener");
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = (searchInput?.value || "").trim();
      openMaps(q ? `${q}, Измаил, укрытие` : "укрытия Измаил");
    });
  }

  if (mapBtn) {
    mapBtn.addEventListener("click", () => {
      openMaps("укрытия Измаил");
    });
  }

  if (nearbyBtn) {
    nearbyBtn.addEventListener("click", () => {
      openMaps("укрытия рядом с Измаилом");
    });
  }
})();
