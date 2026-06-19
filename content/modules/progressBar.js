// OverTube Progress Bar Module
window.OverTubeProgressBar = {
  apply(style) {
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    // Remove existing styles
    player.classList.remove('ot-progress-neon', 'ot-progress-minimal', 'ot-progress-gradient', 'ot-progress-gaming');

    if (style !== 'default') {
      player.classList.add(`ot-progress-${style}`);
    }
  }
};
