/* Shared by both entry pages. Only Abacus supplies the displayed total. */
(function () {
  "use strict";
  var el = document.getElementById("viewCount");
  if (!el) return;

  var API = "https://abacus.jasoncameron.dev";
  var COUNTER = "/vanku0613-cpu.github.io/spravochnik_izmail_main_v2_views";
  var TIME_KEY = "izmail_directory_global_view_last_time_v1";
  var INTERVAL = 300000;
  var lastValue = -1;
  var reading = false;
  var stream;
  el.textContent = "—";

  function show(data) {
    var value = data && data.value;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid counter");
    // A late GET must not overwrite a newer streaming update.
    lastValue = Math.max(lastValue, value);
    el.textContent = lastValue.toLocaleString("ru-RU");
  }

  async function request(action) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var response = await fetch(API + "/" + action + COUNTER, {
        cache: "no-store", mode: "cors", signal: controller.signal
      });
      if (!response.ok) throw new Error("Counter HTTP " + response.status);
      show(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }

  async function refresh() {
    if (reading || document.visibilityState === "hidden") return;
    reading = true;
    try { await request("get"); } catch (_) {
      // Keep only the last server-confirmed value in memory, never invent a total.
    } finally { reading = false; }
  }

  function reserveView() {
    // A read/write transaction serializes simultaneous tabs, including browsers
    // without Web Locks. This database stores a timestamp, never the total.
    return new Promise(function (resolve, reject) {
      var opening = indexedDB.open("izmail-view-throttle", 1);
      opening.onupgradeneeded = function () {
        opening.result.createObjectStore("timestamps");
      };
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
          if (!last || now - last >= INTERVAL) {
            allowed = true;
            store.put(now, TIME_KEY);
          }
        };
        transaction.oncomplete = function () {
          db.close();
          if (allowed) {
            try { localStorage.setItem(TIME_KEY, String(Date.now())); } catch (_) {}
          }
          resolve(allowed);
        };
        transaction.onabort = function () { db.close(); reject(transaction.error); };
      };
    });
  }

  function connect() {
    if (stream || !window.EventSource || document.visibilityState === "hidden") return;
    stream = new EventSource(API + "/stream" + COUNTER);
    stream.onmessage = function (event) {
      try { show(JSON.parse(event.data)); } catch (_) {}
    };
    // EventSource reconnects automatically; GET polling also covers stream outages.
    stream.onopen = refresh;
  }

  connect();
  reserveView().then(async function (allowed) {
    if (allowed) {
      try { await request("hit"); } catch (_) {
        // A lost response may already have incremented the server. Retain the
        // timestamp and never retry HIT within five minutes (avoid double counts).
        await refresh();
      }
    } else { await refresh(); }
  }).catch(refresh); // If device storage is unavailable, read without overcounting.

  setInterval(refresh, 10000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      if (stream) stream.close();
      stream = null;
    } else { connect(); refresh(); }
  });
  window.addEventListener("online", refresh);
  window.addEventListener("izmail:refresh", refresh);
})();
