document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#graph-input");
  const runBtn = document.querySelector("#graph-run");
  const bars = document.querySelector("#graph-bars");
  if (!input || !runBtn || !bars) return;

  runBtn.addEventListener("click", () => {
    const values = input.value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => !Number.isNaN(n));
    bars.innerHTML = "";
    if (!values.length) {
      bars.textContent = "数値を入力してください。";
      return;
    }
    const max = Math.max(...values);
    values.forEach((v) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";
      const label = document.createElement("span");
      label.textContent = v;
      label.className = "muted";
      const bar = document.createElement("div");
      bar.style.height = "12px";
      bar.style.borderRadius = "8px";
      bar.style.width = `${(v / max) * 100}%`;
      bar.style.background = "linear-gradient(90deg, var(--accent), #7ef8ff)";
      bar.style.boxShadow = "0 8px 20px rgba(0,180,255,0.35)";
      row.appendChild(label);
      row.appendChild(bar);
      bars.appendChild(row);
    });
  });
});
