// OverTube Main Content Script Coordinator

const DEFAULT_SETTINGS = {
  extensionEnabled: true,
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

let currentSettings = { ...DEFAULT_SETTINGS };

// Apply all settings to the page
function applyAllSettings() {
  // Apply Custom Cursor state
  if (currentSettings.extensionEnabled && currentSettings.customCursorEnabled) {
    document.documentElement.classList.add('ot-custom-cursor');
  } else {
    document.documentElement.classList.remove('ot-custom-cursor');
  }

  // If master toggle is disabled, revert all features back to normal/default
  if (currentSettings.extensionEnabled === false) {
    if (window.OverTubeProgressBar) {
      window.OverTubeProgressBar.apply('default');
    }
    if (window.OverTubePlaybackSpeed) {
      window.OverTubePlaybackSpeed.apply(1.0);
    }
    if (window.OverTubeAudioBooster) {
      window.OverTubeAudioBooster.apply(100);
    }
    if (window.OverTubeFocusMode) {
      window.OverTubeFocusMode.apply({
        focusHideSidebar: false,
        focusHideComments: false,
        focusHideHome: false,
        focusHideEndscreen: false
      });
    }
    if (window.OverTubeHideShorts) {
      window.OverTubeHideShorts.apply(false);
    }
    if (window.OverTubeRemoveAds) {
      window.OverTubeRemoveAds.apply(false);
    }
    if (window.OverTubeMiniPlayer) {
      window.OverTubeMiniPlayer.apply(false);
    }
    if (window.OverTubeChannelPopup) {
      window.OverTubeChannelPopup.apply(false);
    }
    if (window.OverTubeEdgePopup) {
      window.OverTubeEdgePopup.apply({ ...currentSettings, extensionEnabled: false });
    }
    return;
  }

  // 1. Progress Bar
  if (window.OverTubeProgressBar) {
    window.OverTubeProgressBar.apply(currentSettings.progressBarStyle);
  }

  // 2. Playback Speed
  if (window.OverTubePlaybackSpeed) {
    window.OverTubePlaybackSpeed.apply(currentSettings.playbackSpeed);
  }

  // 3. Audio Booster
  if (window.OverTubeAudioBooster) {
    window.OverTubeAudioBooster.apply(currentSettings.audioBoost);
  }

  // 4. Focus Mode
  if (window.OverTubeFocusMode) {
    window.OverTubeFocusMode.apply(currentSettings);
  }

  // 5. Hide Shorts
  if (window.OverTubeHideShorts) {
    window.OverTubeHideShorts.apply(currentSettings.hideShorts);
  }

  // 5.1. Remove Ads
  if (window.OverTubeRemoveAds) {
    window.OverTubeRemoveAds.apply(currentSettings.removeAds);
  }

  // 6. Mini Player
  if (window.OverTubeMiniPlayer) {
    window.OverTubeMiniPlayer.apply(currentSettings.enableMiniPlayer);
  }

  // 7. Channel Hover Popup
  if (window.OverTubeChannelPopup) {
    window.OverTubeChannelPopup.apply(currentSettings.channelPopupEnabled);
  }

  // 8. Edge Popup
  if (window.OverTubeEdgePopup) {
    window.OverTubeEdgePopup.apply(currentSettings);
  }
}

// Watch for DOM changes to apply settings dynamically when YouTube navigation occurs
function observeNavigation() {
  // YouTube uses single-page-app navigation, so we need to continuously apply speed and styles
  const observer = new MutationObserver((mutations) => {
    let shouldApply = false;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldApply = true;
        break;
      }
    }
    if (shouldApply) {
      applyAllSettings();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: false // Watch direct children of html/body
  });
  
  // Also run every second to catch asynchronous updates or page transitions
  setInterval(() => {
    applyAllSettings();
  }, 1000);
}

// Listen for messages from the popup dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'update_settings') {
    currentSettings = { ...currentSettings, ...message.settings };
    applyAllSettings();
  }
});

// Sync currentSettings immediately on storage sync updates (e.g. from edge popup or dashboard)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    const updated = {};
    for (let [key, { newValue }] of Object.entries(changes)) {
      updated[key] = newValue;
    }
    currentSettings = { ...currentSettings, ...updated };
    applyAllSettings();
  }
});

// Initialize on page load
function init() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    currentSettings = settings;

    // Initialize individual modules if needed
    if (window.OverTubePlaybackSpeed) {
      window.OverTubePlaybackSpeed.init();
    }
    if (window.OverTubeMiniPlayer) {
      window.OverTubeMiniPlayer.init();
    }
    if (window.OverTubeChannelPopup) {
      window.OverTubeChannelPopup.init();
    }
    if (window.OverTubeEdgePopup) {
      window.OverTubeEdgePopup.init();
    }

    applyAllSettings();
    observeNavigation();
  });
}

// Start OverTube
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
