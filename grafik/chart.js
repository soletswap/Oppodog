(function () {
  const CONTAINER_ID = "dex-chart";
  const BASE = "https://dexscreener.com";
  const CHAIN = "solana";

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
    const tokenUrl = `${BASE}/${CHAIN}/tokens/${mint}?${EMBED_QUERY}`;
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

    iframe.addEventListener("load", function handleLoad() {
      try {
        onFirstLoad && onFirstLoad();
      } catch (e) {}
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
      return;
    }
    currentMint = mint;

    mount.innerHTML = "";
    const placeholder = renderPlaceholder("Grafik yükleniyor…");
    mount.appendChild(placeholder);

    const iframe = document.createElement("iframe");
    iframe.className = "chart-iframe";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

    const candidates = buildCandidateUrls(mint);
    setIframeSrcWithFallback(iframe, candidates, () => {
      placeholder.remove?.();
    });

    mount.appendChild(iframe);
    iframeEl = iframe;
  }

  function getMint() {
    return currentMint;
  }

  window.addEventListener("message", (event) => {
    try {
      if (typeof event.origin === "string" && !event.origin.includes("jup.ag")) return;

      const d = event.data;
      if (!d || typeof d !== "object") return;

      const maybeMint =
        d.outputMint ||
        (d.form && d.form.outputMint) ||
        (d.state && d.state.form && d.state.form.outputMint);

      if (typeof maybeMint === "string" && maybeMint.length > 30) {
        setMint(maybeMint);
      }
    } catch {}
  });

  window.OppoChart = {
    setMint,
    getMint,
  };
})();
