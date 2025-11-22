import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVLx4l4tsEmu3EGTs5OZSYxq-LQPm633k",
  authDomain: "mcommon-board.firebaseapp.com",
  projectId: "mcommon-board",
  storageBucket: "mcommon-board.firebasestorage.app",
  messagingSenderId: "256138607069",
  appId: "1:256138607069:web:e2d2b89b35fcee506cde34",
  measurementId: "G-9V1BS1YFK4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.querySelector("#bbs-form");
const nameInput = document.querySelector("#bbs-name");
const titleInput = document.querySelector("#bbs-title");
const bodyInput = document.querySelector("#bbs-body");
const submitBtn = document.querySelector("#bbs-submit");
const listEl = document.querySelector("#bbs-list");
const detailEl = document.querySelector("#bbs-detail");

if (form && titleInput && bodyInput && listEl && detailEl) {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("createdAt", "desc"));

  const isAdmin = localStorage.getItem("mcommon_admin") === "true";
  if (isAdmin && nameInput) nameInput.value = "管理者";

  form.addEventListener("input", () => {
    const ok = titleInput.value.trim() && bodyInput.value.trim();
    submitBtn.disabled = !ok;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const name = (nameInput?.value || "名無し").trim() || "名無し";
    if (!title || !body) return;
    submitBtn.disabled = true;
    try {
      await addDoc(postsRef, {
        title,
        body,
        name,
        admin: isAdmin,
        createdAt: serverTimestamp(),
      });
      form.reset();
      submitBtn.disabled = true;
      if (isAdmin && nameInput) nameInput.value = "管理者";
    } catch (err) {
      alert("投稿に失敗しました。ネットワークを確認してください。");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  });

  onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((doc) => posts.push({ id: doc.id, ...doc.data() }));
    renderList(posts);
  });

  function renderList(posts) {
    if (!posts.length) {
      listEl.innerHTML = '<p class="muted">まだ投稿がありません。</p>';
      detailEl.innerHTML = '<p class="muted">投稿を選択してください。</p>';
      return;
    }
    listEl.innerHTML = posts
      .map(
        (p) => `
        <article class="glass-card" data-id="${p.id}">
          <h4>${escapeHtml(p.title)}</h4>
          <p class="muted">${p.name || "名無し"} / ${formatDate(p.createdAt)}</p>
          <p class="muted">${escapeHtml(p.body).slice(0, 80)}${p.body?.length > 80 ? "..." : ""}</p>
          <button class="btn" data-detail="${p.id}">詳細</button>
        </article>
      `
      )
      .join("");
    listEl.querySelectorAll("[data-detail]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const target = posts.find((p) => p.id === btn.dataset.detail);
        if (target) renderDetail(target);
      })
    );
    renderDetail(posts[0]);
  }

  function renderDetail(p) {
    detailEl.innerHTML = `
      <h4>${escapeHtml(p.title)}</h4>
      <p class="muted">${p.name || "名無し"} / ${formatDate(p.createdAt)}</p>
      <p style="white-space: pre-wrap;">${escapeHtml(p.body)}</p>
    `;
    if (p.admin) {
      detailEl.innerHTML += `<p class="muted">管理者投稿</p>`;
    }
  }

  function formatDate(ts) {
    if (!ts?.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  function escapeHtml(str = "") {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
