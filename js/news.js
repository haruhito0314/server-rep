import { newsItems } from "./news-data.js";

document.addEventListener("DOMContentLoaded", () => {
  const latestContainer = document.querySelector("#latest-news");
  const listContainer = document.querySelector("#news-list");
  const tabs = document.querySelectorAll("[data-tab]");

  if (latestContainer) {
    const latest = [...newsItems]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    latestContainer.innerHTML = latest.map((item) => newsCard(item)).join("");
  }

  const renderList = (category) => {
    if (!listContainer) return;
    const filtered =
      category === "all"
        ? newsItems
        : newsItems.filter((item) => item.category === category);
    listContainer.innerHTML = filtered.map((item) => newsCard(item)).join("");
  };

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderList(tab.dataset.tab);
    })
  );

  if (tabs.length) {
    renderList("all");
    tabs[0].classList.add("active");
  }
});

function newsCard(item) {
  return `
    <article class="glass-card news-card">
      ${item.important ? '<span class="badge">IMPORTANT</span>' : ""}
      <div class="chip">${item.category}</div>
      <h3>${item.title}</h3>
      <p class="muted">${item.date}</p>
      <p>${item.body}</p>
    </article>
  `;
}
