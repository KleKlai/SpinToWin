// Spin & Win Widget Embed Script
(function() {
  'use strict';

  // Configuration
  const config = {
    widgetUrl: 'https://your-nextjs-app.vercel.app/embed',
    buttonText: '🎡 Spin & Win!',
    buttonColor: 'linear-gradient(135deg, #f97316, #dc2626)',
    buttonPosition: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
    zIndex: 9998,
  };

  // Get script config from data attributes
  const script = document.currentScript;
  if (script) {
    config.widgetUrl = script.getAttribute('data-widget-url') || config.widgetUrl;
    config.buttonText = script.getAttribute('data-button-text') || config.buttonText;
    config.buttonColor = script.getAttribute('data-button-color') || config.buttonColor;
    config.buttonPosition = script.getAttribute('data-button-position') || config.buttonPosition;
  }

  // Create unique IDs
  const widgetId = 'spin-wheel-widget-' + Math.random().toString(36).substr(2, 9);
  const buttonId = widgetId + '-button';
  const modalId = widgetId + '-modal';

  // Create floating button
  const button = document.createElement('button');
  button.id = buttonId;
  button.innerHTML = config.buttonText;
  button.setAttribute('aria-label', 'Open Spin & Win Game');
  
  // Set button position based on config
  const positionStyles = {
    'bottom-right': `
      position: fixed;
      bottom: 20px;
      right: 20px;
    `,
    'bottom-left': `
      position: fixed;
      bottom: 20px;
      left: 20px;
    `,
    'top-right': `
      position: fixed;
      top: 20px;
      right: 20px;
    `,
    'top-left': `
      position: fixed;
      top: 20px;
      left: 20px;
    `,
  };

  button.style.cssText = `
    ${positionStyles[config.buttonPosition] || positionStyles['bottom-right']}
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
    animation: fadeIn 0.3s ease;
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
  `;

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(20px) scale(0.9);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  modal.appendChild(iframe);
  document.head.appendChild(style);
  document.body.appendChild(button);
  document.body.appendChild(modal);

  // Open modal function
  function openModal() {
    modal.style.display = 'flex';
    iframe.src = config.widgetUrl;
    document.body.style.overflow = 'hidden';
    
    // Add animation class
    iframe.style.animation = 'slideIn 0.3s ease';
  }

  // Close modal function
  function closeModal() {
    modal.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      modal.style.display = 'none';
      iframe.src = '';
      document.body.style.overflow = 'auto';
      modal.style.animation = '';
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

  // Handle iframe messages (for future enhancements)
  window.addEventListener('message', (e) => {
    if (e.data === 'CLOSE_SPIN_WHEEL') {
      closeModal();
    }
  });

  // Make button draggable on desktop
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  button.addEventListener('mousedown', dragStart);
  button.addEventListener('mouseup', dragEnd);
  button.addEventListener('mousemove', drag);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === button) {
      isDragging = true;
      button.style.cursor = 'grabbing';
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    button.style.cursor = 'pointer';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      xOffset = currentX;
      yOffset = currentY;
      
      setTranslate(currentX, currentY, button);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // Touch support for mobile
  button.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    dragStart(touch);
  }, { passive: true });

  button.addEventListener('touchend', dragEnd);
  button.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    drag(touch);
  }, { passive: true });

  // Initialize
  console.log('Spin & Win Widget loaded successfully!');
})();