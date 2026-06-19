// OverTube Focus Mode Module
window.OverTubeFocusMode = {
  apply(settings) {
    const body = document.body;
    if (!body) return;

    // Sidebar
    if (settings.focusHideSidebar) {
      body.classList.add('ot-focus-hide-sidebar');
    } else {
      body.classList.remove('ot-focus-hide-sidebar');
    }

    // Comments
    if (settings.focusHideComments) {
      body.classList.add('ot-focus-hide-comments');
    } else {
      body.classList.remove('ot-focus-hide-comments');
    }

    // Home recommendations
    if (settings.focusHideHome) {
      body.classList.add('ot-focus-hide-home');
    } else {
      body.classList.remove('ot-focus-hide-home');
    }

    // End screens
    if (settings.focusHideEndscreen) {
      body.classList.add('ot-focus-hide-endscreen');
    } else {
      body.classList.remove('ot-focus-hide-endscreen');
    }

    // Dispatch resize event to let YouTube player recalculate its bounds
    window.dispatchEvent(new Event('resize'));
  }
};
