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
    },
    branding: {
      logoUri:
        "https://photos.pinksale.finance/file/pinksale-logo-upload/1733923962272-6c08b5b4359a38ef4991bd3d69dc1c3d.png",
      name: "Oppo",
    },
  });
});