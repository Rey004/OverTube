// OverTube Hide Shorts Module
window.OverTubeHideShorts = {
  apply(hide) {
    const body = document.body;
    if (!body) return;

    if (hide) {
      body.classList.add('ot-hide-shorts-active');
      this.removeShortsFromDOM();
      this.startObserver();
    } else {
      body.classList.remove('ot-hide-shorts-active');
      this.stopObserver();
    }
  },

  observer: null,

  startObserver() {
    if (this.observer) return;
    
    this.observer = new MutationObserver(() => {
      this.removeShortsFromDOM();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  },

  removeShortsFromDOM() {
    // Select and hide any remaining elements that match shorts references dynamically
    const shortsSelectors = [
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-shelf-renderer',
      'a[href^="/shorts"]',
      'ytd-guide-entry-renderer:has(a[href="/shorts"])',
      'ytd-mini-guide-entry-renderer:has(a[href="/shorts"])'
    ];

    shortsSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // We can hide it or remove it entirely
        el.style.setProperty('display', 'none', 'important');
      });
    });
  }
};
