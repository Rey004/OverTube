// OverTube Playback Speed Module
window.OverTubePlaybackSpeed = {
  speed: 1.0,
  
  apply(speed) {
    this.speed = parseFloat(speed);
    const video = document.querySelector('video');
    if (video) {
      video.playbackRate = this.speed;
    }
  },

  init() {
    // Keep setting the speed whenever video elements load or play
    document.addEventListener('ratechange', (e) => {
      const video = e.target;
      if (video && video.tagName === 'VIDEO' && video.playbackRate !== this.speed) {
        // Only override if the difference is significant or it goes back to 1.0 automatically
        if (Math.abs(video.playbackRate - this.speed) > 0.01) {
          video.playbackRate = this.speed;
        }
      }
    }, true);

    document.addEventListener('play', (e) => {
      const video = e.target;
      if (video && video.tagName === 'VIDEO') {
        video.playbackRate = this.speed;
      }
    }, true);
  }
};
