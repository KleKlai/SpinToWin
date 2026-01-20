class SpinWheelWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {
      url: this.getAttribute('url') || 'https://yourdomain.com/embed',
      position: this.getAttribute('position') || 'bottom-right',
      color: this.getAttribute('color') || '#FF6B35',
      autoOpen: this.hasAttribute('auto-open'),
      delay: parseInt(this.getAttribute('delay')) || 3000,
      zIndex: parseInt(this.getAttribute('z-index')) || 999999,
      buttonText: this.getAttribute('button-text') || '🎡',
      widgetWidth: this.getAttribute('width') || '400px',
      widgetHeight: this.getAttribute('height') || '600px'
    };
    this.isLoading = false;
  }

  connectedCallback() {
    this.render();
    if (this.config.autoOpen) {
      setTimeout(() => this.openWidget(), this.config.delay);
    }
  }

  render() {
    const positionStyle = {
      'bottom-right': { right: '20px', bottom: '20px', widgetBottom: '90px', widgetRight: '20px' },
      'bottom-left': { left: '20px', bottom: '20px', widgetBottom: '90px', widgetLeft: '20px' },
      'top-right': { right: '20px', top: '20px', widgetTop: '90px', widgetRight: '20px' },
      'top-left': { left: '20px', top: '20px', widgetTop: '90px', widgetLeft: '20px' }
    };

    const pos = positionStyle[this.config.position] || positionStyle['bottom-right'];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --button-size: 60px;
          --widget-width: ${this.config.widgetWidth};
          --widget-height: ${this.config.widgetHeight};
          --z-index: ${this.config.zIndex};
          --primary-color: ${this.config.color};
          --secondary-color: ${this.getSecondaryColor(this.config.color)};
        }

        .widget-button {
          position: fixed;
          ${pos.right ? 'right: ' + pos.right + ';' : ''}
          ${pos.left ? 'left: ' + pos.left + ';' : ''}
          ${pos.bottom ? 'bottom: ' + pos.bottom + ';' : ''}
          ${pos.top ? 'top: ' + pos.top + ';' : ''}
          z-index: var(--z-index);
          width: var(--button-size);
          height: var(--button-size);
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .widget-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(0,0,0,0.4);
        }

        .widget-container {
          position: fixed;
          ${pos.widgetRight ? 'right: ' + pos.widgetRight + ';' : ''}
          ${pos.widgetLeft ? 'left: ' + pos.widgetLeft + ';' : ''}
          ${pos.widgetBottom ? 'bottom: ' + pos.widgetBottom + ';' : ''}
          ${pos.widgetTop ? 'top: ' + pos.widgetTop + ';' : ''}
          z-index: var(--z-index);
          width: var(--widget-width);
          height: var(--widget-height);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: none;
          border: 3px solid white;
          background: white;
          transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
          .widget-container {
            width: 95vw;
            height: 80vh;
            ${pos.right || pos.widgetRight ? 'right: 2.5vw;' : ''}
            ${pos.left || pos.widgetLeft ? 'left: 2.5vw;' : ''}
            ${pos.bottom || pos.widgetBottom ? 'bottom: 10vh;' : ''}
            ${pos.top || pos.widgetTop ? 'top: 10vh;' : ''}
          }
        }

        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: 2px solid #ddd;
          color: #333;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #ff4444;
          color: white;
          border-color: #ff4444;
        }

        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          z-index: 10;
        }

        .spinner {
          border: 4px solid rgba(255, 107, 53, 0.3);
          border-radius: 50%;
          border-top: 4px solid var(--primary-color);
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <button class="widget-button" id="toggleBtn">${this.config.buttonText}</button>
      
      <div class="widget-container" id="widgetContainer">
        <button class="close-button" id="closeBtn">×</button>
        <div class="loading-overlay" id="loadingOverlay">
          <div class="spinner"></div>
          <div>Loading...</div>
        </div>
        <iframe 
          id="wheelIframe" 
          src="${this.config.url}" 
          loading="lazy"
          onload="this.closest('spin-wheel-widget').shadowRoot.getElementById('loadingOverlay').style.display = 'none';"
        ></iframe>
      </div>
    `;

    this.bindEvents();
  }

  // ... rest of the component remains the same ...

  openWidget() {
    const container = this.shadowRoot.getElementById('widgetContainer');
    const button = this.shadowRoot.getElementById('toggleBtn');
    const iframe = this.shadowRoot.getElementById('wheelIframe');
    const loadingOverlay = this.shadowRoot.getElementById('loadingOverlay');
    
    container.style.display = 'block';
    button.style.display = 'none';
    loadingOverlay.style.display = 'flex';
    
    // Force iframe reload to reset state
    const currentSrc = iframe.src;
    iframe.src = '';
    setTimeout(() => {
      iframe.src = currentSrc;
    }, 100);
  }
}

customElements.define('spin-wheel-widget', SpinWheelWidget);