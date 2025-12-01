import { newsItems } from "./news-data.js";

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.querySelector("#latest-news");
  const listContainer = document.querySelector("#news-list");
  const tabs = document.querySelectorAll("[data-tab]");
  const searchInput = document.querySelector("#news-search");
  const searchToggle = document.querySelector("#news-search-toggle");
  let currentCategory = "all";
  let currentKeyword = "";

  if (latestContainer) {
    const latest = [...newsItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7); // 最大7件 + 「すべて」カードで8枚に
    const cards = latest.map((item) => newsCard(item));
    cards.push(allNewsCard()); // 一番古い位置に「すべてのお知らせを見る」
    latestContainer.innerHTML = cards.join("");
  }

  const renderList = (category, keyword = "") => {
    if (!listContainer) return;
    const key = keyword.trim().toLowerCase();
    const filtered = newsItems
      .filter((item) => {
        const matchCategory = category === "all" ? true : item.category === category;
        const matchKeyword =
          !key ||
          item.title.toLowerCase().includes(key) ||
          item.body.toLowerCase().includes(key);
        return matchCategory && matchKeyword;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    listContainer.innerHTML = filtered.map((item) => newsRow(item)).join("");
  };

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.dataset.tab;
      renderList(currentCategory, currentKeyword);
    })
  );

  searchToggle?.addEventListener("click", () => {
    const bar = searchToggle.closest(".news-search-bar");
    bar?.classList.toggle("open");
    if (bar?.classList.contains("open")) {
      searchInput?.focus();
    } else {
      currentKeyword = "";
      if (searchInput) searchInput.value = "";
      renderList(currentCategory, currentKeyword);
    }
  });

  searchInput?.addEventListener("input", (e) => {
    currentKeyword = e.target.value || "";
    renderList(currentCategory, currentKeyword);
  });

  if (tabs.length) {
    currentCategory = "all";
    renderList(currentCategory, currentKeyword);
    tabs[0].classList.add("active");
  }
});

function newsCard(item) {
  return `
    <article class="glass-card news-card">
      <div class="chip">${item.category}</div>
      ${item.important ? '<span class="badge">IMPORTANT</span>' : ""}
      <h3>${item.title}</h3>
      <p class="muted">${item.date}</p>
      <p>${item.body}</p>
      ${item.link ? `<a class="btn" href="${item.link}">詳しく読む</a>` : ""}
    </article>
  `;
}

function newsRow(item) {
  return `
    <a class="news-row" href="${item.link || '#'}">
      <div class="news-row-main">
        <div class="news-row-title">
          <span class="chip">${item.category}</span>
          ${item.important ? '<span class="badge">IMPORTANT</span>' : ""}
          <span class="news-row-link">${item.title}</span>
        </div>
        <p class="news-row-body">${item.body}</p>
      </div>
      <div class="news-row-meta">
        <span class="muted">${item.date}</span>
      </div>
    </a>
  `;
}

function allNewsCard() {
  return `
    <article class="glass-card news-card">
      <div class="chip">一覧</div>
      <h3>すべてのお知らせを見る</h3>
      <p class="muted">過去のお知らせを含めて一覧表示します。</p>
      <a class="btn btn-primary" href="/news.html">一覧へ</a>
    </article>
  `;
}
