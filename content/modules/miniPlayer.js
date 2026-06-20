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

    // Setup dragging & resizing
    this.setupDraggingAndResizing();
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
      this.wrapper.style.width = '320px';
      this.wrapper.style.height = '180px';
      this.wrapper.style.bottom = '24px';
      this.wrapper.style.right = '24px';
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  },

  setupDraggingAndResizing() {
    let activeDrag = false;
    let activeResize = false;
    let resizeDir = '';
    
    let startX, startY;
    let startWidth, startHeight;
    let startLeft, startTop;
    this.dragMoved = false;

    // Create 4 corner resize handles
    const dirs = ['tl', 'tr', 'bl', 'br'];
    dirs.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `ot-resize-handle ot-resize-${dir}`;
      handle.dataset.dir = dir;
      this.wrapper.appendChild(handle);

      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        activeResize = true;
        resizeDir = dir;
        
        startX = e.clientX;
        startY = e.clientY;
        startWidth = this.wrapper.offsetWidth;
        startHeight = this.wrapper.offsetHeight;
        
        const rect = this.wrapper.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
      });
    });

    // Capture-phase filtering: if dragged, prevent events from bubbling to player
    const preventIfDragged = (e) => {
      if (this.dragMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    this.wrapper.addEventListener('click', preventIfDragged, true);
    this.wrapper.addEventListener('mouseup', preventIfDragged, true);
    this.wrapper.addEventListener('pointerup', preventIfDragged, true);

    // Draggable center (entire wrapper)
    this.wrapper.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking mini buttons or resize handles
      if (e.target.closest('.ot-mini-btn') || e.target.closest('.ot-resize-handle')) {
        return;
      }

      activeDrag = true;
      this.dragMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.wrapper.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    });

    const handlePointerMove = (e) => {
      if (activeResize) {
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newWidth = startWidth;

        if (resizeDir === 'br') {
          newWidth = startWidth + dx;
        } else if (resizeDir === 'bl') {
          newWidth = startWidth - dx;
        } else if (resizeDir === 'tr') {
          newWidth = startWidth + dx;
        } else if (resizeDir === 'tl') {
          newWidth = startWidth - dx;
        }

        newWidth = Math.max(200, Math.min(800, newWidth));
        const newHeight = Math.round(newWidth * 9 / 16);

        this.wrapper.style.width = newWidth + 'px';
        this.wrapper.style.height = newHeight + 'px';

        if (resizeDir === 'tl') {
          this.wrapper.style.left = (startLeft + (startWidth - newWidth)) + 'px';
          this.wrapper.style.top = (startTop + (startHeight - newHeight)) + 'px';
        } else if (resizeDir === 'bl') {
          this.wrapper.style.left = (startLeft + (startWidth - newWidth)) + 'px';
        } else if (resizeDir === 'tr') {
          this.wrapper.style.top = (startTop + (startHeight - newHeight)) + 'px';
        }
        
        this.wrapper.style.bottom = 'auto';
        this.wrapper.style.right = 'auto';

        window.dispatchEvent(new Event('resize'));
      }

      if (activeDrag) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          this.dragMoved = true;
        }

        if (this.dragMoved) {
          e.preventDefault();
          let newTop = startTop + dy;
          let newLeft = startLeft + dx;

          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const rect = this.wrapper.getBoundingClientRect();

          newTop = Math.max(0, Math.min(viewportHeight - rect.height, newTop));
          newLeft = Math.max(0, Math.min(viewportWidth - rect.width, newLeft));

          this.wrapper.style.top = newTop + "px";
          this.wrapper.style.left = newLeft + "px";
          this.wrapper.style.bottom = "auto";
          this.wrapper.style.right = "auto";
        }
      }
    };

    const handlePointerUp = (e) => {
      if (activeDrag) {
        activeDrag = false;
      }
      activeResize = false;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      // Delay resetting dragMoved slightly to let click/mouseup capture listeners intercept events
      setTimeout(() => {
        this.dragMoved = false;
      }, 50);
    };
  }
};
