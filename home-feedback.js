(function () {
  "use strict";
  var selector = "#app .pressable, #weatherPanel, #currencyPanel, #app .search-wrap";
  var timers = new WeakMap();
  function light(event) {
    if (event.type === "pointerdown" && event.button !== 0) return;
    if (event.type === "keydown" && (event.repeat || !["Enter", " "].includes(event.key))) return;
    var target = event.target.closest && event.target.closest(selector);
    if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;
    clearTimeout(timers.get(target));
    target.classList.add("tap-lit");
    timers.set(target, setTimeout(function () { target.classList.remove("tap-lit"); }, 680));
  }
  // Capture before navigation handlers; never delay or cancel the user's action.
  window.addEventListener("pointerdown", light, { capture: true, passive: true });
  window.addEventListener("click", light, true);
  window.addEventListener("keydown", light, true);
  window.addEventListener("pageshow", function () {
    document.querySelectorAll(".tap-lit").forEach(function (el) {
      clearTimeout(timers.get(el));
      el.classList.remove("tap-lit");
    });
  });
})();
