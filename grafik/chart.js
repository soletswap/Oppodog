(function () {
  'use strict';

  const CONTAINER_ID = 'dex-chart';
  const BASE = 'https://dexscreener.com';
  const CHAIN = 'solana';
  const EMBED_QUERY = 'embed=1&theme=dark&trades=0&info=0&interval=15';
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const DEFAULT_MINT = 'HEadEtLjAFBGqAweLESUR2Qcjoc3U8ekQNvSUSH17gJz'; // OPPO

  let currentMint = null;
  let iframeEl = null;

  function ensureMount() {
    return document.getElementById(CONTAINER_ID);
  }

  function isValidMint(str) {
    return typeof str === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
  }

  function renderPlaceholder(textOrHtml, extraClass, asHtml) {
    const el = document.createElement('div');
    el.className = `chart-placeholder${extraClass ? ' ' + extraClass : ''}`;
    if (asHtml) el.innerHTML = textOrHtml;
    else el.textContent = textOrHtml || 'Grafik yükleniyor…';
    return el;
  }

  function showTokenInfo(mount, mint) {
    const prev = mount.querySelector('.chart-token-info');
    if (prev) prev.remove();
    const el = document.createElement('div');
    el.className = 'chart-token-info';
    el.textContent = `${mint.slice(0, 8)}…`;
    el.title = mint;
    mount.appendChild(el);
  }

  function buildCandidateUrls(mint) {
    return [
      `${BASE}/${CHAIN}/tokens/${mint}?${EMBED_QUERY}`,
      `${BASE}/${CHAIN}/${mint}?${EMBED_QUERY}`,
    ];
  }

  function setIframeSrcWithFallback(iframe, urls, onSuccess, onExhausted) {
    let idx = 0;
    let triedAtLeastOne = false;

    function tryNext() {
      if (idx >= urls.length) {
        if (triedAtLeastOne) onExhausted?.();
        return;
      }
      iframe.src = urls[idx++];
      triedAtLeastOne = true;
    }

    iframe.addEventListener('load', () => onSuccess?.());
    iframe.addEventListener('error', () => tryNext());

    tryNext();
  }

  function setMint(mint) {
    const mount = ensureMount();
    if (!mount) return;

    if (!isValidMint(mint)) {
      mount.innerHTML = '';
      mount.appendChild(renderPlaceholder('Geçersiz token adresi', 'chart-error'));
      return;
    }
    if (mint === currentMint && iframeEl) return;

    currentMint = mint;

    mount.innerHTML = '';
    const placeholder = renderPlaceholder('Grafik yükleniyor…');
    mount.appendChild(placeholder);

    const iframe = document.createElement('iframe');
    iframe.className = 'chart-iframe';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

    let loaded = false;
    const urls = buildCandidateUrls(mint);

    const finishSuccess = () => {
      if (loaded) return;
      loaded = true;
      placeholder.remove?.();
      showTokenInfo(mount, mint);
    };

    const finishFail = () => {
      if (loaded) return;
      loaded = true;
      const html = `
        <div style="text-align:center; padding: 12px;">
          <div style="margin-bottom: 8px;">Grafik yüklenemedi.</div>
          <div style="font-family: monospace; font-size: 12px; opacity: .8; margin-bottom: 12px;">${mint}</div>
          <a href="${BASE}/${CHAIN}/${mint}" target="_blank" rel="noopener"
             style="color: #8ab4ff; text-decoration: none; border: 1px solid rgba(255,255,255,.2); padding: 6px 10px; border-radius: 6px; display: inline-block;">
            DexScreener’da görüntüle →
          </a>
        </div>
      `;
      mount.innerHTML = '';
      mount.appendChild(renderPlaceholder(html, 'chart-error', true));
      showTokenInfo(mount, mint);
    };

    setIframeSrcWithFallback(iframe, urls, finishSuccess, finishFail);
    mount.appendChild(iframe);
    iframeEl = iframe;

    const timeoutId = setTimeout(() => {
      if (!loaded) finishFail();
    }, 3000);

    setTimeout(() => {
      if (loaded) return;
      try {
        void iframe.contentWindow?.document;
      } catch {
        finishFail();
      } finally {
        clearTimeout(timeoutId);
      }
    }, 1500);
  }

  function getMint() {
    return currentMint;
  }

  window.addEventListener('message', (event) => {
    try {
      if (typeof event.origin !== 'string' || !event.origin.includes('jup.ag')) return;
      const d = event.data;
      if (!d || typeof d !== 'object') return;

      const outputs = [
        d.outputMint,
        d.outMint,
        d.destinationMint,
        d?.form?.outputMint,
        d?.state?.outputMint,
        d?.state?.form?.outputMint,
        d?.formValues?.outputMint,
        d?.state?.formValues?.outputMint,
      ].filter(Boolean);

      const inputs = [
        d.inputMint,
        d.inMint,
        d.sourceMint,
        d.fromMint,
        d?.form?.inputMint,
        d?.state?.inputMint,
        d?.state?.form?.inputMint,
        d?.formValues?.inputMint,
        d?.state?.formValues?.inputMint,
      ].filter(Boolean);

      const all = [...outputs, ...inputs];

      let chosen = '';
      for (const cand of all) {
        const s = String(cand || '');
        if (isValidMint(s) && s !== SOL_MINT) {
          chosen = s;
          break;
        }
      }
      if (!chosen) {
        for (const cand of all) {
          const s = String(cand || '');
          if (isValidMint(s)) {
            chosen = s;
            break;
          }
        }
      }
      if (chosen) setMint(chosen);
    } catch {}
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const mount = ensureMount();
      if (mount) setMint(DEFAULT_MINT);
    });
  } else {
    const mount = ensureMount();
    if (mount) setMint(DEFAULT_MINT);
  }

  window.OppoChart = { setMint, getMint };
})();
