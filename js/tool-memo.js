document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector("#memo-title");
  const bodyEl = document.querySelector("#memo-body");
  const addBtn = document.querySelector("#memo-add");
  const listEl = document.querySelector("#memo-list");
  if (!titleEl || !bodyEl || !addBtn || !listEl) return;

  let memos = [];

  addBtn.addEventListener("click", () => {
    const title = titleEl.value.trim() || "無題";
    const body = bodyEl.value.trim();
    if (!body) return;
    memos.unshift({ id: Date.now(), title, body });
    titleEl.value = "";
    bodyEl.value = "";
    render();
  });

  function render() {
    listEl.innerHTML = memos
      .map(
        (memo) => `
        <article class="glass-card">
          <h4>${memo.title}</h4>
          <p class="muted">${new Date(memo.id).toLocaleString()}</p>
          <p>${memo.body}</p>
          <button class="btn" data-delete="${memo.id}">削除</button>
        </article>
      `
      )
      .join("");
    listEl.querySelectorAll("[data-delete]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.delete);
        memos = memos.filter((m) => m.id !== id);
        render();
      })
    );
  }
});
