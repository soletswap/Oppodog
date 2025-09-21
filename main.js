// Jupiter plugin'i tek kez başlat (senin verdiğin ayarlar birebir korunuyor)
window.addEventListener("load", function () {
  if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;

  // İki kez init etme hatasını önlemek için basit koruma
  if (window.__JUP_INIT_DONE__) return;
  window.__JUP_INIT_DONE__ = true;

  window.Jupiter.init({
    displayMode: "integrated",
    integratedTargetId: "target-container",
    formProps: {
      initialInputMint: "So11111111111111111111111111111111111111112",
      initialOutputMint: "HEadEtLjAFBGqAweLESUR2Qcjoc3U8ekQNvSUSH17gJz",
      fixedMint: ""
    },
    branding: {
      logoUri: "https://photos.pinksale.finance/file/pinksale-logo-upload/1733923962272-6c08b5b4359a38ef4991bd3d69dc1c3d.png",
      name: "Oppo"
    }
  });

  // CA kopyalama
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
