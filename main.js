/**
 * Projenizin genel JS dosyası.
 * Jupiter widget'ı orijinal haliyle kalsın; grafik/chart.js seçimleri postMessage ile dinler.
 * Bu dosya, ek site mantığınız için ayrılmıştır.
 */

document.addEventListener('DOMContentLoaded', () => {
  // İsteğe bağlı: URL parametresi ile ilk mint’i belirleyin. Ör: ?mint=HEadEt...
  try {
    const url = new URL(window.location.href);
    const mint = url.searchParams.get('mint');
    if (mint) {
      window.OppoChart?.setMint(mint);
    }
  } catch (e) {
    // sessiz geç
  }

  // İsteğe bağlı: elle bir mint göstermek isterseniz, aşağıdaki satırı açın.
  // window.OppoChart?.setMint('HEadEtLjAFBGqAweLESUR2Qcjoc3U8ekQNvSUSH17gJz');
});
