// site-config.js — shared contact/config values + tiny DOM-population helpers.
// Loaded by rental-terms.html and tests/site-config.test.html. No page-specific markup here.
(function (root) {
  const SITE = {
    phone: "0917-877-8619",
    facebookUrl: "https://www.facebook.com/tabletopgamestogo",
    instagramUrl: "https://www.instagram.com/tabletopgamestogo/",
    tiktokUrl: "https://www.tiktok.com/@tabletop.games.to.go",
    bookingFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfKprdBPWiibzsPFCuH8bpvjHnIOZ5nFEvEN14EmniVHX8EIw/viewform"
  };

  // Fills text content of [data-field] elements and href of [data-href-field]
  // elements from `site`. Missing keys are left untouched (no blanking on typos).
  function applySiteConfig(doc, site) {
    doc.querySelectorAll('[data-field]').forEach(function (el) {
      const key = el.getAttribute('data-field');
      if (Object.prototype.hasOwnProperty.call(site, key)) {
        el.textContent = site[key];
      }
    });
    doc.querySelectorAll('[data-href-field]').forEach(function (el) {
      const key = el.getAttribute('data-href-field');
      if (Object.prototype.hasOwnProperty.call(site, key)) {
        el.setAttribute('href', site[key]);
      }
    });
  }

  // Wires up click-to-toggle accordion items. An "item" is any element with
  // data-open="true|false" containing one .accordion-header button followed
  // by a .accordion-body. Toggling flips data-open and aria-expanded.
  function initAccordions(doc) {
    doc.querySelectorAll('.accordion-item').forEach(function (item) {
      const header = item.querySelector('.accordion-header');
      if (!header) return;
      header.addEventListener('click', function () {
        const isOpen = item.getAttribute('data-open') === 'true';
        item.setAttribute('data-open', String(!isOpen));
        header.setAttribute('aria-expanded', String(!isOpen));
      });
    });
  }

  root.SiteConfig = { SITE, applySiteConfig, initAccordions };
})(typeof window !== 'undefined' ? window : this);
