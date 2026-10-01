(function () {
  "use strict";
  var root = document.documentElement;
  var initialWidth = window.innerWidth;

  function lockStage() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    root.style.setProperty("--stable-viewport-height", height + "px");
    root.style.setProperty("--stage-w", Math.min(width, height * 0.488, 600) + "px");
    root.style.setProperty("--stage-h", Math.min(width * 1.783, height * 0.87, 1069.8) + "px");
    initialWidth = width;
  }

  lockStage();
  window.addEventListener("resize", function () {
    var searchIsFocused = document.activeElement &&
      document.activeElement.matches("#directorySearch, .search-real, input[type=search]");
    if (Math.abs(window.innerWidth - initialWidth) > 40 && !searchIsFocused) lockStage();
  }, { passive: true });
  window.addEventListener("orientationchange", function () {
    window.setTimeout(lockStage, 300);
  }, { passive: true });
})();
