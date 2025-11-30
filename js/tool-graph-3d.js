// /js/tool-graph-3d.js
document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.querySelector("#graph-run");
  const clearBtn = document.querySelector("#graph-clear");
  const errorEl = document.querySelector("#graph-error");
  const graphEl = document.querySelector("#graph3d");
  const tabsEl = document.querySelector("#graph-mode-tabs");

  if (!runBtn || !graphEl || !tabsEl) return;

  // ====== タブ切り替え ======
  tabsEl.querySelectorAll("button[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      tabsEl
        .querySelectorAll("button")
        .forEach((b) => b.classList.toggle("active", b === btn));
      document
        .querySelectorAll(".graph-mode-panel")
        .forEach((panel) => {
          panel.classList.toggle(
            "active",
            panel.dataset.panel === mode
          );
        });
    });
  });

  // ====== ボタン ======
  runBtn.addEventListener("click", () => {
    errorEl.textContent = "";
    try {
      const activeMode = tabsEl.querySelector("button.active")?.dataset
        .mode;
      if (!activeMode) return;

      if (activeMode === "surface") {
        drawSurface();
      } else if (activeMode === "implicit") {
        drawImplicit();
      } else if (activeMode === "param") {
        drawParam();
      }
    } catch (e) {
      console.error(e);
      errorEl.textContent = "式の評価中にエラーが発生しました。入力を確認してください。";
    }
  });

  clearBtn?.addEventListener("click", () => {
    Plotly.purge(graphEl);
    errorEl.textContent = "";
  });

  // ====== 式パーサ（ゆるく安全寄り） ======
function buildExprFn(exprRaw, vars) {
  if (!exprRaw || typeof exprRaw !== "string") {
    throw new Error("式が空です");
  }

  // 空白削除
  let expr = exprRaw.replace(/\s+/g, "");

  // ^ → JS の **
  expr = expr.replace(/\^/g, "**");

  // 定数
  expr = expr.replace(/pi\b/gi, "Math.PI");
  expr = expr.replace(/\be\b/g, "Math.E");

  // 関数名を Math.xxx に
  const fnNames = [
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "sinh",
    "cosh",
    "tanh",
    "exp",
    "log",
    "sqrt",
    "abs"
  ];
  fnNames.forEach((name) => {
    const re = new RegExp("\\b" + name + "\\b", "g");
    expr = expr.replace(re, "Math." + name);
  });

  // 危なそうな文字だけざっくり禁止（; {} [] = ' " とか）
  if (/[;={}\[\]'"]/.test(expr)) {
    throw new Error("利用できない文字が含まれています。");
  }

  // 関数化
  const argNames = [...vars, "Math"];
  const fnBody = "return " + expr + ";";

  // eslint-disable-next-line no-new-func
  const fn = new Function(...argNames, fnBody);
  return (...args) => fn(...args, Math);
}


  // ====== z = f(x, y) ======
  function drawSurface() {
    const expr = document.querySelector("#expr-surface").value;
    const xMin = Number(document.querySelector("#x-min").value);
    const xMax = Number(document.querySelector("#x-max").value);
    const yMin = Number(document.querySelector("#y-min").value);
    const yMax = Number(document.querySelector("#y-max").value);

    if (!(xMin < xMax && yMin < yMax)) {
      throw new Error("範囲が不正です。");
    }

    const f = buildExprFn(expr, ["x", "y"]);
    const steps = 50;

    const xs = [];
    const ys = [];
    const zs = [];

    for (let i = 0; i < steps; i++) {
      const x = xMin + ((xMax - xMin) * i) / (steps - 1);
      xs.push(x);
    }
    for (let j = 0; j < steps; j++) {
      const y = yMin + ((yMax - yMin) * j) / (steps - 1);
      ys.push(y);
    }

    for (let j = 0; j < steps; j++) {
      const row = [];
      const y = ys[j];
      for (let i = 0; i < steps; i++) {
        const x = xs[i];
        let z = NaN;
        try {
          z = f(x, y);
        } catch {
          z = NaN;
        }
        row.push(Number.isFinite(z) ? z : null);
      }
      zs.push(row);
    }

    const data = [
      {
        type: "surface",
        x: xs,
        y: ys,
        z: zs,
        colorscale: "Viridis"
      }
    ];

    const layout = {
      margin: { l: 0, r: 0, t: 0, b: 0 },
      scene: {
        xaxis: { title: "x" },
        yaxis: { title: "y" },
        zaxis: { title: "z" }
      }
    };

    Plotly.newPlot(graphEl, data, layout, { responsive: true });
  }

  // ====== F(x,y,z) = 0 ======
  function drawImplicit() {
    const expr = document.querySelector("#expr-implicit").value;
    const xMin = Number(document.querySelector("#ix-min").value);
    const xMax = Number(document.querySelector("#ix-max").value);
    const yMin = Number(document.querySelector("#iy-min").value);
    const yMax = Number(document.querySelector("#iy-max").value);
    const zMin = Number(document.querySelector("#iz-min").value);
    const zMax = Number(document.querySelector("#iz-max").value);

    if (!(xMin < xMax && yMin < yMax && zMin < zMax)) {
      throw new Error("範囲が不正です。");
    }

  // ====== パラメータ表示 ======
  function drawParam() {
    const ex = document.querySelector("#expr-x").value;
    const ey = document.querySelector("#expr-y").value;
    const ez = document.querySelector("#expr-z").value;
    const tMin = Number(document.querySelector("#t-min").value);
    const tMax = Number(document.querySelector("#t-max").value);

    if (!(tMin < tMax)) {
      throw new Error("t の範囲が不正です。");
    }

    const fx = buildExprFn(ex, ["t"]);
    const fy = buildExprFn(ey, ["t"]);
    const fz = buildExprFn(ez, ["t"]);

    const steps = 300;
    const xs = [];
    const ys = [];
    const zs = [];

    for (let i = 0; i < steps; i++) {
      const t = tMin + ((tMax - tMin) * i) / (steps - 1);
      let x = NaN,
        y = NaN,
        z = NaN;
      try {
        x = fx(t);
        y = fy(t);
        z = fz(t);
      } catch {
        x = y = z = NaN;
      }
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(z)
      ) {
        xs.push(x);
        ys.push(y);
        zs.push(z);
      }
    }

    const data = [
      {
        type: "scatter3d",
        mode: "lines",
        x: xs,
        y: ys,
        z: zs,
        line: {
          width: 5
        }
      }
    ];

    const layout = {
      margin: { l: 0, r: 0, t: 0, b: 0 },
      scene: {
        xaxis: { title: "x" },
        yaxis: { title: "y" },
        zaxis: { title: "z" }
      }
    };

    Plotly.newPlot(graphEl, data, layout, { responsive: true });
  }
}});
