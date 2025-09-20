window.addEventListener("load", function () {
  if (!window.Jupiter || typeof window.Jupiter.init !== "function") return;

  const defaultInputMint = "So11111111111111111111111111111111111111112"; // SOL
  const defaultOutputMint = "HEadEtLjAFBGqAweLESUR2Qcjoc3U8ekQNvSUSH17gJz"; // OPPO

  function updateChartMint(mint) {
    if (!mint) return;
    if (window.OppoChart && typeof window.OppoChart.setMint === "function") {
      window.OppoChart.setMint(mint);
    } else {
      setTimeout(() => window.OppoChart?.setMint?.(mint), 250);
    }
  }

  function pickMintFromState(anyState) {
    if (!anyState) return "";
    
    // Look for both input and output tokens, prioritizing the one that's not SOL
    const outputCandidates = [
      anyState.outputMint,
      anyState.outMint,
      anyState.destinationMint,
      anyState.toMint,
      anyState?.formValues?.outputMint,
      anyState?.form?.outputMint,
      anyState?.state?.outputMint,
      anyState?.state?.formValues?.outputMint,
    ].filter(Boolean);
    
    const inputCandidates = [
      anyState.inputMint,
      anyState.inMint,
      anyState.sourceMint,
      anyState.fromMint,
      anyState?.formValues?.inputMint,
      anyState?.form?.inputMint,
      anyState?.state?.inputMint,
      anyState?.state?.formValues?.inputMint,
    ].filter(Boolean);
    
    // Combine all candidates, filter out SOL (as it's usually the base pair)
    const allCandidates = [...outputCandidates, ...inputCandidates];
    const solMint = "So11111111111111111111111111111111111111112";
    
    // First try to find a non-SOL token
    for (const candidate of allCandidates) {
      const str = String(candidate || "");
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str) && str !== solMint) {
        return str;
      }
    }
    
    // If all tokens are SOL or invalid, return the first valid one
    for (const candidate of allCandidates) {
      const str = String(candidate || "");
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str)) {
        return str;
      }
    }
    
    return "";
  }

  function attachJupiterListeners(api) {
    if (api && typeof api.onStateChange === "function") {
      try {
        api.onStateChange((state) => {
          const mint = pickMintFromState(state);
          if (mint) updateChartMint(mint);
        });
      } catch {}
    }
    if (api && typeof api.onFormUpdate === "function") {
      try {
        api.onFormUpdate((state) => {
          const mint = pickMintFromState(state);
          if (mint) updateChartMint(mint);
        });
      } catch {}
    }

    window.addEventListener("message", (event) => {
      const data = event?.data;
      if (!data) return;
      const possiblePayloads = [data, data.state, data.detail].filter(Boolean);
      for (const payload of possiblePayloads) {
        const mint = pickMintFromState(payload);
        if (mint) {
          updateChartMint(mint);
          break;
        }
      }
    });
  }

  const config = {
    displayMode: "integrated",
    integratedTargetId: "target-container",
    defaultExplorer: "Solscan",
    formProps: {
      initialInputMint: defaultInputMint,
      initialOutputMint: defaultOutputMint,
      referralAccount: "9EvV3V9cZ4KktQ4xCnu3ymA2a9qgaBR4HLFhFddZZXSn",
      referralFee: 100,
    },
    branding: {
      logoUri:
        "https://photos.pinksale.finance/file/pinksale-logo-upload/1733923962272-6c08b5b4359a38ef4991bd3d69dc1c3d.png",
      name: "Oppo",
    },
  };

  updateChartMint(defaultOutputMint);

  const maybePromise = window.Jupiter.init(config);
  if (maybePromise && typeof maybePromise.then === "function") {
    maybePromise
      .then((api) => {
        attachJupiterListeners(api);
      })
      .catch((e) => {
        console.warn("Jupiter init error:", e);
      });
  } else {
    attachJupiterListeners(null);
  }
});
