document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelector("#slides");
  const dotsContainer = document.querySelector("#slider-dots");
  const prev = document.querySelector("#prev-slide");
  const next = document.querySelector("#next-slide");
  if (!slides || !dotsContainer) return;

  const total = slides.children.length;
  let current = 0;
  let timer;

  for (let i = 0; i < total; i++) {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  prev?.addEventListener("click", () => goTo((current - 1 + total) % total));
  next?.addEventListener("click", () => goTo((current + 1) % total));

  function goTo(index) {
    current = index;
    slides.style.transform = `translateX(-${index * 100}%)`;
    dotsContainer.querySelectorAll("button").forEach((d, i) => {
      d.classList.toggle("active", i === index);
    });
    restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => goTo((current + 1) % total), 4000);
  }

  restart();
});
