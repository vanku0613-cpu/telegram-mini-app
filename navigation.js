(function () {
  "use strict";
  if (window.IZMAIL_NAV_READY) return;
  window.IZMAIL_NAV_READY = true;
  var root = new URL("./", document.currentScript.src);
  var main = new URL("main-v2/", root);
  var PENDING = "izmail_navigation_pending_v5";
  var STATE = "izmailNavigationV5";
  var leaving = false;
  var lastRefresh = 0;
  var prefetched = new Set();

  function path(url) { return url.pathname.replace(/index\.html$/i, "").replace(/\/$/, ""); }
  function inside(url) { return url.origin === root.origin && url.pathname.startsWith(root.pathname); }
  function isHome(url) { return inside(url) && (path(url) === path(root) || path(url) === path(main)); }
  function samePage(a, b) { return a.origin === b.origin && path(a) === path(b) && a.search === b.search; }
  function readState() { return history.state && history.state[STATE]; }
  function saveState(value) {
    try { history.replaceState(Object.assign({}, history.state, { [STATE]: value }), ""); } catch (_) {}
  }
  function initialize() {
    var here = new URL(location.href);
    var pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING) || "null");
      sessionStorage.removeItem(PENDING);
    } catch (_) {}
    if (isHome(here)) {
      saveState({ home: here.href, depth: 0 });
    } else if (!readState() && pending && document.referrer) {
      // Only a verified transition from the immediately preceding document
      // may use history.go. A stale global marker must never leave the app.
      var ref = new URL(document.referrer);
      if (samePage(new URL(pending.from), ref) && samePage(new URL(pending.to), here)) {
        saveState({ home: pending.home, depth: pending.depth });
      }
    }
  }
  initialize();

  function softRefresh() {
    // Repeated taps neither reload the document nor start overlapping refreshes.
    if (Date.now() - lastRefresh < 1000) return;
    lastRefresh = Date.now();
    window.dispatchEvent(new CustomEvent("izmail:refresh", { detail: { source: "home" } }));
  }
  function beginNavigation() {
    if (leaving) return false;
    leaving = true;
    // Release if the browser cancels a navigation (offline, external handler).
    setTimeout(function () { leaving = false; }, 2000);
    return true;
  }
  function returnHome() {
    if (isHome(new URL(location.href))) { softRefresh(); return; }
    if (!beginNavigation()) return;
    var state = readState();
    if (state && state.depth > 0 && history.length > state.depth && isHome(new URL(state.home))) {
      history.go(-state.depth);
    } else {
      location.assign(main.href);
    }
  }
  function navigate(url) {
    var here = new URL(location.href);
    if (isHome(url)) { returnHome(); return; }
    if (samePage(url, here) && !url.hash) return;
    if (!beginNavigation()) return;
    var state = readState();
    if (inside(url) && state) {
      try {
        sessionStorage.setItem(PENDING, JSON.stringify({
          from: here.href, to: url.href, home: state.home, depth: state.depth + 1
        }));
      } catch (_) {}
    }
    location.assign(url.href);
  }
  function elementFor(event) {
    return event.target.closest && event.target.closest("a,button,[role='button'],[role='link'],[data-nav],[data-main-back],[data-action]");
  }
  function homeButton(el) {
    return el.hasAttribute("data-main-back") || /^(home|homebtn|homebutton)$/i.test(el.id) ||
      /^(home|homepage)$/i.test(el.getAttribute("data-action") || "") || el.getAttribute("data-nav") === "home";
  }
  function targetUrl(el) {
    var raw = el.getAttribute("data-nav") || el.getAttribute("href");
    if (!raw || raw === "home" || raw.startsWith("#")) return null;
    try {
      var url = new URL(raw, location.href);
      return /^(https?:)$/.test(url.protocol) ? url : null;
    } catch (_) { return null; }
  }
  function stop(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function runWithMainMenuGlow(el, action) {
    // Inner menus redraw in place, while the main menu opens another document.
    // Let its tap-lit outline paint once before that document transition.
    if (!(el.classList.contains("pressable") && el.closest && el.closest("#app"))) {
      action();
      return;
    }
    if (el.dataset.izmailGlowPending === "1") return;
    el.dataset.izmailGlowPending = "1";
    setTimeout(function () {
      delete el.dataset.izmailGlowPending;
      action();
    }, 120);
  }
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var el = elementFor(event);
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
    if (el.hasAttribute("download") || (el.target && el.target !== "_self")) return;
    if (homeButton(el)) { stop(event); runWithMainMenuGlow(el, returnHome); return; }
    var url = targetUrl(el);
    if (!url) return;
    // Native external anchors retain new-tab, Telegram and browser behavior.
    if (!inside(url) && el.tagName === "A") return;
    if (url.hash && samePage(url, new URL(location.href))) return;
    stop(event);
    runWithMainMenuGlow(el, function () { navigate(url); });
  }, true);

  // Declarative future buttons receive keyboard activation as well as taps.
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var el = elementFor(event);
    if (!el || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.isContentEditable) return;
    if (!el.hasAttribute("data-nav") && !homeButton(el)) return;
    event.preventDefault();
    if (!event.repeat) el.click();
  });
  function prefetch(event) {
    var el = elementFor(event);
    if (!el || el.disabled || el.hasAttribute("download")) return;
    var url = targetUrl(el);
    if (!url || !inside(url) || isHome(url) || prefetched.has(url.href) || url.hash) return;
    if (navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType))) return;
    prefetched.add(url.href);
    var link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url.href;
    document.head.appendChild(link);
  }
  document.addEventListener("pointerover", prefetch, { passive: true });
  document.addEventListener("pointerdown", prefetch, { passive: true });
  document.addEventListener("focusin", prefetch);
  window.addEventListener("pageshow", function () { leaving = false; });

  var style = document.createElement("style");
  style.textContent = "a,button,[role=button],[role=link],[data-nav]{touch-action:manipulation}";
  document.head.appendChild(style);
})();
