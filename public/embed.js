(function() {
  // Configuration
  const config = {
    widgetUrl: 'http://localhost:3000/embed',
    buttonColor: '#FF6B35',
    buttonText: '🎡 Spin to Win',
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    zIndex: 999999,
    buttonSize: '60px',
    widgetWidth: '400px',
    widgetHeight: '600px'
  };

  // Create floating button
  const button = document.createElement('button');
  button.id = 'spin-wheel-float-btn';
  button.innerHTML = config.buttonText;
  button.style.cssText = `
    position: fixed;
    ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
    z-index: ${config.zIndex};
    width: ${config.buttonSize};
    height: ${config.buttonSize};
    border-radius: 50%;
    background: linear-gradient(135deg, ${config.buttonColor}, #FF8E53);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;

  button.onmouseover = () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
  };

  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  };

  // Create widget container
  const container = document.createElement('div');
  container.id = 'spin-wheel-widget';
  container.style.cssText = `
    position: fixed;
    ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
    ${config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
    z-index: ${config.zIndex};
    width: ${config.widgetWidth};
    height: ${config.widgetHeight};
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    display: none;
    border: 3px solid white;
    background: white;
  `;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'spin-wheel-iframe';
  iframe.src = config.widgetUrl;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    margin: 0;
    padding: 0;
  `;
  iframe.allow = "clipboard-write";

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
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
  `;

  closeBtn.onmouseover = () => {
    closeBtn.style.background = '#ff4444';
    closeBtn.style.color = 'white';
    closeBtn.style.borderColor = '#ff4444';
  };

  closeBtn.onmouseout = () => {
    closeBtn.style.background = 'rgba(255,255,255,0.9)';
    closeBtn.style.color = '#333';
    closeBtn.style.borderColor = '#ddd';
  };

  closeBtn.onclick = () => {
    container.style.display = 'none';
    button.style.display = 'flex';
  };

  // Toggle widget
  button.onclick = () => {
    if (container.style.display === 'block') {
      container.style.display = 'none';
    } else {
      container.style.display = 'block';
      button.style.display = 'none';
      // Refresh iframe to reset state
      iframe.src = iframe.src;
    }
  };

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (container.style.display === 'block' && 
        !container.contains(e.target) && 
        !button.contains(e.target)) {
      container.style.display = 'none';
      button.style.display = 'flex';
    }
  });

  // Append elements
  container.appendChild(closeBtn);
  container.appendChild(iframe);
  document.body.appendChild(button);
  document.body.appendChild(container);

  // Optional: Auto-open on page load after delay
  // setTimeout(() => {
  //   button.click();
  // }, 3000);

  console.log('Spin Wheel Widget loaded successfully!');
})();