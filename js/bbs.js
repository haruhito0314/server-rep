document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.querySelector("#bbs-list");
  const detailEl = document.querySelector("#bbs-detail");
  const form = document.querySelector("#bbs-form");
  const submitBtn = document.querySelector("#bbs-submit");
  const nameInput = document.querySelector("#bbs-name");
  const titleInput = document.querySelector("#bbs-title");
  const bodyInput = document.querySelector("#bbs-body");
  const imageInput = document.querySelector("#bbs-image");
  if (!listEl || !detailEl || !form) return;

  const isAdmin = localStorage.getItem("mcommon_admin") === "true";
  if (isAdmin && nameInput) nameInput.value = "管理者";

  const posts = [
    {
      id: 1,
      name: "Alex",
      title: "微分積分のおすすめ教材",
      body: "図解が多いものが分かりやすいです。おすすめありますか？",
      date: "2025-10-20 12:00",
      likes: 2,
      admin: false,
    },
    {
      id: 2,
      name: "管理者",
      title: "メンテナンス予定",
      body: "明日深夜に短時間の停止があります。詳細はお知らせをご覧ください。",
      date: "2025-10-19 22:00",
      likes: 5,
      admin: true,
    },
  ];

  form.addEventListener("input", () => {
    const titleOk = titleInput.value.trim().length > 0;
    const bodyOk = bodyInput.value.trim().length > 0;
    submitBtn.disabled = !(titleOk && bodyOk);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newPost = {
      id: Date.now(),
      name: nameInput.value.trim() || "名無し",
      title: titleInput.value.trim(),
      body: bodyInput.value.trim(),
      date: new Date().toLocaleString(),
      likes: 0,
      admin: isAdmin,
      image: imageInput.files?.[0]?.name,
    };
    posts.unshift(newPost);
    render(posts);
    form.reset();
    submitBtn.disabled = true;
    if (isAdmin && nameInput) nameInput.value = "管理者";
  });

  function render(data) {
    listEl.innerHTML = data
      .map(
        (post) => `
        <article class="glass-card">
          <h4>${post.title}</h4>
          <p class="muted">${post.date}</p>
          <p>${post.body.slice(0, 80)}${post.body.length > 80 ? "..." : ""}</p>
          <div style="display:flex;gap:var(--space-sm);align-items:center;">
            <span class="chip">${post.admin ? "管理者" : post.name}</span>
            ${post.image ? `<span class="chip">画像: ${post.image}</span>` : ""}
          </div>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);">
            <button class="btn" data-like="${post.id}">👍 ${post.likes}</button>
            <button class="btn btn-primary" data-detail="${post.id}">詳細・返信を見る</button>
          </div>
        </article>
      `
      )
      .join("");

    listEl.querySelectorAll("[data-like]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.like);
        const target = posts.find((p) => p.id === id);
        if (target) {
          target.likes += 1;
          render(posts);
        }
      })
    );

    listEl.querySelectorAll("[data-detail]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.detail);
        const target = posts.find((p) => p.id === id);
        if (target) showDetail(target);
      })
    );
  }

  function showDetail(post) {
    detailEl.innerHTML = `
      <h4>${post.title}</h4>
      <p class="muted">${post.date}</p>
      <p>${post.body}</p>
      <div class="chip">${post.admin ? "管理者" : post.name}</div>
      ${post.image ? `<p class="muted">画像: ${post.image}</p>` : ""}
      <div style="margin-top:var(--space-sm);">
        <button class="btn">返信（ダミー）</button>
      </div>
    `;
  }

  render(posts);
});
