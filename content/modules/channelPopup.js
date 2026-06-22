// OverTube Channel Hover Popup Module
window.OverTubeChannelPopup = {
  enabled: true,
  popupEl: null,
  hoverTimeout: null,
  hideTimeout: null,
  activeTarget: null,
  cache: {}, // Cache to store fetched channel details
  activeAbortController: null,

  init() {
    this.createPopupElement();
    this.setupEventListeners();
  },

  apply(isEnabled) {
    this.enabled = isEnabled;
    if (!this.enabled) {
      this.hidePopup(true);
    }
  },

  createPopupElement() {
    if (document.getElementById('ot-channel-popup')) return;

    const popup = document.createElement('div');
    popup.id = 'ot-channel-popup';
    popup.innerHTML = `
      <div class="ot-cp-card ot-cp-skeleton">
        <div class="ot-cp-header">
          <div class="ot-cp-avatar"></div>
          <div class="ot-cp-info">
            <div class="ot-cp-name">Loading Channel...</div>
            <div class="ot-cp-handle">@username</div>
          </div>
        </div>
        <div class="ot-cp-description">Loading description and other details from YouTube...</div>
        <div class="ot-cp-stats">
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">--</div>
              <div class="ot-cp-stat-label">Subs</div>
            </div>
          </div>
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">--</div>
              <div class="ot-cp-stat-label">Videos</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    this.popupEl = popup;

    // Prevent hiding when hovering the popup card itself
    popup.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    popup.addEventListener('mouseleave', () => {
      this.startHideTimeout();
    });
  },

  setupEventListeners() {
    // Mouse over delegation
    document.addEventListener('mouseover', (e) => {
      if (!this.enabled) return;

      const target = this.findChannelTarget(e.target);
      if (target) {
        this.handleTargetHover(target);
      }
    });

    // Mouse out delegation
    document.addEventListener('mouseout', (e) => {
      if (!this.enabled) return;

      const target = this.findChannelTarget(e.target);
      if (target && this.activeTarget === target) {
        this.clearHoverTimeout();
        this.startHideTimeout();
      }
    });

    // Mouse move delegation to position the popup during hover transitions
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.activeTarget || !this.popupEl.classList.contains('ot-cp-visible')) return;
      // Do not dynamically move the popup if it's already shown, just keep it steady relative to original target
    });
  },

  findChannelTarget(el) {
    // Find closest anchor tag
    const anchor = el.closest('a');
    if (!anchor) return null;

    const href = anchor.getAttribute('href');
    if (!href) return null;

    // Check if it matches a channel url
    // YouTube channel urls: /@channel, /user/name, /channel/id, /c/name
    const isChannelUrl = /^\/(@|user\/|channel\/|c\/)[a-zA-Z0-9_\-\.]+/.test(href);
    if (!isChannelUrl) return null;

    // Avoid links that are actually search filters, hashtags or general pages
    if (href.includes('/featured') || href.includes('/videos') || href.includes('/shorts') || href.includes('/playlists') || href.includes('/community')) {
      return anchor;
    }

    return anchor;
  },

  handleTargetHover(target) {
    if (this.activeTarget === target) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      return;
    }

    this.clearHoverTimeout();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.activeTarget = target;

    // 400ms hover delay (debounce) before showing the card
    this.hoverTimeout = setTimeout(() => {
      this.showPopupForTarget(target);
    }, 400);
  },

  clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  },

  startHideTimeout() {
    if (this.hideTimeout) return;

    this.hideTimeout = setTimeout(() => {
      this.hidePopup();
    }, 300);
  },

  hidePopup(immediate = false) {
    if (!this.popupEl) return;

    this.clearHoverTimeout();
    this.activeTarget = null;

    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }

    if (immediate) {
      this.popupEl.classList.remove('ot-cp-visible');
    } else {
      this.popupEl.classList.remove('ot-cp-visible');
    }
  },

  positionPopup(target) {
    if (!this.popupEl || !target) return;

    const rect = target.getBoundingClientRect();
    const popupRect = this.popupEl.getBoundingClientRect();
    const margin = 10;

    let left = rect.left + (rect.width / 2) - (popupRect.width / 2);
    let top = rect.top - popupRect.height - margin;

    // Ensure it doesn't overflow horizontally
    if (left < margin) {
      left = margin;
    } else if (left + popupRect.width > window.innerWidth - margin) {
      left = window.innerWidth - popupRect.width - margin;
    }

    // Ensure it doesn't overflow vertically (show below target if it overflows top)
    if (top < margin) {
      top = rect.bottom + margin;
    }

    this.popupEl.style.left = `${left}px`;
    this.popupEl.style.top = `${top}px`;
  },

  showPopupForTarget(target) {
    const href = target.getAttribute('href');
    const fullUrl = window.location.origin + href;

    // Show template in skeleton mode
    this.renderSkeleton();
    this.popupEl.classList.add('ot-cp-visible');
    this.positionPopup(target);

    // Check Cache
    if (this.cache[href]) {
      this.renderChannelDetails(this.cache[href]);
      this.positionPopup(target);
      return;
    }

    // Abort active fetch if any
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    this.activeAbortController = new AbortController();

    // Fetch details
    fetch(fullUrl, { signal: this.activeAbortController.signal })
      .then(response => response.text())
      .then(html => {
        const details = this.parseChannelHtml(html, href);
        this.cache[href] = details;
        if (this.activeTarget === target) {
          this.renderChannelDetails(details);
          this.positionPopup(target);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('OverTube: Failed to fetch channel details', err);
        if (this.activeTarget === target) {
          this.renderError();
        }
      });
  },

  renderSkeleton() {
    this.popupEl.innerHTML = `
      <div class="ot-cp-card ot-cp-skeleton">
        <div class="ot-cp-header">
          <div class="ot-cp-avatar"></div>
          <div class="ot-cp-info">
            <div class="ot-cp-name">Loading Channel...</div>
            <div class="ot-cp-handle">@username</div>
          </div>
        </div>
        <div class="ot-cp-description">Loading channel data from YouTube...</div>
        <div class="ot-cp-stats">
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">--</div>
              <div class="ot-cp-stat-label">Subs</div>
            </div>
          </div>
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">--</div>
              <div class="ot-cp-stat-label">Videos</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderChannelDetails(details) {
    const verifiedIcon = details.verified ? `
      <span class="ot-cp-verified" title="Verified">
        <svg viewBox="0 0 24 24" fill="currentColor" style="color: #aaa; width: 14px; height: 14px;">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </span>
    ` : '';

    this.popupEl.innerHTML = `
      <div class="ot-cp-card">
        <div class="ot-cp-header">
          <img class="ot-cp-avatar" src="${details.avatar}" alt="${details.name}">
          <div class="ot-cp-info">
            <div class="ot-cp-name">${details.name}${verifiedIcon}</div>
            <div class="ot-cp-handle">${details.handle}</div>
          </div>
        </div>
        <div class="ot-cp-description">${details.description || 'No description available.'}</div>
        <div class="ot-cp-stats">
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">${details.subscribers || '--'}</div>
              <div class="ot-cp-stat-label">Subs</div>
            </div>
          </div>
          <div class="ot-cp-stat">
            <div class="ot-cp-stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
              </svg>
            </div>
            <div class="ot-cp-stat-content">
              <div class="ot-cp-stat-value">${details.videos || '--'}</div>
              <div class="ot-cp-stat-label">Videos</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderError() {
    this.popupEl.innerHTML = `
      <div class="ot-cp-card">
        <div class="ot-cp-name" style="color: #ff443a; font-size: 14px; margin-bottom: 4px;">Failed to load channel details</div>
        <div class="ot-cp-description" style="margin-bottom: 0;">Please check your connection or try again later.</div>
      </div>
    `;
  },

  parseChannelHtml(html, href) {
    const details = {
      name: 'Unknown Channel',
      handle: href.startsWith('/@') ? href : '@channel',
      avatar: 'https://www.youtube.com/img/desktop/ftr/logo_dark.png',
      description: '',
      subscribers: '',
      videos: '',
      verified: false
    };

    try {
      // 1. Attempt parsing via ytInitialData JSON object from the page HTML
      const ytDataRegex = /ytInitialData\s*=\s*({.+?});/s;
      const match = html.match(ytDataRegex);
      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]);
          
          // Locate header information (avatar, title, sub count, video count, etc.)
          const header = data.header?.pageHeaderRenderer?.content?.pageHeaderViewModel ||
                         data.header?.c4TabbedHeaderRenderer;
                         
          if (header) {
            // Extract from pageHeaderViewModel (modern YouTube structure)
            if (header.title?.dynamicTextViewModel?.text?.content) {
              details.name = header.title.dynamicTextViewModel.text.content;
            }
            if (header.image?.decoratorViewModel?.avatarViewModel?.image?.sources?.[0]?.url) {
              details.avatar = header.image.decoratorViewModel.avatarViewModel.image.sources[0].url;
            }
            
            // Handle metadata rows
            const metadataRows = header.metadata?.contentMetadataViewModel?.metadataRows;
            if (metadataRows && Array.isArray(metadataRows)) {
              for (const row of metadataRows) {
                const parts = row.metadataParts;
                if (parts && Array.isArray(parts)) {
                  for (const part of parts) {
                    const text = part.text?.content || '';
                    if (text.includes('subscriber') || text.includes('sub')) {
                      details.subscribers = text.split(' ')[0];
                    } else if (text.includes('video')) {
                      details.videos = text.split(' ')[0];
                    } else if (text.startsWith('@')) {
                      details.handle = text;
                    }
                  }
                }
              }
            }

            // Fallback checking for verification
            if (header.title?.dynamicTextViewModel?.text?.attachmentViewModel?.badgeViewModel) {
              details.verified = true;
            }
          }
          
          // Fallback legacy structure header (c4TabbedHeaderRenderer)
          if (header && !details.name && header.title) {
            details.name = header.title;
            if (header.avatar?.thumbnails?.[0]?.url) {
              details.avatar = header.avatar.thumbnails[0].url;
            }
            if (header.subscriberCountText?.simpleText) {
              const subText = header.subscriberCountText.simpleText;
              details.subscribers = subText.split(' ')[0];
            }
            if (header.videosCountText?.runs?.[0]?.text) {
              details.videos = header.videosCountText.runs[0].text;
            }
          }

          // Description parsing from ytInitialData
          const metadata = data.metadata?.channelMetadataRenderer;
          if (metadata) {
            if (!details.name && metadata.title) details.name = metadata.title;
            if (metadata.description) details.description = metadata.description;
            if (metadata.avatar?.thumbnails?.[0]?.url) details.avatar = metadata.avatar.thumbnails[0].url;
          }
        } catch (e) {
          console.warn('OverTube: Error parsing ytInitialData', e);
        }
      }
    } catch (e) {
      console.warn('OverTube: ytInitialData extraction outer catch', e);
    }

    // 2. DOM Parser fallbacks for standard meta tag extraction
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Title/Name
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.getAttribute('content') && details.name === 'Unknown Channel') {
        details.name = ogTitle.getAttribute('content');
      }

      // Handle from link relations
      const canonical = doc.querySelector('link[rel="canonical"]');
      if (canonical && canonical.getAttribute('href')) {
        const canonicalHref = canonical.getAttribute('href');
        const handleMatch = canonicalHref.match(/\/@[a-zA-Z0-9_\-\.]+/);
        if (handleMatch) {
          details.handle = handleMatch[0];
        }
      }

      // Avatar
      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage && ogImage.getAttribute('content') && details.avatar.includes('logo_dark.png')) {
        details.avatar = ogImage.getAttribute('content');
      }

      // Description / Subs count from description meta tags
      const ogDesc = doc.querySelector('meta[property="og:description"]');
      const desc = doc.querySelector('meta[name="description"]');
      const descContent = ogDesc?.getAttribute('content') || desc?.getAttribute('content') || '';
      
      if (descContent) {
        // Typical format: "xyz has 1.2M subscribers, 300 videos. Welcome..." or "xyz. 1.2M subscribers • 300 videos"
        if (!details.subscribers) {
          const subMatch = descContent.match(/([\d\.]+[KkMmB]?) subscribers/);
          if (subMatch) details.subscribers = subMatch[1];
        }
        if (!details.videos) {
          const videoMatch = descContent.match(/([\d,]+) videos/);
          if (videoMatch) details.videos = videoMatch[1];
        }
        if (!details.description) {
          // clean up description prefix (e.g., name, subs, videos info)
          let cleanDesc = descContent;
          const introMatch = descContent.match(/^.*?(subscribers|videos)[\s\.,•]*\s*/i);
          if (introMatch) {
            cleanDesc = descContent.substring(introMatch[0].length);
          }
          details.description = cleanDesc.trim();
        }
      }

      // Verify badge fallback
      const badges = doc.querySelector('.badge-shape-wiz--type-verified');
      if (badges) {
        details.verified = true;
      }
    } catch (e) {
      console.warn('OverTube: DOMParser fallback error', e);
    }

    // Clean details
    if (details.name === 'Unknown Channel' && details.handle) {
      details.name = details.handle;
    }
    
    // Ensure avatar is high res if it's a youtube image
    if (details.avatar && details.avatar.includes('yt3.ggpht.com')) {
      details.avatar = details.avatar.replace(/=s\d+-c-k-c0x\d+-no-rj/, '=s88-c-k-c0x00ffffff-no-rj');
    }

    return details;
  }
};
