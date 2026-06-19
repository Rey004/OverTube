// OverTube Audio Booster Module
window.OverTubeAudioBooster = {
  audioCtx: null,
  source: null,
  gainNode: null,
  compressor: null,
  boostLevel: 100, // 100% to 500%
  activeVideo: null,

  initAudio(video) {
    if (this.activeVideo === video) return;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioCtx.createGain();
        this.compressor = this.audioCtx.createDynamicsCompressor();

        // Compressor settings to prevent clipping
        this.compressor.threshold.setValueAtTime(-12, this.audioCtx.currentTime); // dB
        this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime); // Secs
        this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime); // Secs

        this.gainNode.connect(this.compressor);
        this.compressor.connect(this.audioCtx.destination);
      }

      // Disconnect previous source if any
      if (this.source) {
        try {
          this.source.disconnect();
        } catch (e) {}
      }

      // Create node chain for new video
      this.source = this.audioCtx.createMediaElementSource(video);
      this.source.connect(this.gainNode);
      this.activeVideo = video;
    } catch (e) {
      console.warn("OverTube Audio Booster initialization failed:", e);
    }
  },

  apply(boost) {
    this.boostLevel = parseInt(boost);
    const video = document.querySelector('video');
    if (!video) return;

    // Initialize audio context or rebind if video element changed
    this.initAudio(video);

    // Apply Gain (100% boost is gain value 1.0, 500% is 5.0)
    const gainValue = this.boostLevel / 100;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
      
      // Resume audio context if suspended (common browser security policy)
      if (this.audioCtx.state === 'suspended') {
        const resumeCtx = () => {
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
        };
        video.addEventListener('play', resumeCtx, { once: true });
        video.addEventListener('playing', resumeCtx, { once: true });
        // Try resuming directly in case user already interacted
        this.audioCtx.resume();
      }
    }
  }
};
