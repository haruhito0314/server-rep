// common.js
// ヘッダー / フッター / チャットボットの読み込み ＋ テーマ / ナビ / 管理モード / フッター / チャットボット

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const loadPartial = (selector, path) =>
    fetch(path)
      .then((res) => res.text())
      .then((html) => {
        const el = document.querySelector(selector);
        if (el) el.innerHTML = html;
      })
      .catch((err) => {
        console.error("Failed to load partial:", selector, err);
      });

  Promise.all([
    loadPartial("#site-header", "/partials/header.html"),
    loadPartial("#site-footer", "/partials/footer.html"),
    loadPartial("#chatbot-slot", "/partials/chatbot.html"),
  ])
    .then(() => {
      initTheme();
      initNav();
      initAdmin();
      initFooter();
    })
    .then(loadChatScript)
    .then(() => {
      if (window.initChatbot) window.initChatbot();
    });

  /* =========================
     Theme
  ========================= */

  function initTheme() {
    const saved = localStorage.getItem("mcommon_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = saved || (prefersDark ? "dark" : "light");
    setTheme(current);

    const btnLight = document.querySelector('[data-theme-btn="light"]');
    const btnDark = document.querySelector('[data-theme-btn="dark"]');
    btnLight?.addEventListener("click", () => setTheme("light"));
    btnDark?.addEventListener("click", () => setTheme("dark"));
  }

  function setTheme(theme) {
    if (theme === "light") {
      body.dataset.theme = "light";
    } else {
      body.dataset.theme = "dark";
    }
    localStorage.setItem("mcommon_theme", theme);
    document
      .querySelectorAll(".toggle-btn")
      .forEach((btn) => btn.classList.toggle("active", btn.dataset.themeBtn === theme));
  }

  /* =========================
     Navigation + Mega Menu + Backdrop
  ========================= */

  function initNav() {
    const path = location.pathname;
    const nav = document.querySelector(".nav");
    const navLinks = document.querySelectorAll(".nav a");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const search = document.querySelector(".nav-search");
    const searchBtn = document.querySelector(".search-button");
    const searchInput = search?.querySelector("input[type='search']");

    // メガメニュー本体
    const megaMenus = {
      tools: document.querySelector("#mega-tools"),
      subjects: document.querySelector("#mega-subjects"),
    };

    // ★ ヘッダー直下に置いた <div id="mega-backdrop" class="mega-backdrop"></div>
    const megaBackdrop = document.querySelector("#mega-backdrop");

    let megaTimer = null;
    let megaOpenTimer = null;
    let currentMega = null;

    // ナビのアクティブ状態
    navLinks.forEach((link) => {
      const key = link.dataset.nav;
      if (
        (key === "home" && (path === "/" || path.endsWith("/index.html"))) ||
        path.endsWith(`/${key}.html`) ||
        (key === "tools" && path.includes("/tool-"))
      ) {
        link.classList.add("active");
      }
    });

    // モバイルメニュー
    navToggle?.addEventListener("click", () => {
      hideMega();
      nav?.classList.toggle("open");
    });

    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        nav?.classList.remove("open");
      })
    );

    // メガメニュー制御
    const setMegaOpen = (key) => {
      Object.entries(megaMenus).forEach(([k, el]) => {
        if (el) el.classList.toggle("open", k === key);
      });
      currentMega = key;
      if (key) {
        document.documentElement.classList.add("mega-open");
        // ★ 背景ぼかしレイヤー ON
        megaBackdrop?.classList.add("open");
      }
    };

    const showMega = (key, immediate = false) => {
      clearTimeout(megaTimer);
      clearTimeout(megaOpenTimer);

      if (immediate || currentMega) {
        // すでに開いているときは即切り替え
        setMegaOpen(key);
        return;
      }

      // 少し遅らせて hover の誤爆を防ぐ
      megaOpenTimer = setTimeout(() => setMegaOpen(key), 320);
    };

    const hideMega = () => {
      clearTimeout(megaOpenTimer);
      megaTimer = setTimeout(() => {
        Object.values(megaMenus).forEach((el) => el?.classList.remove("open"));
        currentMega = null;
        document.documentElement.classList.remove("mega-open");
        // ★ 背景ぼかしレイヤー OFF
        megaBackdrop?.classList.remove("open");
      }, 250);
    };

    // ヘッダーの nav リンクに hover / focus でメガメニュー表示
    navLinks.forEach((link) => {
      if (link.dataset.mega) {
        link.addEventListener("mouseenter", () => showMega(link.dataset.mega, !!currentMega));
        link.addEventListener("focus", () => showMega(link.dataset.mega, !!currentMega));
      }
    });

    // メガメニュー上にいる間は閉じない
    Object.values(megaMenus).forEach((menu) => {
      menu?.addEventListener("mouseenter", () => {
        clearTimeout(megaTimer);
        clearTimeout(megaOpenTimer);
        if (currentMega) setMegaOpen(currentMega);
      });
      menu?.addEventListener("mouseleave", hideMega);
    });

    // ナビエリアから出たら閉じる
    nav?.addEventListener("mouseleave", hideMega);

    // 検索ボックス
    searchBtn?.addEventListener("click", () => {
      search?.classList.add("open");
      searchInput?.focus();
    });

    searchInput?.addEventListener("blur", () => {
      setTimeout(() => search?.classList.remove("open"), 100);
    });
  }

  /* =========================
     Admin mode (local flag)
  ========================= */

  function initAdmin() {
    const adminToggle = document.querySelector("[data-admin-toggle]");
    const isAdmin = localStorage.getItem("mcommon_admin") === "true";

    if (isAdmin) {
      document.documentElement.classList.add("admin-mode");
      adminToggle?.removeAttribute("hidden");
      adminToggle?.setAttribute("aria-pressed", "true");
      if (adminToggle) adminToggle.textContent = "管理モード ON";
    } else {
      document.documentElement.classList.remove("admin-mode");
      adminToggle?.setAttribute("hidden", "");
      adminToggle?.setAttribute("aria-pressed", "false");
    }

    adminToggle?.addEventListener("click", () => {
      const nowAdmin = localStorage.getItem("mcommon_admin") === "true";
      if (nowAdmin) {
        localStorage.removeItem("mcommon_admin");
        location.reload();
        return;
      }
      // 非管理者には表示されないが念のため
      location.href = "/admin-login.html";
    });
  }

  /* =========================
     Footer actions
  ========================= */

  function initFooter() {
    document.querySelector("#back-to-top")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* =========================
     Chatbot loader
  ========================= */
  let chatScriptLoaded = false;
  function loadChatScript() {
    if (chatScriptLoaded) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "/js/chatbot.js";
      s.defer = true;
      s.onload = () => {
        chatScriptLoaded = true;
        resolve();
      };
      document.head.appendChild(s);
    });
  }
});
