// /js/tool-graph-2d.js
document.addEventListener("DOMContentLoaded", () => {
  const modeButtons = document.querySelectorAll(".tab-btn[data-mode]");
  const modeYx = document.querySelector(".graph-mode-yx");
  const modeParam = document.querySelector(".graph-mode-param");
  const errorEl = document.querySelector("#graph-2d-error");
  const graphEl = document.querySelector("#graph-2d");

  const exprYxEl = document.querySelector("#expr-yx");
  const yxXminEl = document.querySelector("#yx-xmin");
  const yxXmaxEl = document.querySelector("#yx-xmax");
  const yxStepsEl = document.querySelector("#yx-steps");
  const btnYx = document.querySelector("#btn-yx-plot");

  const exprXtEl = document.querySelector("#expr-xt");
  const exprYtEl = document.querySelector("#expr-yt");
  const tMinEl = document.querySelector("#t-min");
  const tMaxEl = document.querySelector("#t-max");
  const tStepsEl = document.querySelector("#t-steps");
  const btnParam = document.querySelector("#btn-param-plot");

  if (!graphEl) return;

  // ==== モード切り替え ====
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (mode === "yx") {
        modeYx.style.display = "";
        modeParam.style.display = "none";
      } else {
        modeYx.style.display = "none";
        modeParam.style.display = "";
      }

      errorEl.textContent = "";
    });
  });

  // ==== 式パーサ ====
  function buildExprFn(exprRaw, vars) {
    if (!exprRaw || typeof exprRaw !== "string") {
      throw new Error("式が空です。");
    }

    let expr = exprRaw.replace(/\s+/g, ""); // 空白削除
    expr = expr.replace(/\^/g, "**"); // ^ → **

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

    // 危なそうな文字だけ禁止
    if (/[;={}\[\]'"]/.test(expr)) {
      throw new Error("利用できない文字が含まれています。");
    }

    const argNames = [...vars, "Math"];
    const body = "return " + expr + ";";

    // eslint-disable-next-line no-new-func
    const fn = new Function(...argNames, body);
    return (...args) => fn(...args, Math);
  }

  function safeNumber(inputEl, fallback) {
    const v = Number(inputEl.value);
    return Number.isFinite(v) ? v : fallback;
  }

  // ==== y = f(x) 描画 ====
  function plotYx() {
    try {
      errorEl.textContent = "";

      const expr = exprYxEl.value;
      const xMin = safeNumber(yxXminEl, -10);
      const xMax = safeNumber(yxXmaxEl, 10);
      let steps = parseInt(yxStepsEl.value, 10);
      if (!Number.isFinite(steps) || steps <= 0) steps = 400;
      steps = Math.min(Math.max(steps, 50), 4000);

      if (!(xMin < xMax)) {
        throw new Error("x の最小値と最大値を正しく指定してください。");
      }

      const f = buildExprFn(expr, ["x"]);
      const xs = [];
      const ys = [];

      for (let i = 0; i < steps; i++) {
        const x = xMin + ((xMax - xMin) * i) / (steps - 1);
        let y;
        try {
          y = f(x);
        } catch {
          y = NaN;
        }
        if (!Number.isFinite(y)) {
          ys.push(null);
        } else {
          ys.push(y);
        }
        xs.push(x);
      }

      const data = [
        {
          x: xs,
          y: ys,
          mode: "lines",
          type: "scatter",
          line: { width: 2 }
        }
      ];

      const layout = {
        margin: { l: 40, r: 20, t: 20, b: 40 },
        xaxis: { title: "x" },
        yaxis: {
          title: "y",
          zeroline: true,
          // ← ここで縦横比を固定（1:1）
          scaleanchor: "x",
          scaleratio: 1
        }
      };

      Plotly.newPlot(graphEl, data, layout, { responsive: true });
    } catch (err) {
      console.error(err);
      errorEl.textContent =
        err && err.message ? err.message : "式の評価中にエラーが発生しました。入力を確認してください。";
    }
  }

  // ==== 媒介変数 x=f(t), y=g(t) 描画 ====
  function plotParametric() {
    try {
      errorEl.textContent = "";

      const exprX = exprXtEl.value;
      const exprY = exprYtEl.value;
      const tMin = safeNumber(tMinEl, 0);
      const tMax = safeNumber(tMaxEl, 2 * Math.PI);
      let steps = parseInt(tStepsEl.value, 10);
      if (!Number.isFinite(steps) || steps <= 0) steps = 400;
      steps = Math.min(Math.max(steps, 50), 4000);

      if (!(tMin < tMax)) {
        throw new Error("t の最小値と最大値を正しく指定してください。");
      }

      const fx = buildExprFn(exprX, ["t"]);
      const fy = buildExprFn(exprY, ["t"]);

      const xs = [];
      const ys = [];

      for (let i = 0; i < steps; i++) {
        const t = tMin + ((tMax - tMin) * i) / (steps - 1);
        let xVal;
        let yVal;
        try {
          xVal = fx(t);
          yVal = fy(t);
        } catch {
          xVal = NaN;
          yVal = NaN;
        }
        if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) {
          xs.push(null);
          ys.push(null);
        } else {
          xs.push(xVal);
          ys.push(yVal);
        }
      }

      const data = [
        {
          x: xs,
          y: ys,
          mode: "lines",
          type: "scatter",
          line: { width: 2 }
        }
      ];

      const layout = {
        margin: { l: 40, r: 20, t: 20, b: 40 },
        xaxis: { title: "x" },
        yaxis: {
          title: "y",
          zeroline: true,
          scaleanchor: "x",
          scaleratio: 1
        }
      };

      Plotly.newPlot(graphEl, data, layout, { responsive: true });
    } catch (err) {
      console.error(err);
      errorEl.textContent =
        err && err.message ? err.message : "式の評価中にエラーが発生しました。入力を確認してください。";
    }
  }

  // ボタンイベント
  btnYx?.addEventListener("click", plotYx);
  btnParam?.addEventListener("click", plotParametric);

  // Enter で実行
  [exprYxEl, yxXminEl, yxXmaxEl, yxStepsEl].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        plotYx();
      }
    });
  });

  [exprXtEl, exprYtEl, tMinEl, tMaxEl, tStepsEl].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        plotParametric();
      }
    });
  });

  // 初期表示：y = sin(x)
  plotYx();
});
