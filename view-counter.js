/* Shared, low-load counter. Only server-confirmed totals are displayed. */
(function () {
  "use strict";
  var el = document.getElementById("viewCount");
  if (!el) return;

  var API = "https://abacus.jasoncameron.dev";
  var COUNTER = "/vanku0613-cpu.github.io/spravochnik_izmail_main_v2_views_hourly_20260930";
  var TIME_KEY = "izmail_directory_global_view_last_time_hourly_20260930_v1";
  var VALUE_KEY = "izmail_directory_global_view_last_value_v2";
  var READ_KEY = "izmail_directory_global_view_last_read_v2";
  var INTERVAL = 3600000;
  var READ_TTL = 60000;
  var lastValue = -1;
  var reading = false;
  var channel = null;
  el.textContent = "—";

  try { channel = new BroadcastChannel("izmail-view-counter-v1"); } catch (_) {}

  function persist(value) {
    try {
      localStorage.setItem(VALUE_KEY, String(value));
      localStorage.setItem(READ_KEY, String(Date.now()));
    } catch (_) {}
  }

  function show(data, save, announce) {
    var value = data && data.value;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid counter");
    lastValue = Math.max(lastValue, value);
    el.textContent = lastValue.toLocaleString("ru-RU");
    if (save) persist(lastValue);
    if (announce && channel) {
      try { channel.postMessage({ value: lastValue }); } catch (_) {}
    }
  }

  try {
    var storedValue = Number(localStorage.getItem(VALUE_KEY));
    var storedAt = Number(localStorage.getItem(READ_KEY));
    if (Number.isSafeInteger(storedValue) && storedValue >= 0 && Date.now() - storedAt < 10 * 60 * 1000) {
      show({ value: storedValue }, false, false);
    }
  } catch (_) {}

  if (channel) channel.onmessage = function (event) {
    try { show(event.data, true, false); } catch (_) {}
  };

  async function request(action) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await fetch(API + "/" + action + COUNTER, {
        cache: "no-store", mode: "cors", signal: controller.signal
      });
      if (!response.ok) throw new Error("Counter HTTP " + response.status);
      var data = await response.json();
      show(data, true, true);
    } finally {
      clearTimeout(timeout);
    }
  }

  function recentlyRead() {
    try { return Date.now() - (Number(localStorage.getItem(READ_KEY)) || 0) < READ_TTL; }
    catch (_) { return false; }
  }

  async function refresh(force) {
    if (reading || document.visibilityState === "hidden" || (!force && recentlyRead())) return;
    reading = true;
    try { await request("get"); } catch (_) {
      /* Keep the last server-confirmed value. */
    } finally { reading = false; }
  }

  function reserveView() {
    return new Promise(function (resolve, reject) {
      var opening = indexedDB.open("izmail-view-throttle", 1);
      opening.onupgradeneeded = function () { opening.result.createObjectStore("timestamps"); };
      opening.onerror = function () { reject(opening.error); };
      opening.onsuccess = function () {
        var db = opening.result;
        var allowed = false;
        var transaction = db.transaction("timestamps", "readwrite");
        var store = transaction.objectStore("timestamps");
        var readingTime = store.get(TIME_KEY);
        readingTime.onsuccess = function () {
          var now = Date.now();
          var last = Number(readingTime.result) || 0;
          try { last = Math.max(last, Number(localStorage.getItem(TIME_KEY)) || 0); } catch (_) {}
          if (!last || now - last >= INTERVAL) { allowed = true; store.put(now, TIME_KEY); }
        };
        transaction.oncomplete = function () {
          db.close();
          if (allowed) { try { localStorage.setItem(TIME_KEY, String(Date.now())); } catch (_) {} }
          resolve(allowed);
        };
        transaction.onabort = function () { db.close(); reject(transaction.error); };
      };
    });
  }

  reserveView().then(async function (allowed) {
    if (allowed) {
      try { await request("hit"); } catch (_) { await refresh(true); }
    } else {
      await refresh(false);
      setTimeout(function () { refresh(true); }, 300);
    }
  }).catch(function () { refresh(true); });

  function schedule() {
    var delay = 4 * 60 * 1000 + Math.round(Math.random() * 2 * 60 * 1000);
    setTimeout(function () { refresh(false); schedule(); }, delay);
  }
  schedule();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(false); });
  window.addEventListener("online", function () { refresh(true); });
  window.addEventListener("izmail:refresh", function () { refresh(true); });
})();
