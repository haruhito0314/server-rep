// Load common partials, theme toggle, nav control, admin mode, footer actions, chatbot
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const loadPartial = (id, path) =>
    fetch(path)
      .then((res) => res.text())
      .then((html) => {
        const el = document.querySelector(id);
        if (el) el.innerHTML = html;
      });

  Promise.all([
    loadPartial("#site-header", "/partials/header.html"),
    loadPartial("#site-footer", "/partials/footer.html"),
    loadPartial("#chatbot-slot", "/partials/chatbot.html"),
  ]).then(() => {
    initTheme();
    initNav();
    initAdmin();
    initFooter();
    initChatbot();
  });

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

  function initNav() {
    const path = location.pathname;
    const nav = document.querySelector(".nav");
    const navLinks = document.querySelectorAll(".nav a");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const search = document.querySelector(".nav-search");
    const searchBtn = document.querySelector(".search-button");
    const searchInput = search?.querySelector("input[type='search']");

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

    navToggle?.addEventListener("click", () => {
      nav?.classList.toggle("open");
    });

    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        nav?.classList.remove("open");
      })
    );

    searchBtn?.addEventListener("click", () => {
      search?.classList.add("open");
      searchInput?.focus();
    });

    searchInput?.addEventListener("blur", () => {
      setTimeout(() => search?.classList.remove("open"), 100);
    });
  }

  function initAdmin() {
    const header = document.querySelector(".site-header");
    const adminToggle = document.querySelector("[data-admin-toggle]");
    const isAdmin = localStorage.getItem("mcommon_admin") === "true";
    if (isAdmin) {
      document.documentElement.classList.add("admin-mode");
      adminToggle?.removeAttribute("hidden");
    } else {
      adminToggle?.setAttribute("hidden", "");
    }
    adminToggle?.addEventListener("click", () => {
      localStorage.removeItem("mcommon_admin");
      location.reload();
    });
  }

  function initFooter() {
    document.querySelector("#back-to-top")?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initChatbot() {
    const openBtn = document.querySelector("#chat-open");
    const modal = document.querySelector("#chat-modal");
    const closeBtn = document.querySelector("#chat-close");
    const form = document.querySelector("#chat-form");
    const input = document.querySelector("#chat-input");
    const messages = document.querySelector("#chat-messages");
    if (!openBtn || !modal || !closeBtn || !form || !input || !messages) return;

    openBtn.addEventListener("click", () => modal.classList.remove("hide"));
    closeBtn.addEventListener("click", () => modal.classList.add("hide"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hide");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      addMessage(text, true);
      input.value = "";
      setTimeout(() => {
        addMessage("AI: 準備中です。また後で使えるようになります。");
      }, 400);
    });

    function addMessage(text, isUser = false) {
      const row = document.createElement("div");
      row.className = `chat-row${isUser ? " user" : ""}`;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = isUser ? `あなた: ${text}` : text;
      row.appendChild(bubble);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
    }
  }
});
