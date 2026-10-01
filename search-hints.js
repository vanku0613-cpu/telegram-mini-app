(function () {
  "use strict";

  function isSearchField(element) {
    return element instanceof HTMLInputElement &&
      (element.type === "search" || element.inputMode === "search") &&
      element.hasAttribute("placeholder");
  }

  document.addEventListener("focusin", function (event) {
    var field = event.target;
    if (!isSearchField(field)) return;
    if (!field.dataset.searchHint) field.dataset.searchHint = field.placeholder;
    if (!field.getAttribute("aria-label")) field.setAttribute("aria-label", field.dataset.searchHint);
    field.placeholder = "";
  });

  document.addEventListener("focusout", function (event) {
    var field = event.target;
    if (!isSearchField(field) || field.value || !field.dataset.searchHint) return;
    field.placeholder = field.dataset.searchHint;
  });
})();
