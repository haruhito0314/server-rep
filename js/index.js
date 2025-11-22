// index.html 専用スクリプト
document.addEventListener("DOMContentLoaded", () => {
  const slidesContainer = document.querySelector("#slides");
  const slideElems = slidesContainer
    ? Array.from(slidesContainer.querySelectorAll(".slide"))
    : [];
  const prevBtn = document.querySelector("#prev-slide");
  const nextBtn = document.querySelector("#next-slide");
  const dotsContainer = document.querySelector("#slider-dots");

  if (!slidesContainer || slideElems.length === 0 || !dotsContainer) {
    return;
  }

  let current = 0;
  let autoTimer = null;

  // --- ドットを作成 ---
  const dotElems = slideElems.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.addEventListener("click", () => {
      current = index;
      updateSlider(false);
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  // --- スライド1枚ぶんへ移動 ---
  function updateSlider(restartAuto = true) {
    const offset = -current * 100;
    slidesContainer.style.transform = `translateX(${offset}%)`;

    dotElems.forEach((dot, i) => {
      dot.classList.toggle("active", i === current);
    });

    if (restartAuto) {
      restartAutoPlay();
    }
  }

  function goNext() {
    current = (current + 1) % slideElems.length;
    updateSlider();
  }

  function goPrev() {
    current = (current - 1 + slideElems.length) % slideElems.length;
    updateSlider();
  }

  // --- 自動再生 ---
  function restartAutoPlay() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(goNext, 8000); // 8秒ごとに次へ
  }

  // --- ボタンイベント ---
  prevBtn?.addEventListener("click", () => {
    goPrev();
  });
  nextBtn?.addEventListener("click", () => {
    goNext();
  });

  // --- スライドクリックでリンクへ遷移 ---
  slideElems.forEach((slide) => {
    const link = slide.dataset.link;
    if (!link) return;
    slide.addEventListener("click", () => {
      window.location.href = link;
    });
  });

  // スワイプ操作（スマホ）対応（おまけ）
  let startX = null;
  slidesContainer.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });
  slidesContainer.addEventListener("touchend", (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const threshold = 40; // これ以上動いたらスワイプとみなす
    if (dx > threshold) {
      goPrev();
    } else if (dx < -threshold) {
      goNext();
    }
    startX = null;
  });

  // 初期表示
  updateSlider();
});
