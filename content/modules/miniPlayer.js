// OverTube Sticky Mini Player Module
window.OverTubeMiniPlayer = {
  enabled: false,
  isDocked: false,
  isClosed: false,
  wrapper: null,
  placeholder: null,
  originalParent: null,
  originalNextSibling: null,
  
  init() {
    this.createWrapper();
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
  },

  apply(enabled) {
    this.enabled = enabled;
    if (!enabled && this.isDocked) {
      this.undock();
    }
  },

  createWrapper() {
    if (this.wrapper) return;

    // Create floating wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'ot-mini-player-wrapper';
    this.wrapper.style.display = 'none';

    // Header & controls
    const header = document.createElement('div');
    header.className = 'ot-mini-header';

    const title = document.createElement('span');
    title.className = 'ot-mini-title';
    title.textContent = 'OverTube Mini Player';

    const controls = document.createElement('div');
    controls.className = 'ot-mini-controls';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'ot-mini-btn ot-mini-btn-reset';
    resetBtn.innerHTML = '⟲';
    resetBtn.title = 'Reset Position';
    resetBtn.onclick = () => this.resetPosition();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ot-mini-btn ot-mini-btn-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';
    closeBtn.onclick = () => {
      this.isClosed = true;
      this.undock();
    };

    controls.appendChild(resetBtn);
    controls.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(controls);
    this.wrapper.appendChild(header);
    document.body.appendChild(this.wrapper);

    // Setup dragging
    this.setupDragging(header);
  },

  handleScroll() {
    if (!this.enabled) return;

    const moviePlayer = document.getElementById('movie-player') || document.querySelector('.html5-video-player');
    const playerContainer = document.getElementById('player-container') || document.getElementById('player');
    
    if (!moviePlayer || !playerContainer) return;

    // If not on watch page, undock
    if (!window.location.pathname.startsWith('/watch')) {
      if (this.isDocked) this.undock();
      return;
    }

    const containerRect = playerContainer.getBoundingClientRect();
    const scrollThreshold = containerRect.bottom + window.scrollY;

    if (window.scrollY > scrollThreshold) {
      if (!this.isDocked && !this.isClosed) {
        this.dock(moviePlayer, playerContainer);
      }
    } else {
      if (this.isDocked) {
        this.undock(moviePlayer);
        // Reset closed status if scrolled back up to the top
        this.isClosed = false;
      }
    }
  },

  dock(moviePlayer, playerContainer) {
    this.isDocked = true;
    this.originalParent = moviePlayer.parentNode;
    this.originalNextSibling = moviePlayer.nextSibling;

    // Create layout placeholder so the page layout doesn't collapse
    if (!this.placeholder) {
      this.placeholder = document.createElement('div');
      this.placeholder.style.width = playerContainer.offsetWidth + 'px';
      this.placeholder.style.height = playerContainer.offsetHeight + 'px';
      this.placeholder.style.visibility = 'hidden';
      this.placeholder.id = 'ot-player-placeholder';
    }
    
    playerContainer.appendChild(this.placeholder);

    // Float player
    this.wrapper.style.display = 'block';
    this.wrapper.appendChild(moviePlayer);
    moviePlayer.classList.add('ot-player-docked');

    // Trigger window resize to force player layout recalculation
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  },

  undock() {
    const moviePlayer = document.getElementById('movie-player') || document.querySelector('.html5-video-player');
    if (!moviePlayer || !this.isDocked) return;

    this.isDocked = false;
    this.wrapper.style.display = 'none';

    // Remove docking class
    moviePlayer.classList.remove('ot-player-docked');

    // Put moviePlayer back in its original spot
    if (this.originalParent) {
      this.originalParent.insertBefore(moviePlayer, this.originalNextSibling);
    }

    // Remove placeholder
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }

    // Trigger window resize to force player layout recalculation
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  },

  resetPosition() {
    if (this.wrapper) {
      this.wrapper.style.top = '';
      this.wrapper.style.left = '';
      this.wrapper.style.bottom = '24px';
      this.wrapper.style.right = '24px';
    }
  },

  setupDragging(dragHandle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    dragHandle.onmousedown = (e) => {
      e.preventDefault();
      // Get the mouse cursor position at startup
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e.preventDefault();
      // Calculate the new cursor position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      // Set the element's new position
      const newTop = this.wrapper.offsetTop - pos2;
      const newLeft = this.wrapper.offsetLeft - pos1;

      // Restrict drag boundaries to the viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = this.wrapper.getBoundingClientRect();

      if (newTop >= 0 && newTop + rect.height <= viewportHeight) {
        this.wrapper.style.top = newTop + "px";
        this.wrapper.style.bottom = "auto";
      }
      if (newLeft >= 0 && newLeft + rect.width <= viewportWidth) {
        this.wrapper.style.left = newLeft + "px";
        this.wrapper.style.right = "auto";
      }
    };

    function closeDragElement() {
      // Stop moving when mouse button is released
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
};
