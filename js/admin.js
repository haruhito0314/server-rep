// /js/admin.js

// ★ ここを自分の Lambda の URL に差し替える
//   例: "https://xxxx.lambda-url.ap-northeast-1.on.aws/"
const ADMIN_LOGIN_ENDPOINT =
  "https://pvfxypahigmzsv4ri3mgupu6wa0qcuhe.lambda-url.ap-northeast-1.on.aws/";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#admin-form");
  const input = document.querySelector("#admin-password");
  const message = document.querySelector("#admin-message");
  const submitBtn = document.querySelector("#admin-submit");

  // フォームが無ければ何もしない
  if (!form || !input) return;

  // すでに管理者モードならメッセージだけ表示
  const isAdminSession = localStorage.getItem("mcommon_admin") === "true";
  if (isAdminSession && message) {
    message.textContent = "すでに管理者モードです。";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!ADMIN_LOGIN_ENDPOINT) {
      if (message) {
        message.textContent =
          "ログインエンドポイントが設定されていません。";
      }
      return;
    }

    const password = input.value.trim();
    if (!password) {
      if (message) message.textContent = "パスワードを入力してください。";
      return;
    }

    // ボタンの状態をローディングに変更
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "確認中…";
    }
    if (message) message.textContent = "";

    try {
      const res = await fetch(ADMIN_LOGIN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔑 Lambda(index.mjs) の仕様に合わせる
        body: JSON.stringify({
          action: "checkPin",
          pin: password,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        // HTTP ステータス的に失敗（400, 401, 500など）
        if (message) {
          message.textContent =
            data?.error ||
            data?.message ||
            `サーバーでエラーが発生しました。（${res.status}）`;
        }
        return;
      }

      if (!data || !data.ok) {
        // 認証 NG（ok: false または data 自体が変）
        if (message) {
          message.textContent =
            data?.error || data?.message || "パスワードが違います。";
        }
        return;
      }

      // 認証 OK → 管理者フラグを立ててトップへ
      localStorage.setItem("mcommon_admin", "true");
      if (message) {
        message.textContent =
          "ログインしました。トップページに移動します…。";
      }

      setTimeout(() => {
        location.href = "/index.html";
      }, 600);
    } catch (err) {
      console.error("admin login error:", err);
      if (message) {
        message.textContent =
          "ネットワークエラーが発生しました。時間をおいて再度お試しください。";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "ログイン";
      }
    }
  });
});
