// Basit çoklu cüzdan algılama ve bağlama
(function () {
  function detectWallets() {
    const wallets = {};
    const sol = window.solana;

    // Phantom
    if (window.phantom && window.phantom.solana) wallets.phantom = window.phantom.solana;
    else if (sol && sol.isPhantom) wallets.phantom = sol;

    // Solflare
    if (window.solflare) wallets.solflare = window.solflare;
    else if (sol && sol.isSolflare) wallets.solflare = sol;

    // Backpack
    if (window.backpack && window.backpack.solana) wallets.backpack = window.backpack.solana;

    // Glow
    if (window.glow && window.glow.solana) wallets.glow = window.glow.solana;

    // Exodus
    if (window.exodus && window.exodus.solana) wallets.exodus = window.exodus.solana;

    return wallets;
  }

  function renderConnectButtons(wallets) {
    const panel = document.getElementById("connect-panel");
    const container = document.getElementById("connect-buttons");
    if (!panel || !container) return;

    // Temizle
    container.innerHTML = "";

    const entries = Object.entries(wallets);
    if (entries.length === 0) {
      // Masaüstünde sağlayıcı yoksa paneli gizle (mobil yardım görünsün)
      panel.style.display = "none";
      return;
    }

    panel.style.display = "";

    const names = {
      phantom: "Phantom ile Bağlan",
      solflare: "Solflare ile Bağlan",
      backpack: "Backpack ile Bağlan",
      glow: "Glow ile Bağlan",
      exodus: "Exodus ile Bağlan",
    };

    for (const [key, provider] of entries) {
      const btn = document.createElement("button");
      btn.className = "connect-btn";
      btn.type = "button";
      btn.textContent = names[key] || `Bağlan (${key})`;
      btn.addEventListener("click", async () => {
        try {
          // Bağlan
          if (typeof provider.connect === "function") {
            await provider.connect();
          } else if (provider?.wallet?.connect) {
            await provider.wallet.connect();
          }
          // Bağlandı uyarısı (isteğe bağlı)
          console.log(`[${key}] connected:`, provider.publicKey?.toString?.());
        } catch (e) {
          console.error(`[${key}] connect error:`, e);
          alert("Cüzdana bağlanılamadı. Lütfen cüzdan pencerenizi kontrol edin.");
        }
      });
      container.appendChild(btn);

      // Olayları dinle (isteğe bağlı)
      try {
        provider?.on?.("connect", () => {
          console.log(`[${key}] event: connect`);
        });
        provider?.on?.("disconnect", () => {
          console.log(`[${key}] event: disconnect`);
        });
        provider?.on?.("accountChanged", (pubkey) => {
          console.log(`[${key}] event: accountChanged`, pubkey?.toString?.());
        });
      } catch {}
    }
  }

  function setupDeepLinks() {
    const current = encodeURIComponent(window.location.href);
    const phantom = document.getElementById("open-phantom");
    const solflare = document.getElementById("open-solflare");
    if (phantom) phantom.href = "phantom://browse/" + current;
    if (solflare) solflare.href = "solflare://browser?url=" + current;
  }

  function toggleMobileHelp(hasProvider) {
    const help = document.getElementById("wallet-help");
    if (!help) return;
    help.style.display = hasProvider ? "none" : "";
  }

  // Sayfa yüklenince
  window.addEventListener("load", function () {
    // Deep linkleri hazırla
    setupDeepLinks();

    // Cüzdanları algıla ve UI'ı hazırla
    const wallets = detectWallets();
    const hasProvider = Object.keys(wallets).length > 0;
    renderConnectButtons(wallets);
    toggleMobileHelp(hasProvider);

    // Sessiz bağlanma (onlyIfTrusted) — penceresiz, varsa mevcut oturumu açar
    for (const provider of Object.values(wallets)) {
      try {
        provider?.connect?.({ onlyIfTrusted: true });
      } catch {}
    }

    // Jupiter widget init
    if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;
    window.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: "target-container",
      defaultExplorer: "Solscan",
      formProps: {
        initialInputMint: "So11111111111111111111111111111111111111112", // SOL
        initialOutputMint: "HEadEtLjAFBGqAweLESUR2Qcjoc3U8ekQNvSUSH17gJz", // OPPO
        referralAccount: "9EvV3V9cZ4KktQ4xCnu3ymA2a9qgaBR4HLFhFddZZXSn",
        referralFee: 100, // bps (1.00%)
      },
      branding: {
        logoUri:
          "https://photos.pinksale.finance/file/pinksale-logo-upload/1733923962272-6c08b5b4359a38ef4991bd3d69dc1c3d.png",
        name: "Oppo",
      },
    });
  });
})();
