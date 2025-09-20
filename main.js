window.addEventListener("load", function () {
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

  // CA kopyalama (tam metni koru)
  const bar = document.getElementById("token-links");
  const caBtn = bar?.querySelector(".chip.ca");
  if (caBtn) {
    const ca = caBtn.getAttribute("data-ca") || "";
    caBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(ca);
        const prev = caBtn.textContent;
        caBtn.classList.add("copied");
        caBtn.textContent = "Copied!";
        setTimeout(() => {
          caBtn.textContent = prev || `CA: ${ca}`;
          caBtn.classList.remove("copied");
        }, 1200);
      } catch {
        // sessiz geç
      }
    });
  }
});
