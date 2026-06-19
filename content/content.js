// OverTube Main Content Script Coordinator

const DEFAULT_SETTINGS = {
  extensionEnabled: true,
  progressBarStyle: 'default',
  playbackSpeed: 1.0,
  enableMiniPlayer: false,
  audioBoost: 100,
  hideShorts: false,
  focusHideSidebar: false,
  focusHideComments: false,
  focusHideHome: false,
  focusHideEndscreen: false
};

let currentSettings = { ...DEFAULT_SETTINGS };

// Apply all settings to the page
function applyAllSettings() {
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
    if (window.OverTubeMiniPlayer) {
      window.OverTubeMiniPlayer.apply(false);
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

  // 6. Mini Player
  if (window.OverTubeMiniPlayer) {
    window.OverTubeMiniPlayer.apply(currentSettings.enableMiniPlayer);
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
