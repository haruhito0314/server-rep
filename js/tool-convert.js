document.addEventListener("DOMContentLoaded", () => {
  const textEl = document.querySelector("#convert-text");
  const runBtn = document.querySelector("#convert-run");
  const resultEl = document.querySelector("#convert-result");
  if (!textEl || !runBtn || !resultEl) return;

  runBtn.addEventListener("click", () => {
    const text = textEl.value.trim();
    if (!text) {
      resultEl.textContent = "テキストを入力してください。";
      return;
    }
    resultEl.textContent = "音声と画像を生成しました（ダミー）。";
  });
});
