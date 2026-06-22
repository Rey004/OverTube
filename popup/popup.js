// Default Settings Configuration
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
  focusHideEndscreen: false,
  customCursorEnabled: true,
  channelPopupEnabled: true,
  removeAds: false
};

// UI Element References
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const presetButtons = document.querySelectorAll('.preset-btn');
const previewTrack = document.getElementById('preview-track');

const masterToggleInput = document.getElementById('master-toggle');
const settingsWrapper = document.getElementById('settings-wrapper');
const progressCard = document.getElementById('progress-bar-card');
const progressCardHeader = document.getElementById('progress-card-header');

const playbackSpeedInput = document.getElementById('playback-speed');
const speedValLabel = document.getElementById('speed-val');
const enableMiniPlayerInput = document.getElementById('enable-mini-player');
const customCursorInput = document.getElementById('custom-cursor-toggle');
const channelPopupInput = document.getElementById('channel-popup-toggle');
const showEdgePopupInput = document.getElementById('show-edge-popup');
const audioBoostInput = document.getElementById('audio-boost');
const audioValLabel = document.getElementById('audio-val');
const hideShortsInput = document.getElementById('hide-shorts');
const removeAdsInput = document.getElementById('remove-ads-toggle');

const focusHideSidebarInput = document.getElementById('focus-hide-sidebar');
const focusHideCommentsInput = document.getElementById('focus-hide-comments');
const focusHideHomeInput = document.getElementById('focus-hide-home');
const focusHideEndscreenInput = document.getElementById('focus-hide-endscreen');
const resetSettingsBtn = document.getElementById('reset-settings');

