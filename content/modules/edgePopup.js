// OverTube Edge Sidebar Popup Module
window.OverTubeEdgePopup = {
  container: null,
  settings: null,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartTop: 50,
  dragMoved: false,
  activeTab: 'tab-player',

  init() {
    // Listen for storage changes to sync UI state
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        const updated = {};
        let needApply = false;
        for (let [key, { newValue }] of Object.entries(changes)) {
          updated[key] = newValue;
          if (this.settings && this.settings[key] !== newValue) {
            this.settings[key] = newValue;
            needApply = true;
          }
        }
        if (needApply && this.container) {
          this.updateUIState();
        }
      }
    });
    // Close popup on outside click
    document.addEventListener('pointerdown', (e) => {
      if (this.container && !this.container.classList.contains('collapsed')) {
        if (!this.container.contains(e.target)) {
          this.toggleCollapsed(true);
        }
      }
    });
    // Load initial settings and inject popup
    chrome.storage.sync.get(null, (settings) => {
      // Use defaults if empty
      this.settings = {
        extensionEnabled: true,
        progressBarCollapsed: false,
        progressBarStyle: 'default',
        playbackSpeed: 1.0,
        enableMiniPlayer: false,
        showEdgePopup: true,
        audioBoost: 100,
        hideShorts: false,
        focusHideSidebar: false,
        focusHideComments: false,
        focusHideHome: false,
        focusHideEndscreen: false,
        edgePopupPosition: {
          edge: 'right',
          topPercent: 50,
          collapsed: true
        },
        ...settings
      };

      if (!this.container) {
        this.render();
      }
      this.updateUIState();
    });
  },

  apply(newSettings) {
    this.settings = { ...(this.settings || {}), ...newSettings };
    if (!this.container) {
      this.render();
    }
    this.updateUIState();
  },

  render() {
    // Remove if already exists
    const existing = document.getElementById('overtube-edge-popup');
    if (existing) {
      existing.remove();
    }

    const pos = this.settings.edgePopupPosition || { edge: 'right', topPercent: 50, collapsed: true };

    const container = document.createElement('div');
    container.id = 'overtube-edge-popup';
    container.className = `${pos.edge} ${pos.collapsed ? 'collapsed' : 'expanded'}`;
    container.style.top = `${pos.topPercent}%`;

    const logoUrl = chrome.runtime.getURL('over.webp');

    // Create inner HTML
    container.innerHTML = `
      <!-- Collapsed Logo View -->
      <img src="${logoUrl}" alt="OverTube" class="ot-collapsed-logo" draggable="false" style="display: ${pos.collapsed ? 'block' : 'none'};">

      <!-- Expanded Panel View -->
      <div class="ot-expanded-content" style="display: ${pos.collapsed ? 'none' : 'block'};">
        <!-- Header -->
        <div class="ot-header">
          <div class="ot-brand">
            <img src="${logoUrl}" alt="Logo" class="ot-logo-img">
            <span class="ot-brand-title">OverTube</span>
          </div>
          <button class="ot-collapse-btn" title="Collapse Panel">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div class="ot-tabs">
          <div class="ot-nav-indicator" id="ot-nav-indicator"></div>
          <button class="ot-tab-btn active" data-tab="tab-player">Player</button>
          <button class="ot-tab-btn" data-tab="tab-audio">Audio</button>
          <button class="ot-tab-btn" data-tab="tab-focus">Focus</button>
        </div>

        <!-- Scrollable content wrapper -->
        <div class="ot-content-wrapper">
          <!-- Disabled State Overlay -->
          <div class="ot-disabled-overlay" style="display: none;">
            <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span>OverTube is Disabled</span>
          </div>

          <!-- PLAYER TAB -->
          <div id="ot-tab-player" class="ot-tab-content active">
            <!-- Custom Progress Bar (Collapsible) -->
            <div class="ot-card ot-collapsible-card" id="ot-progress-bar-card">
              <div class="ot-card-title ot-collapsible-header" id="ot-progress-card-header" style="cursor: pointer;">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
                <span>Custom Progress Bar</span>
                <svg class="ot-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              <div class="ot-collapsible-body" id="ot-progress-card-body">
                <p class="ot-card-desc">Personalize your YouTube progress bar with custom styling and gradients.</p>
                
                <!-- Live Preview -->
                <div class="ot-preview-container">
                  <div class="ot-preview-bar-track" id="ot-preview-track">
                    <div class="ot-preview-bar-fill" id="ot-preview-fill"></div>
                    <div class="ot-preview-bar-scrubber" id="ot-preview-scrubber"></div>
                  </div>
                </div>

                <!-- Presets Grid -->
                <div class="ot-presets-grid">
                  <button class="ot-preset-btn" data-style="default" data-tooltip="Default Red">
                    <div class="ot-preset-icon default-icon"></div>
                  </button>
                  <button class="ot-preset-btn" data-style="merry" data-tooltip="Going Merry">
                    <div class="ot-preset-icon merry-icon"></div>
                  </button>
                  <button class="ot-preset-btn" data-style="batman" data-tooltip="Batman">
                    <div class="ot-preset-icon batman-icon"></div>
                  </button>
                  <button class="ot-preset-btn" data-style="spiderman" data-tooltip="Spider-Man">
                    <div class="ot-preset-icon spiderman-icon"></div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Enhanced Playback Speed -->
            <div class="ot-card">
              <div class="ot-card-title">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12a9 9 0 1 1 18 0" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 12l3.5-3.5" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5M18.36 5.64l-1.06 1.06M5.64 5.64l1.06 1.06" />
                </svg>
                <span>Enhanced Playback Speed</span>
              </div>
              <div class="ot-slider-container">
                <div class="ot-slider-header">
                  <span class="ot-setting-hint">Speed Multiplier</span>
                  <span class="ot-slider-val" id="ot-speed-val">1.0x</span>
                </div>
                <input type="range" id="ot-playback-speed" class="ot-range-input" min="0.25" max="3" step="0.05" value="1">
              </div>
            </div>

            <!-- Sticky Mini Player -->
            <div class="ot-card">
              <div class="ot-card-title">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
                </svg>
                <span>Sticky Mini Player</span>
              </div>
              <div class="ot-switch-control">
                <div class="ot-setting-label">
                  <span class="ot-setting-name">Enable Mini Player</span>
                  <span class="ot-setting-hint">Floats video on scroll down</span>
                </div>
                <label class="ot-switch">
                  <input type="checkbox" id="ot-enable-mini-player">
                  <span class="ot-slider-toggle"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- AUDIO TAB -->
          <div id="ot-tab-audio" class="ot-tab-content">
            <div class="ot-card">
              <div class="ot-card-title">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
                <span>Audio Volume Booster</span>
              </div>
              <div class="ot-slider-container">
                <div class="ot-slider-header">
                  <span class="ot-setting-hint">Boost Level</span>
                  <span class="ot-slider-val" id="ot-audio-val">100%</span>
                </div>
                <input type="range" id="ot-audio-boost" class="ot-range-input" min="0" max="500" step="10" value="100">
              </div>
            </div>
          </div>

          <!-- FOCUS TAB -->
          <div id="ot-tab-focus" class="ot-tab-content">
            <!-- Hide Shorts -->
            <div class="ot-card">
              <div class="ot-card-title">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Hide YouTube Shorts</span>
              </div>
              <div class="ot-switch-control">
                <div class="ot-setting-label">
                  <span class="ot-setting-name">Block Shorts Entirely</span>
                  <span class="ot-setting-hint">Hides Shorts shelves and feeds</span>
                </div>
                <label class="ot-switch">
                  <input type="checkbox" id="ot-hide-shorts">
                  <span class="ot-slider-toggle"></span>
                </label>
              </div>
            </div>

            <!-- Focus Mode Options -->
            <div class="ot-card">
              <div class="ot-card-title">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span>Focus Mode</span>
              </div>
              <div class="ot-settings-list">
                <div class="ot-setting-item">
                  <span class="ot-setting-name">Hide Sidebar</span>
                  <label class="ot-switch">
                    <input type="checkbox" id="ot-focus-hide-sidebar">
                    <span class="ot-slider-toggle"></span>
                  </label>
                </div>
                <div class="ot-setting-item">
                  <span class="ot-setting-name">Hide Comments</span>
                  <label class="ot-switch">
                    <input type="checkbox" id="ot-focus-hide-comments">
                    <span class="ot-slider-toggle"></span>
                  </label>
                </div>
                <div class="ot-setting-item">
                  <span class="ot-setting-name">Hide Recommendations</span>
                  <label class="ot-switch">
                    <input type="checkbox" id="ot-focus-hide-home">
                    <span class="ot-slider-toggle"></span>
                  </label>
                </div>
                <div class="ot-setting-item">
                  <span class="ot-setting-name">Hide End Screens</span>
                  <label class="ot-switch">
                    <input type="checkbox" id="ot-focus-hide-endscreen">
                    <span class="ot-slider-toggle"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="ot-footer">
          <span>OverTube v1.0</span>
          <button class="ot-btn-reset" id="ot-reset-settings">Reset</button>
        </div>
      </div>
    `;

    if (document.body) {
      document.body.appendChild(container);
    } else {
      const observer = new MutationObserver(() => {
        if (document.body) {
          document.body.appendChild(container);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    this.container = container;

    this.attachEvents();
  },

  attachEvents() {
    const collapsedLogo = this.container.querySelector('.ot-collapsed-logo');
    const collapseBtn = this.container.querySelector('.ot-collapse-btn');
    const header = this.container.querySelector('.ot-header');

    let isDragging = false;
    let dragMoved = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartTop = 50;

    // Dragging physics
    const startDrag = (e) => {
      if (e.button !== 0) return;

      const isCollapsed = this.container.classList.contains('collapsed');
      if (!isCollapsed && !e.target.closest('.ot-header')) {
        return;
      }

      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

      e.preventDefault(); // Prevent native browser dragging and text selection

      isDragging = true;
      dragMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      // Center the 40x44 logo area directly under the cursor
      this.dragOffsetX = 20;
      this.dragOffsetY = 22;

      this.container.style.transition = 'top 0s, left 0s';

      document.addEventListener('pointermove', performDrag);
      document.addEventListener('pointerup', endDrag);
      document.addEventListener('pointercancel', endDrag);
    };

    const performDrag = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      // Only activate drag styling and remove state classes once we move past the threshold
      if (!dragMoved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        dragMoved = true;
        this.container.classList.add('ot-dragging');
        this.container.classList.remove('collapsed', 'expanded');

        // Temporarily toggle visibility to show logo only during drag
        const logoEl = this.container.querySelector('.ot-collapsed-logo');
        const contentEl = this.container.querySelector('.ot-expanded-content');
        if (logoEl && contentEl) {
          logoEl.style.display = 'block';
          contentEl.style.display = 'none';
        }
      }

      if (dragMoved) {
        // Move container directly under the cursor
        let x = e.clientX - this.dragOffsetX;
        let y = e.clientY - this.dragOffsetY;

        // Constrain within viewport bounds
        x = Math.max(0, Math.min(window.innerWidth - 40, x));
        y = Math.max(0, Math.min(window.innerHeight - 44, y));

        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;

        // Calculate horizontal switch edge
        const screenCenterX = window.innerWidth / 2;
        const currentEdge = e.clientX > screenCenterX ? 'right' : 'left';
        if (!this.container.classList.contains(currentEdge)) {
          this.container.classList.remove('left', 'right');
          this.container.classList.add(currentEdge);
        }
      }
    };

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.container.style.transition = '';

      document.removeEventListener('pointermove', performDrag);
      document.removeEventListener('pointerup', endDrag);
      document.removeEventListener('pointercancel', endDrag);

      if (dragMoved) {
        // Save position to storage
        const rect = this.container.getBoundingClientRect();
        const topPercent = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
        const edge = this.container.classList.contains('right') ? 'right' : 'left';
        const collapsed = this.settings.edgePopupPosition ? this.settings.edgePopupPosition.collapsed : true;

        this.settings.edgePopupPosition = { edge, topPercent, collapsed };
        this.saveSetting({ edgePopupPosition: this.settings.edgePopupPosition });
      }

      // Clear styles to let edge-docking class rules snap it back
      this.container.style.left = '';
      this.container.style.top = '';

      this.container.classList.remove('ot-dragging');
      this.updateUIState();
    };

    // Attach dragging pointerdown listener to container
    this.container.addEventListener('pointerdown', startDrag);

    // Standard click listener for opening
    this.container.addEventListener('click', (e) => {
      const isCollapsed = this.container.classList.contains('collapsed');
      if (dragMoved) return;
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

      if (isCollapsed) {
        this.toggleCollapsed(false);
      }
    });

    // Collapse panel button
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapsed(true);
    });

    // Navigation Tabs
    const updateNavIndicator = (activeButton) => {
      const indicator = this.container.querySelector('#ot-nav-indicator');
      if (indicator && activeButton) {
        indicator.style.width = `${activeButton.offsetWidth}px`;
        indicator.style.transform = `translateX(${activeButton.offsetLeft}px)`;
      }
    };

    const tabBtns = this.container.querySelectorAll('.ot-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        this.activeTab = target;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const contents = this.container.querySelectorAll('.ot-tab-content');
        contents.forEach(c => c.classList.remove('active'));
        this.container.querySelector(`#ot-${target}`).classList.add('active');
        
        updateNavIndicator(btn);
      });
    });

    // Inputs event mapping
    const updateSettingLocal = (key, value) => {
      this.settings[key] = value;
      const syncObj = {};
      syncObj[key] = value;
      this.saveSetting(syncObj);
      
      // Notify content script coordinator to immediately apply settings on current tab
      if (window.OverTubeProgressBar && key === 'progressBarStyle') {
        window.OverTubeProgressBar.apply(value);
      } else if (window.OverTubePlaybackSpeed && key === 'playbackSpeed') {
        window.OverTubePlaybackSpeed.apply(value);
      } else if (window.OverTubeAudioBooster && key === 'audioBoost') {
        window.OverTubeAudioBooster.apply(value);
      } else if (window.OverTubeHideShorts && key === 'hideShorts') {
        window.OverTubeHideShorts.apply(value);
      } else if (window.OverTubeMiniPlayer && key === 'enableMiniPlayer') {
        window.OverTubeMiniPlayer.apply(value);
      } else if (window.OverTubeFocusMode && key.startsWith('focus')) {
        window.OverTubeFocusMode.apply(this.settings);
      }
    };

    // Preset buttons
    const presetBtns = this.container.querySelectorAll('.ot-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-style');
        updateSettingLocal('progressBarStyle', style);
        this.updateUIState();
      });
    });

    // Playback Speed Slider
    const speedInput = this.container.querySelector('#ot-playback-speed');
    speedInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateSettingLocal('playbackSpeed', val);
      this.updateUIState();
    });

    // Mini Player Toggle
    const miniPlayerInput = this.container.querySelector('#ot-enable-mini-player');
    miniPlayerInput.addEventListener('change', (e) => {
      updateSettingLocal('enableMiniPlayer', e.target.checked);
    });

    // Audio Boost Slider
    const audioInput = this.container.querySelector('#ot-audio-boost');
    audioInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      updateSettingLocal('audioBoost', val);
      this.updateUIState();
    });

    // Hide Shorts Toggle
    const hideShortsInput = this.container.querySelector('#ot-hide-shorts');
    hideShortsInput.addEventListener('change', (e) => {
      updateSettingLocal('hideShorts', e.target.checked);
    });

    // Focus Mode Toggles
    const focusHideSidebarInput = this.container.querySelector('#ot-focus-hide-sidebar');
    focusHideSidebarInput.addEventListener('change', (e) => {
      updateSettingLocal('focusHideSidebar', e.target.checked);
    });

    const focusHideCommentsInput = this.container.querySelector('#ot-focus-hide-comments');
    focusHideCommentsInput.addEventListener('change', (e) => {
      updateSettingLocal('focusHideComments', e.target.checked);
    });

    const focusHideHomeInput = this.container.querySelector('#ot-focus-hide-home');
    focusHideHomeInput.addEventListener('change', (e) => {
      updateSettingLocal('focusHideHome', e.target.checked);
    });

    const focusHideEndscreenInput = this.container.querySelector('#ot-focus-hide-endscreen');
    focusHideEndscreenInput.addEventListener('change', (e) => {
      updateSettingLocal('focusHideEndscreen', e.target.checked);
    });

    // Collapsible Card Click Event
    const otProgressCard = this.container.querySelector('#ot-progress-bar-card');
    const otProgressCardHeader = this.container.querySelector('#ot-progress-card-header');
    if (otProgressCardHeader && otProgressCard) {
      otProgressCardHeader.addEventListener('click', () => {
        const collapsed = otProgressCard.classList.toggle('collapsed');
        updateSettingLocal('progressBarCollapsed', collapsed);
      });
    }

    // Reset Button
    const resetBtn = this.container.querySelector('#ot-reset-settings');
    resetBtn.addEventListener('click', () => {
      const DEFAULT_SETTINGS = {
        extensionEnabled: true,
        progressBarCollapsed: false,
        progressBarStyle: 'default',
        playbackSpeed: 1.0,
        enableMiniPlayer: false,
        showEdgePopup: true,
        audioBoost: 100,
        hideShorts: false,
        focusHideSidebar: false,
        focusHideComments: false,
        focusHideHome: false,
        focusHideEndscreen: false
      };
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        try {
          chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
            this.settings = { ...this.settings, ...DEFAULT_SETTINGS };
            this.updateUIState();
            // Force reload page to apply cleanly
            window.location.reload();
          });
        } catch (e) {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    });
  },

  saveSetting(syncObj) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.storage.sync.set(syncObj);
      } catch (e) {
        console.warn("OverTube extension context invalidated:", e);
      }
    }
  },

  toggleCollapsed(shouldCollapse) {
    if (!this.container) return;

    const pos = this.settings.edgePopupPosition || { edge: 'right', topPercent: 50 };
    pos.collapsed = shouldCollapse;
    this.settings.edgePopupPosition = pos;
    this.saveSetting({ edgePopupPosition: pos });

    this.updateUIState();
  },

  updateUIState() {
    if (!this.container || !this.settings) return;

    // Visibility control
    const isEnabled = this.settings.extensionEnabled !== false;
    const showPopup = this.settings.showEdgePopup !== false;

    if (!isEnabled || !showPopup) {
      this.container.style.display = 'none';
      return;
    } else {
      this.container.style.display = 'flex';
    }

    // Positions & classes
    const pos = this.settings.edgePopupPosition || { edge: 'right', topPercent: 50, collapsed: true };
    this.container.className = `${pos.edge} ${pos.collapsed ? 'collapsed' : 'expanded'}`;
    this.container.style.top = `${pos.topPercent}%`;

    const collapsedLogo = this.container.querySelector('.ot-collapsed-logo');
    const expandedContent = this.container.querySelector('.ot-expanded-content');
    
    if (pos.collapsed) {
      collapsedLogo.style.display = 'block';
      expandedContent.style.display = 'none';
    } else {
      collapsedLogo.style.display = 'none';
      expandedContent.style.display = 'block';

      // Update Arrow Direction based on edge
      const collapseSvg = this.container.querySelector('.ot-collapse-btn svg');
      if (collapseSvg) {
        if (pos.edge === 'right') {
          collapseSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />`;
        } else {
          collapseSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />`;
        }
      }

      // Update Nav tab indicator position
      const activeTabBtn = this.container.querySelector('.ot-tab-btn.active');
      if (activeTabBtn) {
        const applyIndicator = () => {
          const indicator = this.container.querySelector('#ot-nav-indicator');
          if (indicator) {
            indicator.style.width = `${activeTabBtn.offsetWidth}px`;
            indicator.style.transform = `translateX(${activeTabBtn.offsetLeft}px)`;
          }
        };
        if (activeTabBtn.offsetWidth > 0) {
          applyIndicator();
        } else {
          setTimeout(applyIndicator, 50);
        }
      }

      // Update Master Toggle / Disabled state visual overlay
      const overlay = this.container.querySelector('.ot-disabled-overlay');
      if (overlay) {
        overlay.style.display = this.settings.extensionEnabled ? 'none' : 'flex';
      }

      // Progress bar card collapsible state
      const otProgressCardEl = this.container.querySelector('#ot-progress-bar-card');
      if (otProgressCardEl) {
        if (this.settings.progressBarCollapsed) {
          otProgressCardEl.classList.add('collapsed');
        } else {
          otProgressCardEl.classList.remove('collapsed');
        }
      }

      // Active Preset styling
      const presetBtns = this.container.querySelectorAll('.ot-preset-btn');
      presetBtns.forEach(btn => {
        if (btn.getAttribute('data-style') === this.settings.progressBarStyle) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Preview track
      const previewTrack = this.container.querySelector('#ot-preview-track');
      if (previewTrack) {
        previewTrack.className = 'ot-preview-bar-track';
        if (this.settings.progressBarStyle !== 'default') {
          previewTrack.classList.add(`ot-preview-${this.settings.progressBarStyle}`);
        }
      }

      // Speed Slider & Display
      const speedInput = this.container.querySelector('#ot-playback-speed');
      if (speedInput) {
        speedInput.value = this.settings.playbackSpeed;
        this.updateSliderBackground(speedInput);
      }
      const speedVal = this.container.querySelector('#ot-speed-val');
      if (speedVal) {
        speedVal.textContent = parseFloat(this.settings.playbackSpeed).toFixed(2) + 'x';
      }

      // Mini Player Switch
      const miniPlayerInput = this.container.querySelector('#ot-enable-mini-player');
      if (miniPlayerInput) {
        miniPlayerInput.checked = this.settings.enableMiniPlayer;
      }

      // Volume Booster Slider & Display
      const audioInput = this.container.querySelector('#ot-audio-boost');
      if (audioInput) {
        audioInput.value = this.settings.audioBoost;
        this.updateSliderBackground(audioInput);
      }
      const audioVal = this.container.querySelector('#ot-audio-val');
      if (audioVal) {
        audioVal.textContent = this.settings.audioBoost + '%';
      }

      // Hide Shorts Switch
      const hideShortsInput = this.container.querySelector('#ot-hide-shorts');
      if (hideShortsInput) {
        hideShortsInput.checked = this.settings.hideShorts;
      }

      // Focus Mode Switches
      const focusHideSidebarInput = this.container.querySelector('#ot-focus-hide-sidebar');
      if (focusHideSidebarInput) focusHideSidebarInput.checked = this.settings.focusHideSidebar;

      const focusHideCommentsInput = this.container.querySelector('#ot-focus-hide-comments');
      if (focusHideCommentsInput) focusHideCommentsInput.checked = this.settings.focusHideComments;

      const focusHideHomeInput = this.container.querySelector('#ot-focus-hide-home');
      if (focusHideHomeInput) focusHideHomeInput.checked = this.settings.focusHideHome;

      const focusHideEndscreenInput = this.container.querySelector('#ot-focus-hide-endscreen');
      if (focusHideEndscreenInput) focusHideEndscreenInput.checked = this.settings.focusHideEndscreen;
    }
  },

  updateSliderBackground(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--ot-accent-color) 0%, var(--ot-accent-color) ${percent}%, var(--ot-bg-input) ${percent}%, var(--ot-bg-input) 100%)`;
  }
};
