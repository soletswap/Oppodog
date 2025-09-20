(function () {
  'use strict';

  const CONTAINER_ID = 'dex-chart';
  const BASE = 'https://dexscreener.com';
  const CHAIN = 'solana';
  const API = 'https://api.dexscreener.com/latest/dex/tokens/';
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

  // DexScreener API’den mint’e ait en iyi pair’i çözüp URL önceliğine ekler.
  async function resolveCandidateUrls(mint) {
    // Varsayılan denenecek yollar
    const urls = [
      `${BASE}/${CHAIN}/tokens/${mint}?${EMBED_QUERY}`,
      `${BASE}/${CHAIN}/${mint}?${EMBED_QUERY}`,
      `${BASE}/${CHAIN}?${EMBED_QUERY}&q=${encodeURIComponent(mint)}`, // en sonda arama sayfası
    ];

    try {
      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 1800);
      const resp = await fetch(`${API}${mint}`, { signal: ac.signal, cache: 'no-store' });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        const pairs = Array.isArray(data?.pairs) ? data.pairs : [];

        if (pairs.length) {
          // En iyi pair’i seç: yüksek likidite, yüksek 24h hacim ve USDC/USDT önceliği
          const scored = pairs
            .map(p => {
              const liq = Number(p?.liquidity?.usd || 0);
              const vol = Number(p?.volume?.h24 || 0);
              const quote = String(p?.quoteToken?.symbol || '').toUpperCase();
              const isStable = quote === 'USDC' || quote === 'USDT';
              const baseMatch = String(p?.baseToken?.address || '') === mint;
              // Skor: likidite ağırlıklı + hacim, stable ve baseMatch bonus
              const score = liq * 10 + vol + (isStable ? 5_000 : 0) + (baseMatch ? 2_500 : 0);
              const pairAddress =
                p?.pairAddress ||
                p?.pairId ||
                (typeof p?.url === 'string' ? p.url.split('/').pop() : '');
              return { score, pairAddress };
            })
            .filter(x => !!x.pairAddress)
            .sort((a, b) => b.score - a.score);

          if (scored.length) {
            const pairAddress = scored[0].pairAddress;
            // Pair sayfasını en üste al
            urls.unshift(`${BASE}/${CHAIN}/${pairAddress}?${EMBED_QUERY}`);
          }
        }
      }
    } catch {
      // Sessiz geç (zaman aşımı veya ağ hatası)
    }

    // Aynı URL’in iki kez eklenmiş olmasını önle
    const seen = new Set();
    return urls.filter(u => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  }

  function setIframeSrcWithFallback(iframe, urls, onSuccess, onExhausted) {
    let idx = 0;
    let loaded = false;

    function tryNext() {
      if (loaded) return;
      if (idx >= urls.length) {
        onExhausted?.();
        return;
      }
      iframe.src = urls[idx++];
    }

    iframe.addEventListener('load', () => {
      if (loaded) return;
      // DexScreener 404 bile olsa "load" tetiklenir; bu yüzden ilk URL başarısız olursa
      // genellikle API ile eklediğimiz pair URL’i doğru çalışacağından burada başarılı sayıyoruz.
      loaded = true;
      onSuccess?.();
    });

    iframe.addEventListener('error', () => {
      // Nadir de olsa hata event’i olursa sıradaki URL’e geç
      tryNext();
    });

    tryNext();

    // Çok uzun sürerse sıradaki URL’lere geç (güvenlik ağı)
    const softTmo = setTimeout(() => {
      if (!loaded) tryNext();
    }, 1800);

    const hardTmo = setTimeout(() => {
      if (!loaded) onExhausted?.();
      clearTimeout(softTmo);
    }, 4000);

    // Başarılı olduğumuzda zamanlayıcıları temizle
    iframe.addEventListener('load', () => {
      clearTimeout(softTmo);
      clearTimeout(hardTmo);
    });
  }

  async function setMint(mint) {
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
          <a href="${BASE}/${CHAIN}?q=${encodeURIComponent(mint)}" target="_blank" rel="noopener"
             style="color: #8ab4ff; text-decoration: none; border: 1px solid rgba(255,255,255,.2); padding: 6px 10px; border-radius: 6px; display: inline-block;">
            DexScreener’da ara →
          </a>
        </div>
      `;
      mount.innerHTML = '';
      mount.appendChild(renderPlaceholder(html, 'chart-error', true));
      showTokenInfo(mount, mint);
    };

    // URL’leri API’den (varsa pair) çözüp sırayla dene
    resolveCandidateUrls(mint).then((urls) => {
      setIframeSrcWithFallback(iframe, urls, finishSuccess, finishFail);
    }).catch(() => finishFail());

    mount.appendChild(iframe);
    iframeEl = iframe;

    // Son savunma: 5 sn sonra hâlâ yüklenmediyse hata göster
    setTimeout(() => {
      if (!loaded) finishFail();
    }, 5000);
  }

  function getMint() {
    return currentMint;
  }

  // Jupiter widget’tan mint değişimlerini dinle
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
