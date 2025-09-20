// Dexscreener grafiği için basit entegrasyon
// Global API: window.OppoChart.setMint(<mintAddress>)
(function () {
  const CONTAINER_ID = "dex-chart";
  const BASE = "https://dexscreener.com";
  const CHAIN = "solana";

  // Grafiğin görünümü için embed query (tema/trades/info/interval ayarları)
  const EMBED_QUERY = "embed=1&theme=dark&trades=0&info=0&interval=15";

  let currentMint = null;
  let iframeEl = null;

  function ensureMount() {
    const shell = document.getElementById(CONTAINER_ID);
    if (!shell) {
      console.warn("[OppoChart] Container #dex-chart bulunamadı.");
      return null;
    }
    return shell;
  }

  function buildCandidateUrls(mint) {
    // 1) Token sayfası (birden çok havuzu toparlar)
    const tokenUrl = `${BASE}/${CHAIN}/tokens/${mint}?${EMBED_QUERY}`;
    // 2) Bazı durumlarda doğrudan <chain>/<mint> de çalışır
    const fallbackUrl = `${BASE}/${CHAIN}/${mint}?${EMBED_QUERY}`;
    return [tokenUrl, fallbackUrl];
  }

  function renderPlaceholder(text, extraClass) {
    const el = document.createElement("div");
    el.className = `chart-placeholder${extraClass ? " " + extraClass : ""}`;
    el.textContent = text || "Grafik yükleniyor…";
    return el;
  }

  function setIframeSrcWithFallback(iframe, urls, onFirstLoad) {
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) return;
      iframe.src = urls[idx++];
    };

    // İlk başarılı load'da placeholder'ı temizlemek için
    iframe.addEventListener("load", function handleLoad() {
      try {
        onFirstLoad && onFirstLoad();
      } catch (e) {
        // yut
      }
      // Not: 404/boş içeriği cross-origin tespit etmek zor, bu yüzden tek load'ta başarılı sayıyoruz.
      // Eğer ilk URL çalışmazsa (ağ hatası vb.), error event'i tetiklenirse fallback deneriz.
      iframe.removeEventListener("error", handleError);
    });

    function handleError() {
      tryNext();
    }
    iframe.addEventListener("error", handleError);

    tryNext();
  }

  function setMint(mint) {
    const mount = ensureMount();
    if (!mount) return;

    if (!mint || typeof mint !== "string") {
      mount.innerHTML = "";
      mount.appendChild(
        renderPlaceholder("Geçersiz token adresi", "chart-error")
      );
      return;
    }
    if (mint === currentMint && iframeEl) {
      // Aynı token ise tekrar yükleme
      return;
    }
    currentMint = mint;

    // İçeriği temizle, placeholder ekle
    mount.innerHTML = "";
    const placeholder = renderPlaceholder("Grafik yükleniyor…");
    mount.appendChild(placeholder);

    // Iframe oluştur
    const iframe = document.createElement("iframe");
    iframe.className = "chart-iframe";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

    const candidates = buildCandidateUrls(mint);
    setIframeSrcWithFallback(iframe, candidates, () => {
      // İlk yüklemede placeholder'ı kaldır
      placeholder.remove?.();
    });

    mount.appendChild(iframe);
    iframeEl = iframe;
  }

  function getMint() {
    return currentMint;
  }

  // Jupiter Plugin'den gelebilecek postMessage olaylarına karşı "best-effort" dinleyici.
  // Şekli garanti değil; güvenli şekilde denenir, çalışmazsa sessizce yok sayılır.
  window.addEventListener("message", (event) => {
    try {
      // Güvenlik: yalnızca jup.ag kaynaklarından gelen mesajları ele al
      if (typeof event.origin === "string" && !event.origin.includes("jup.ag")) return;

      const d = event.data;
      if (!d || typeof d !== "object") return;

      // Muhtemel alan isimleri: outputMint, form.outputMint, state.form.outputMint
      const maybeMint =
        d.outputMint ||
        (d.form && d.form.outputMint) ||
        (d.state && d.state.form && d.state.form.outputMint);

      if (typeof maybeMint === "string" && maybeMint.length > 30) {
        setMint(maybeMint);
      }
    } catch {
      // yut
    }
  });

  // Küresel API
  window.OppoChart = {
    setMint,
    getMint,
  };
})();