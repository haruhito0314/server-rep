document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#graph-input");
  const runBtn = document.querySelector("#graph-run");
  const output = document.querySelector("#graph-output");
  const modeTabs = document.querySelectorAll("[data-mode]");
  let mode = "2d";
  if (!input || !runBtn || !output) return;

  modeTabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      modeTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      mode = tab.dataset.mode;
      render();
    })
  );

  runBtn.addEventListener("click", () => render());

  function render() {
    const values = input.value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => !Number.isNaN(n));
    output.innerHTML = "";
    if (!values.length) {
      output.textContent = "数値を入力してください。";
      return;
    }
    if (mode === "2d") {
      render2d(values);
    } else {
      render3d(values);
    }
  }

  function render2d(values) {
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
      output.appendChild(row);
    });
  }

  function render3d(values) {
    const max = Math.max(...values);
    values.forEach((v) => {
      const card = document.createElement("div");
      card.className = "glass-card";
      card.style.padding = "12px";
      card.style.display = "grid";
      card.style.gap = "6px";
      const title = document.createElement("strong");
      title.textContent = `値: ${v}`;
      const plane = document.createElement("div");
      plane.style.height = "80px";
      plane.style.borderRadius = "10px";
      plane.style.background = "linear-gradient(135deg, rgba(14,116,255,0.25), rgba(126,248,255,0.18))";
      plane.style.boxShadow = "0 14px 26px rgba(0,0,0,0.16)";
      plane.style.position = "relative";
      const column = document.createElement("div");
      column.style.position = "absolute";
      column.style.bottom = "8px";
      column.style.left = "20%";
      column.style.width = "40px";
      column.style.height = `${(v / max) * 60 + 10}px`;
      column.style.background = "linear-gradient(180deg, var(--accent), #4b9dff)";
      column.style.borderRadius = "10px 10px 6px 6px";
      column.style.boxShadow = "0 12px 20px rgba(0,180,255,0.3)";
      plane.appendChild(column);
      card.appendChild(title);
      card.appendChild(plane);
      output.appendChild(card);
    });
  }
});
