(function() {
  'use strict';

  // Chart implementation using DexScreener
  class OppoChart {
    constructor() {
      this.currentMint = null;
      this.chartContainer = null;
      this.iframe = null;
      this.init();
    }

    init() {
      this.chartContainer = document.getElementById('dex-chart');
      if (!this.chartContainer) {
        console.warn('Chart container not found');
        return;
      }
      
      // Set initial token from data attribute
      const initialToken = this.chartContainer.getAttribute('data-token-query');
      if (initialToken) {
        this.setMint(initialToken);
      }
    }

    setMint(mint) {
      if (!mint || mint === this.currentMint) {
        return;
      }

      console.log('Chart: Updating to token', mint);
      this.currentMint = mint;
      this.updateChart(mint);
    }

    updateChart(mint) {
      if (!this.chartContainer) {
        return;
      }

      // Remove existing iframe if any
      if (this.iframe) {
        this.iframe.remove();
        this.iframe = null;
      }

      // Show loading state
      this.showLoading();

      // Create new iframe with DexScreener chart
      const iframe = document.createElement('iframe');
      iframe.className = 'chart-iframe';
      iframe.src = `https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0`;
      iframe.loading = 'lazy';
      iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
      
      // Set timeout for loading
      let loadTimeout;
      let hasLoaded = false;

      const handleLoad = () => {
        if (!hasLoaded) {
          hasLoaded = true;
          clearTimeout(loadTimeout);
          this.hideLoading();
          this.showTokenInfo(mint);
        }
      };

      const handleError = () => {
        if (!hasLoaded) {
          hasLoaded = true;
          clearTimeout(loadTimeout);
          this.showFallbackChart(mint);
        }
      };

      // Add event listeners
      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      // Set timeout as fallback - reduced to 3 seconds for faster fallback
      loadTimeout = setTimeout(() => {
        if (!hasLoaded) {
          console.log('Chart iframe loading timeout, showing fallback');
          handleError();
        }
      }, 3000);

      this.iframe = iframe;
      this.chartContainer.appendChild(iframe);

      // Additional check for blocked content after a short delay
      setTimeout(() => {
        if (!hasLoaded && this.iframe) {
          try {
            // Try to access iframe content to detect if it's blocked
            const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
            if (!iframeDoc || iframeDoc.body.innerHTML.includes('blocked')) {
              handleError();
            }
          } catch (e) {
            // If we can't access iframe content, it might be blocked
            console.log('Chart iframe access blocked, showing fallback');
            handleError();
          }
        }
      }, 1500);

      // Update data attribute
      this.chartContainer.setAttribute('data-token-query', mint);
    }

    showLoading() {
      const placeholder = this.chartContainer.querySelector('.chart-placeholder');
      if (placeholder) {
        placeholder.textContent = 'Grafik yükleniyor...';
        placeholder.style.display = 'flex';
      }
    }

    hideLoading() {
      const placeholder = this.chartContainer.querySelector('.chart-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    }

    showError(message) {
      const placeholder = this.chartContainer.querySelector('.chart-placeholder');
      if (placeholder) {
        placeholder.textContent = message;
        placeholder.className = 'chart-error';
        placeholder.style.display = 'flex';
      }
    }

    showFallbackChart(mint) {
      // Create a fallback display when iframe fails to load
      const placeholder = this.chartContainer.querySelector('.chart-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="margin-bottom: 10px; color: rgb(var(--jupiter-plugin-primary-text));">
              📈 Token Chart
            </div>
            <div style="font-family: monospace; font-size: 12px; color: rgba(var(--jupiter-plugin-primary-text), 0.7); margin-bottom: 15px;">
              ${mint}
            </div>
            <a href="https://dexscreener.com/solana/${mint}" target="_blank" rel="noopener" 
               style="color: rgb(var(--jupiter-plugin-primary)); text-decoration: none; padding: 8px 16px; border: 1px solid rgb(var(--jupiter-plugin-primary)); border-radius: 6px; display: inline-block;">
              DexScreener'da Görüntüle →
            </a>
          </div>
        `;
        placeholder.style.display = 'flex';
        placeholder.style.flexDirection = 'column';
        placeholder.style.justifyContent = 'center';
      }
      this.showTokenInfo(mint);
    }

    showTokenInfo(mint) {
      // Remove existing token info
      const existingInfo = this.chartContainer.querySelector('.chart-token-info');
      if (existingInfo) {
        existingInfo.remove();
      }

      // Create new token info
      const tokenInfo = document.createElement('div');
      tokenInfo.className = 'chart-token-info';
      tokenInfo.textContent = mint.substring(0, 8) + '...';
      tokenInfo.title = mint;
      this.chartContainer.appendChild(tokenInfo);
    }

    getCurrentMint() {
      return this.currentMint;
    }
  }

  // Initialize chart when DOM is ready
  function initChart() {
    if (window.OppoChart) {
      return; // Already initialized
    }
    
    window.OppoChart = new OppoChart();
    console.log('OppoChart initialized');
  }

  // Initialize immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart);
  } else {
    initChart();
  }

})();