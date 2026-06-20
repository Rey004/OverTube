// OverTube Progress Bar Module
window.OverTubeProgressBar = {
  apply(style) {
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    // Remove existing styles
    player.classList.remove('ot-progress-merry', 'ot-progress-batman', 'ot-progress-spiderman');

    if (style !== 'default') {
      player.classList.add(`ot-progress-${style}`);
    }
  }
};
