(function () {
  "use strict";
  var DATA_URL = new URL("../data/frank-rates.json", document.currentScript.src).href;
  var CACHE_KEY = "izmail_frank_rates_v1";
  var CHECK_KEY = "izmail_frank_rates_checked_v2";
  var REFRESH_MS = 10 * 60 * 1000;
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
    var updated = document.getElementById("ratesUpdated");
    if (updated) {
      var date = new Date(data.fetchedAt);
      var stamp = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", year: "2-digit"
      }).format(date);
      updated.dateTime = date.toISOString();
      updated.querySelector("span").textContent = "на " + stamp;
      updated.title = "Данные на " + stamp;
      panel.setAttribute("aria-label", panel.title + ". " + updated.title);
    }
    last = data;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
  }

  function recentlyChecked() {
    try { return Date.now() - (Number(localStorage.getItem(CHECK_KEY)) || 0) < REFRESH_MS; }
    catch (_) { return false; }
  }

  async function load(force) {
    if (loading || (!force && recentlyChecked())) return;
    loading = true;
    try { localStorage.setItem(CHECK_KEY, String(Date.now())); } catch (_) {}
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var response = await fetch(DATA_URL, {
        cache: "no-cache", credentials: "same-origin", signal: controller.signal
      });
      if (!response.ok) throw new Error("rates-http-" + response.status);
      var data = await response.json();
      if (!valid(data)) throw new Error("rates-invalid");
      render(data);
    } catch (_) {
      if (!last) render(cached);
    } finally {
      clearTimeout(timeout);
      loading = false;
    }
  }

  function schedule() {
    var jitter = Math.round(REFRESH_MS * (.9 + Math.random() * .2));
    setTimeout(function () { if (!document.hidden) load(false); schedule(); }, jitter);
  }

  try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (_) {}
  render(cached);
  load(false);
  schedule();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) load(false); });
  window.addEventListener("focus", function () { load(false); });
  window.addEventListener("online", function () { load(true); });
  window.addEventListener("izmail:refresh", function () { load(true); });
  window.addEventListener("pageshow", function (event) { if (event.persisted) load(false); });
})();
