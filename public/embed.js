// Spin & Win Widget Embed Script
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    console.log('Initializing Spin & Win Widget...');
    
    // Configuration
    const config = {
      widgetUrl: 'https://spin-to-win-git-main-maynard-magallens-projects.vercel.app/embed',
      buttonText: '🎡 Spin & Win!',
      buttonColor: '#f97316',
      buttonPosition: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
      zIndex: 9998,
      debug: true
    };

    // Get script config from data attributes
    const script = document.currentScript || 
                   document.querySelector('script[src*="embed.js"]');
    
    if (script) {
      console.log('Script element found:', script);
      config.widgetUrl = script.getAttribute('data-widget-url') || config.widgetUrl;
      config.buttonText = script.getAttribute('data-button-text') || config.buttonText;
      config.buttonColor = script.getAttribute('data-button-color') || config.buttonColor;
      config.buttonPosition = script.getAttribute('data-button-position') || config.buttonPosition;
    }

    console.log('Widget config:', config);

    // Check if widget already exists
    if (document.getElementById('spin-wheel-widget-button')) {
      console.log('Widget already exists, skipping initialization');
      return;
    }

    // Create unique IDs
    const widgetId = 'spin-wheel-widget-' + Date.now();
    const buttonId = widgetId + '-button';
    const modalId = widgetId + '-modal';

    // Create floating button
    const button = document.createElement('button');
    button.id = buttonId;
    button.innerHTML = config.buttonText;
    button.setAttribute('aria-label', 'Open Spin & Win Game');
    button.setAttribute('type', 'button');
    
    // Set button position based on config
    const positionStyles = {
      'bottom-right': {
        bottom: '20px',
        right: '20px',
        left: 'auto',
        top: 'auto'
      },
      'bottom-left': {
        bottom: '20px',
        left: '20px',
        right: 'auto',
        top: 'auto'
      },
      'top-right': {
        top: '20px',
        right: '20px',
        left: 'auto',
        bottom: 'auto'
      },
      'top-left': {
        top: '20px',
        left: '20px',
        right: 'auto',
        bottom: 'auto'
      },
    };

    const position = positionStyles[config.buttonPosition] || positionStyles['bottom-right'];
    
    button.style.cssText = `
      position: fixed;
      bottom: ${position.bottom || 'auto'};
      right: ${position.right || 'auto'};
      top: ${position.top || 'auto'};
      left: ${position.left || 'auto'};
      background: ${config.buttonColor};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: bold;
      cursor: pointer;
      z-index: ${config.zIndex};
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    `;

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 25px rgba(0,0,0,0.3)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
    });

    // Create iframe container
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: ${config.zIndex + 1};
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      width: 95%;
      max-width: 550px;
      height: 90vh;
      max-height: 750px;
      border: none;
      border-radius: 20px;
      background: white;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;

    modal.appendChild(iframe);
    document.head.appendChild(style);
    document.body.appendChild(button);
    document.body.appendChild(modal);

    console.log('Widget elements created:', { buttonId, modalId });

    // Open modal function
    function openModal() {
      console.log('Opening modal...');
      modal.style.display = 'flex';
      setTimeout(() => {
        modal.style.opacity = '1';
        iframe.src = config.widgetUrl;
        setTimeout(() => {
          iframe.style.opacity = '1';
          iframe.style.transform = 'translateY(0)';
        }, 50);
      }, 10);
      document.body.style.overflow = 'hidden';
    }

    // Close modal function
    function closeModal() {
      console.log('Closing modal...');
      modal.style.opacity = '0';
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px)';
      setTimeout(() => {
        modal.style.display = 'none';
        iframe.src = '';
        document.body.style.overflow = 'auto';
      }, 300);
    }

    // Event Listeners
    button.addEventListener('click', openModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });

    // Handle iframe messages
    window.addEventListener('message', (e) => {
      console.log('Received message:', e.data);
      if (e.data === 'CLOSE_SPIN_WHEEL' || e.data === 'EMBED_CLOSED') {
        closeModal();
      }
    });

    console.log('Spin & Win Widget loaded successfully!');
  }
})();