// Helper to style active range slider tracks dynamically
function updateSliderTrack(slider) {
  if (!slider) return;
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const percent = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${percent}%, var(--bg-input) ${percent}%, var(--bg-input) 100%)`;
}

// Helper to update active preset UI and preview
function setActivePreset(style) {
  presetButtons.forEach(btn => {
    if (btn.getAttribute('data-style') === style) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (previewTrack) {
    previewTrack.className = 'preview-bar-track';
    if (style !== 'default') {
      previewTrack.classList.add(`preview-${style}`);
    }
  }
}

// Save Settings to Storage & Notify content scripts
function updateSetting(key, value) {
  const updateObj = {};
  updateObj[key] = value;
  chrome.storage.sync.set(updateObj, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'update_settings', settings: updateObj }, () => {
          if (chrome.runtime.lastError) {
            // Ignore error: occurs when on non-YouTube page
          }
        });
      }
    });
  });
}

// Helper to move sliding tab indicator
function updateNavIndicator(activeButton) {
  const indicator = document.getElementById('nav-indicator');
  if (indicator && activeButton) {
    indicator.style.width = `${activeButton.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeButton.offsetLeft}px)`;
  }
}

// Tabs Switching Logic
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    const contentEl = document.getElementById(targetTab);
    if (contentEl) contentEl.classList.add('active');
    
    // Update indicator position
    updateNavIndicator(button);
  });
});

// Load stored settings on open
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    // 1. Master Toggle Enable/Disable
    if (masterToggleInput) {
      masterToggleInput.checked = settings.extensionEnabled;
      toggleDashboardState(settings.extensionEnabled);
    }

    // 2. Collapsible state
    if (progressCard) {
      if (settings.progressBarCollapsed) {
        progressCard.classList.add('collapsed');
      } else {
        progressCard.classList.remove('collapsed');
      }
    }

    // 3. Progress bar style
    setActivePreset(settings.progressBarStyle);

    // 4. Playback speed
    if (playbackSpeedInput) {
      playbackSpeedInput.value = settings.playbackSpeed;
      updateSliderTrack(playbackSpeedInput);
    }
    if (speedValLabel) speedValLabel.textContent = parseFloat(settings.playbackSpeed).toFixed(2) + 'x';

    // 5. Mini Player
    if (enableMiniPlayerInput) enableMiniPlayerInput.checked = settings.enableMiniPlayer;

    // 5.2. Custom Cursor
    if (customCursorInput) customCursorInput.checked = settings.customCursorEnabled;

    // 5.3. Channel Hover Popup
    if (channelPopupInput) channelPopupInput.checked = settings.channelPopupEnabled;

    // 5.5. Show Edge Popup
    if (showEdgePopupInput) showEdgePopupInput.checked = settings.showEdgePopup;

    // 6. Audio Boost
    if (audioBoostInput) {
      audioBoostInput.value = settings.audioBoost;
      updateSliderTrack(audioBoostInput);
    }
    if (audioValLabel) audioValLabel.textContent = settings.audioBoost + '%';

    // 7. Hide Shorts
    if (hideShortsInput) hideShortsInput.checked = settings.hideShorts;

    // 7.1. Remove Ads
    if (removeAdsInput) removeAdsInput.checked = settings.removeAds;

    // 8. Focus Mode toggles
    if (focusHideSidebarInput) focusHideSidebarInput.checked = settings.focusHideSidebar;
    if (focusHideCommentsInput) focusHideCommentsInput.checked = settings.focusHideComments;
    if (focusHideHomeInput) focusHideHomeInput.checked = settings.focusHideHome;
    if (focusHideEndscreenInput) focusHideEndscreenInput.checked = settings.focusHideEndscreen;

    // Set initial nav indicator position on load
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (activeTabBtn) {
      setTimeout(() => updateNavIndicator(activeTabBtn), 50);
    }
  });
});

// Disable/enable dashboard content styling
function toggleDashboardState(enabled) {
  if (settingsWrapper) {
    if (enabled) {
      settingsWrapper.classList.remove('popup-disabled-state');
    } else {
      settingsWrapper.classList.add('popup-disabled-state');
    }
  }
}

// Collapsible Card Event
if (progressCardHeader && progressCard) {
  progressCardHeader.addEventListener('click', () => {
    const collapsed = progressCard.classList.toggle('collapsed');
    updateSetting('progressBarCollapsed', collapsed);
  });
}

// Master Toggle Event
if (masterToggleInput) {
  masterToggleInput.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    toggleDashboardState(enabled);
    updateSetting('extensionEnabled', enabled);
  });
}

// Event Listeners for inputs
presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const style = btn.getAttribute('data-style');
    setActivePreset(style);
    updateSetting('progressBarStyle', style);
  });
});

if (playbackSpeedInput) {
  playbackSpeedInput.addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    if (speedValLabel) speedValLabel.textContent = speed.toFixed(2) + 'x';
    updateSliderTrack(e.target);
    updateSetting('playbackSpeed', speed);
  });
}

if (enableMiniPlayerInput) {
  enableMiniPlayerInput.addEventListener('change', (e) => {
    updateSetting('enableMiniPlayer', e.target.checked);
  });
}

if (showEdgePopupInput) {
  showEdgePopupInput.addEventListener('change', (e) => {
    updateSetting('showEdgePopup', e.target.checked);
  });
}

if (customCursorInput) {
  customCursorInput.addEventListener('change', (e) => {
    updateSetting('customCursorEnabled', e.target.checked);
  });
}

if (channelPopupInput) {
  channelPopupInput.addEventListener('change', (e) => {
    updateSetting('channelPopupEnabled', e.target.checked);
  });
}

if (audioBoostInput) {
  audioBoostInput.addEventListener('input', (e) => {
    const boost = parseInt(e.target.value);
    if (audioValLabel) audioValLabel.textContent = boost + '%';
    updateSliderTrack(e.target);
    updateSetting('audioBoost', boost);
  });
}

if (hideShortsInput) {
  hideShortsInput.addEventListener('change', (e) => {
    updateSetting('hideShorts', e.target.checked);
  });
}

if (removeAdsInput) {
  removeAdsInput.addEventListener('change', (e) => {
    updateSetting('removeAds', e.target.checked);
  });
}

if (focusHideSidebarInput) {
  focusHideSidebarInput.addEventListener('change', (e) => {
    updateSetting('focusHideSidebar', e.target.checked);
  });
}

if (focusHideCommentsInput) {
  focusHideCommentsInput.addEventListener('change', (e) => {
    updateSetting('focusHideComments', e.target.checked);
  });
}

if (focusHideHomeInput) {
  focusHideHomeInput.addEventListener('change', (e) => {
    updateSetting('focusHideHome', e.target.checked);
  });
}

if (focusHideEndscreenInput) {
  focusHideEndscreenInput.addEventListener('change', (e) => {
    updateSetting('focusHideEndscreen', e.target.checked);
  });
}

if (resetSettingsBtn) {
  resetSettingsBtn.addEventListener('click', () => {
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      document.location.reload();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'update_settings', settings: DEFAULT_SETTINGS }, () => {
            if (chrome.runtime.lastError) {
              // Ignore error: occurs when on non-YouTube page
            }
          });
        }
      });
    });
  });
}

// Make Preset Scrubber/Slider interactive (draggable/clickable)
function initPreviewSliderInteractions() {
  const previewTrack = document.getElementById('preview-track');
  const previewFill = document.getElementById('preview-fill');
  const previewScrubber = document.getElementById('preview-scrubber');

  if (!previewTrack || !previewFill || !previewScrubber) return;

  let isDragging = false;

  const updatePreviewValue = (clientX) => {
    const rect = previewTrack.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));

    previewFill.style.width = `${percentage}%`;
    previewScrubber.style.left = `${percentage}%`;
  };

  const handlePointerDown = (e) => {
    isDragging = true;
    updatePreviewValue(e.clientX);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updatePreviewValue(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging = false;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  previewTrack.addEventListener('pointerdown', handlePointerDown);
}

document.addEventListener('DOMContentLoaded', () => {
  initPreviewSliderInteractions();
});
