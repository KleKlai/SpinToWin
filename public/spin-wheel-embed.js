// public/spin-wheel-embed.js
class SpinWheelEmbed extends HTMLElement {
  static get observedAttributes() {
    return ['delay', 'prizes', 'compact', 'src-base'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.iframe = null;
    this.overlay = null;
    this.closeBtn = null;
    this.modalContainer = null;
  }

  connectedCallback() {
    this.render();
    this.startAutoShow();
    this.listenForMessages();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) this.render();
  }

  getConfig() {
    const base = this.getAttribute('src-base') || window.location.origin;
    return {
      delay: parseInt(this.getAttribute('delay') || '5000', 10),
      compact: this.getAttribute('compact') !== 'false',
      prizes: this.getAttribute('prizes') || '',
      srcBase: base.endsWith('/') ? base.slice(0, -1) : base,
    };
  }

  render() {
    const config = this.getConfig();

    let prizesParam = '';
    if (config.prizes) {
      try {
        JSON.parse(config.prizes);
        prizesParam = `&prizes=${encodeURIComponent(config.prizes)}`;
      } catch (err) {
        console.warn('Invalid prizes JSON → using default', err);
      }
    }

    const src = `${config.srcBase}/embed/spin-wheel?embedded=true&compact=${config.compact}${prizesParam}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          pointer-events: none;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: auto;
        }

        .overlay.visible {
          opacity: 1;
        }

        .modal-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .modal-container.visible {
          opacity: 1;
        }

        .content-wrapper {
          position: relative;
          width: 100%;
          max-width: 640px;
          pointer-events: auto;
        }

        iframe {
          width: 100%;
          height: min(780px, 88vh);
          border: none;
          border-radius: 16px;
          box-shadow: 0 25px 80px -15px rgba(0,0,0,0.6);
          background: white;
        }

        .close-btn {
          position: absolute;
          top: -16px;
          right: -16px;
          width: 40px;
          height: 40px;
          background: white;
          color: #1f2937;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: all 0.2s;
          z-index: 10;
          border: 2px solid #e5e7eb;
        }

        .close-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }
      </style>

      <div class="overlay" id="overlay"></div>

      <div class="modal-container" id="modalContainer">
        <div class="content-wrapper">
          <button class="close-btn" id="closeBtn" aria-label="Close spin wheel">×</button>
          <iframe
            id="spin-iframe"
            src="${src}"
            allowtransparency="true"
          ></iframe>
        </div>
      </div>
    `;

    this.overlay = this.shadowRoot.querySelector('#overlay');
    this.modalContainer = this.shadowRoot.querySelector('#modalContainer');
    this.closeBtn = this.shadowRoot.querySelector('#closeBtn');
    this.iframe = this.shadowRoot.querySelector('#spin-iframe');

    // Close button click handler
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeWheel());
    }
  }

  startAutoShow() {
    const { delay } = this.getConfig();

    setTimeout(() => {
      if (this.overlay) this.overlay.classList.add('visible');
      if (this.modalContainer) this.modalContainer.classList.add('visible');
    }, delay);
  }

  closeWheel() {
    if (this.overlay) this.overlay.classList.remove('visible');
    if (this.modalContainer) this.modalContainer.classList.remove('visible');

    // Give time for fade-out animation, then notify parent
    setTimeout(() => {
      window.parent.postMessage({ type: 'spin-wheel-close' }, '*');
    }, 450);
  }

  listenForMessages() {
    const handler = (e) => {
      if (e.data?.type === 'spin-wheel-close') {
        this.closeWheel();
      }
    };

    window.addEventListener('message', handler);
    this.addEventListener('disconnected', () => {
      window.removeEventListener('message', handler);
    });
  }
}

customElements.define('spin-wheel', SpinWheelEmbed);