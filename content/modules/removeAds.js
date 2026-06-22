// OverTube Remove Ads Module
window.OverTubeRemoveAds = {
  apply(remove) {
    const body = document.body;
    if (!body) return;

    if (remove) {
      body.classList.add('ot-remove-ads-active');
      this.removeAdsFromDOM();
      this.startObserver();
    } else {
      body.classList.remove('ot-remove-ads-active');
      this.stopObserver();
    }
  },

  observer: null,

  startObserver() {
    if (this.observer) return;
    
    this.observer = new MutationObserver(() => {
      this.removeAdsFromDOM();
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

  removeAdsFromDOM() {
    const adSelectors = [
      'ytd-ad-slot-renderer',
      'ytd-promoted-video-renderer',
      'ytd-compact-promoted-video-renderer',
      'ytd-display-ad-renderer',
      'ytd-statement-banner-renderer',
      'ytd-in-feed-ad-layout-renderer',
      'ytd-banner-promo-renderer',
      'ytd-video-masthead-ad-v3-renderer',
      'ytd-promoted-sparkles-web-renderer',
      'ytd-sparkles-web-renderer',
      'ytd-merch-shelf-renderer',
      'yt-companion-ad-renderer',
      'ytd-player-legacy-desktop-watch-ads-renderer',
      'ytd-action-companion-ad-renderer',
      'ytd-carousel-ad-renderer',
      'yt-brand-video-shelf-renderer',
      '#masthead-ad',
      '#player-ads',
      '#panels ytd-ad-slot-renderer',
      'ytd-search-pyv-renderer',
      'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
      'ytd-rich-item-renderer:has(.ytd-ad-slot-renderer)',
      'ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer)',
      'ytd-rich-item-renderer:has(ytd-display-ad-renderer)',
      'ytd-rich-section-renderer:has(ytd-ad-slot-renderer)',
      'ytd-rich-section-renderer:has(ytd-in-feed-ad-layout-renderer)',
      'ytd-rich-section-renderer:has(ytd-statement-banner-renderer)',
      'ytd-rich-item-renderer:has([aria-label="Sponsored"])',
      'ytd-rich-item-renderer:has([badge-style="BADGE_STYLE_AD"])',
      'ytd-rich-item-renderer:has(.yt-spec-icon-badge-shape--type-ad)'
    ];

    adSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          el.style.setProperty('display', 'none', 'important');
        });
      } catch (e) {}
    });

    // Also scan for dynamically rendered sponsored badges inside rich-grid items
    document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-ad-slot-renderer').forEach(el => {
      const hasSponsored = el.querySelector('.badge-style-type-ad, ytd-badge-supported-renderer:has(span[aria-label="Sponsored"]), [aria-label="Sponsored"], .yt-spec-icon-badge-shape--type-ad');
      if (hasSponsored) {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  }
};
