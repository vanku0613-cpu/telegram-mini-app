(function () {
  "use strict";
  // Resolve from this script, so root and main-v2 use the same JSON.
  var DATA_URL = new URL("../data/frank-rates.json", document.currentScript.src).href;
  var CACHE_KEY = "izmail_frank_rates_v1";
  var REFRESH_MS = 5 * 60 * 1000;
  var loading = false;
  var last = null;
  var cached = null;

  function valid(data) {
    return data && data.sourceUrl === "https://t.me/frankexange" &&
      [data.usd, data.eur].every(function (rate) {
        return rate && typeof rate.buy === "number" && typeof rate.sell === "number" &&
          Number.isFinite(rate.buy) && Number.isFinite(rate.sell) &&
          rate.buy >= 10 && rate.sell <= 200 && rate.buy <= rate.sell;
      }) && Number.isFinite(Date.parse(data.fetchedAt));
  }

  function render(data) {
    if (!valid(data)) return;
    if (last && Date.parse(data.fetchedAt) < Date.parse(last.fetchedAt)) return;
    var usd = document.getElementById("usdRate");
    var eur = document.getElementById("eurRate");
    if (!usd || !eur) return;
    usd.textContent = data.usd.buy.toFixed(2) + " / " + data.usd.sell.toFixed(2);
    eur.textContent = data.eur.buy.toFixed(2) + " / " + data.eur.sell.toFixed(2);
    var panel = document.getElementById("currencyPanel");
    panel.title = "Frank Exchange · покупка / продажа" + (data.date ? " · " + data.date : "");
    panel.setAttribute("aria-label", panel.title);
    last = data;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  async function load() {
    if (loading) return;
    loading = true;
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(DATA_URL + "?v=" + Date.now(), {
        cache: "no-store", credentials: "same-origin", signal: controller.signal
      });
      if (!response.ok) throw new Error("rates-http-" + response.status);
      var data = await response.json();
      if (!valid(data)) throw new Error("rates-invalid");
      render(data);
    } catch (_) {
      // Keep the last validated rates; never replace them with NBU or zeros.
      if (!last) render(cached);
    } finally {
      clearTimeout(timeout);
      loading = false;
    }
  }

  // Prefer a fresh response on opening; use stored rates only if it fails.
  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (_) {}
  if (!navigator.onLine) render(cached);
  load();
  setInterval(function () { if (!document.hidden) load(); }, REFRESH_MS);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) load(); });
  window.addEventListener("focus", load);
  window.addEventListener("online", load);
  window.addEventListener("izmail:refresh", load);
  window.addEventListener("pageshow", function (event) { if (event.persisted) load(); });
})();
