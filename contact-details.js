(() => {
  'use strict';

  function enhanceCard(card) {
    for (const paragraph of [...card.children].filter(node =>
      node.tagName === 'P' &&
      !node.classList.contains('phone-label') &&
      !node.classList.contains('specialty') &&
      !node.closest('details') &&
      node.textContent.trim()
    )) {
      const details = document.createElement('details');
      details.className = 'contact-more';
      const summary = document.createElement('summary');
      summary.textContent = 'Подробности';
      details.append(summary, paragraph);
      const phones = card.querySelector(':scope > .phones, :scope > .phone-row, :scope > .phone-action');
      if (phones) phones.after(details);
      else card.append(details);
    }
  }

  function enhance(root) {
    if (root.matches?.('.contact')) enhanceCard(root);
    root.querySelectorAll?.('.contact').forEach(enhanceCard);
  }

  enhance(document);
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
