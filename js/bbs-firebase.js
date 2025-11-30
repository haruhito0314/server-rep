// /js/bbs-firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==== Lambda エンドポイント（投稿削除用） ====
const ADMIN_DELETE_ENDPOINT =
  "https://pvfxypahigmzsv4ri3mgupu6wa0qcuhe.lambda-url.ap-northeast-1.on.aws/";

// ==== Firebase 初期化 ====
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

// ==== DOM ====
const form = document.querySelector("#bbs-form");
const nameInput = document.querySelector("#bbs-name");
const bodyInput = document.querySelector("#bbs-body");
const submitBtn = document.querySelector("#bbs-submit");
const listEl = document.querySelector("#bbs-list");
const errorEl = document.querySelector("#bbs-error");
const searchInput = document.querySelector("#bbs-search");
const statPosts = document.querySelector("#board-posts");
const statLatest = document.querySelector("#board-latest");

// ==== 状態 ====
let replyUnsubs = {};
let listClickBound = false;
let currentPosts = [];

// ローカルの管理者モード
const isAdminSession = localStorage.getItem("mcommon_admin") === "true";

// ローカルユーザーID（いいね判定用）
function getOrCreateUserId() {
  const key = "mcommon_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = "user_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem(key, generated);
  return generated;
}
const userId = getOrCreateUserId();

if (form && bodyInput && listEl) {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));

  if (isAdminSession && nameInput) nameInput.value = "管理者";

  // 投稿ボタンの活性/非活性
  const updateSubmitState = () => {
    const ok = bodyInput.value.trim().length > 0;
    submitBtn.disabled = !ok;
  };
  form.addEventListener("input", updateSubmitState);

  // 新規投稿
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = bodyInput.value.trim();
    if (!body) return;

    const name = (nameInput?.value || "匿名ユーザー").trim() || "匿名ユーザー";

    submitBtn.disabled = true;
    clearError();

    try {
      await addDoc(postsRef, {
        text: body,
        name,
        isAdmin: isAdminSession,
        likes: 0,
        likedBy: [],
        timestamp: serverTimestamp(),
      });

      bodyInput.value = "";
    } catch (err) {
      console.error(err);
      showError("投稿に失敗しました。権限またはネットワークを確認してください。");
    } finally {
      // 入力状況に応じて再評価
      updateSubmitState();
    }
  });

  // 投稿一覧の購読
  onSnapshot(
    q,
    (snapshot) => {
      // 既存の replies リスナー解除
      Object.values(replyUnsubs).forEach((fn) => fn && fn());
      replyUnsubs = {};

      const posts = [];
      snapshot.forEach((d) => posts.push({ id: d.id, ...d.data() }));
      currentPosts = posts;

      updateStats(posts);
      clearError();
      renderList(filterPosts(posts, searchInput?.value || ""));
      attachReplyListeners(posts);
    },
    (err) => {
      console.error(err);
      showError("投稿を取得できません。権限設定またはネットワークを確認してください。");
    }
  );

  // 検索
  searchInput?.addEventListener("input", (e) => {
    renderList(filterPosts(currentPosts, e.target.value));
  });

  // 一覧描画
  function renderList(posts) {
    if (!posts.length) {
      listEl.innerHTML =
        '<div class="post-row"><div class="post-main muted">まだ投稿がありません。</div><div></div></div>';
      return;
    }

    listEl.innerHTML = posts
      .map((p) => {
        const nameLabel = escapeHtml(p.name || "匿名ユーザー");
        const crown = p.isAdmin
          ? '<span class="admin-star" title="管理者"></span>'
          : "";
        const deleteButton = isAdminSession
          ? `<button class="btn btn-ghost btn-xs post-delete" data-post-id="${p.id}">削除</button>`
          : "";
        const liked = Array.isArray(p.likedBy) && p.likedBy.includes(userId);
        const likes = Number.isFinite(p.likes) ? p.likes : 0;

        return `
        <div class="post-row" data-id="${p.id}">
          <div class="post-main">
            <p class="post-body">${escapeHtml(p.text || "")}</p>
            <button class="reply-toggle-area" data-reply-toggle="${p.id}">
              ↘︎ 返信 <span class="count" data-reply-count="${p.id}">0</span> 件
            </button>
          </div>
          <div class="post-side">
            <div class="post-side-name">
              ${nameLabel}${crown}
            </div>
            <div class="post-side-date">${formatDate(p.timestamp)}</div>
            <button
              class="btn btn-ghost btn-xs post-like"
              data-like-id="${p.id}"
              aria-pressed="${liked}"
            >
              ❤️ <span data-like-count="${p.id}">${likes}</span>
            </button>
            ${deleteButton}
          </div>
          <div class="reply-box hidden" data-reply-box="${p.id}">
            <div class="reply-list" data-replies="${p.id}"></div>
            <form class="reply-form" data-reply-form="${p.id}">
              <input
                class="input"
                type="text"
                data-reply-name
                placeholder="名前（任意）"
                value="${isAdminSession ? "管理者" : ""}"
              />
              <textarea
                class="input"
                data-reply-body
                placeholder="返信内容"
                required
              ></textarea>
              <button class="btn btn-primary" type="submit">返信を送る</button>
            </form>
          </div>
        </div>`;
      })
      .join("");

    // 一度だけイベントを張る
    if (!listClickBound) {
      listClickBound = true;

      listEl.addEventListener("click", (e) => {
        const target = e.target;

        // 返信開閉
        const toggle = target.closest("[data-reply-toggle]");
        if (toggle) {
          const id = toggle.getAttribute("data-reply-toggle");
          const box = listEl.querySelector(`[data-reply-box="${id}"]`);
          box?.classList.toggle("hidden");
          return;
        }

        // 投稿のいいね
        const likeBtn = target.closest(".post-like");
        if (likeBtn) {
          const postId = likeBtn.getAttribute("data-like-id");
          if (postId) handleLike(postId, likeBtn);
          return;
        }

        // 投稿削除（Lambda 経由）
        const delBtn = target.closest(".post-delete");
        if (delBtn) {
          const postId = delBtn.getAttribute("data-post-id");
          if (postId) handleDeletePost(postId);
          return;
        }

        // 返信のいいね
        const replyLikeBtn = target.closest(".reply-like");
        if (replyLikeBtn) {
          const postId = replyLikeBtn.getAttribute("data-reply-post-id");
          const replyId = replyLikeBtn.getAttribute("data-reply-like-id");
          if (postId && replyId) handleReplyLike(postId, replyId, replyLikeBtn);
          return;
        }

        // 返信削除（Firestore 直接。ルールで許可が必要）
        const replyDelBtn = target.closest(".reply-delete");
        if (replyDelBtn) {
          const postId = replyDelBtn.getAttribute("data-reply-post-id");
          const replyId = replyDelBtn.getAttribute("data-reply-id");
          if (postId && replyId) handleReplyDelete(postId, replyId);
        }
      });

      // 返信送信
      listEl.addEventListener("submit", async (e) => {
        const formEl = e.target.closest("[data-reply-form]");
        if (!formEl) return;
        e.preventDefault();

        const id = formEl.getAttribute("data-reply-form");
        const nameEl = formEl.querySelector("[data-reply-name]");
        const bodyEl = formEl.querySelector("[data-reply-body]");
        if (!bodyEl?.value.trim()) return;

        const name =
          (nameEl?.value || "匿名ユーザー").trim() || "匿名ユーザー";

        try {
          await addDoc(collection(db, "posts", id, "replies"), {
            name,
            text: bodyEl.value.trim(),
            timestamp: serverTimestamp(),
            isAdmin: isAdminSession,
            likes: 0,
            likedBy: [],
          });
          bodyEl.value = "";
        } catch (err) {
          console.error(err);
          showError("返信の投稿に失敗しました。");
        }
      });
    }
  }

  // 管理者削除（投稿全体を Lambda 経由で削除）
  async function handleDeletePost(postId) {
    if (!isAdminSession) {
      alert("管理者モードではありません。");
      return;
    }

    const password = window.prompt("管理者パスワードを入力してください");
    if (!password) return;

    try {
      const res = await fetch(ADMIN_DELETE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deletePost",
          pin: password,
          postId,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error("delete lambda error", res.status, data);
        alert(
          "投稿の削除に失敗しました（サーバー側エラー）。時間をおいて再度お試しください。"
        );
        return;
      }

      if (!data || !data.ok) {
        alert(
          (data && (data.error || data.message)) ||
            "パスワードが違うか、削除できませんでした。"
        );
        return;
      }

      alert("投稿を削除しました。"); // onSnapshot が自動で一覧を更新
    } catch (err) {
      console.error(err);
      alert("通信エラーが発生しました。");
    }
  }

  // 返信購読
  function attachReplyListeners(posts) {
    posts.forEach((p) => {
      const ref = query(
        collection(db, "posts", p.id, "replies"),
        orderBy("timestamp", "asc")
      );
      replyUnsubs[p.id] = onSnapshot(
        ref,
        (snap) => {
          const replies = snap.docs.map((d) => ({
            id: d.id,
            postId: p.id,
            ...d.data(),
          }));
          const countEl = listEl.querySelector(
            `[data-reply-count="${p.id}"]`
          );
          if (countEl) countEl.textContent = replies.length;
          const container = listEl.querySelector(
            `[data-replies="${p.id}"]`
          );
          renderReplies(replies, container);
        },
        (err) => {
          console.error(err);
          showError("返信を取得できません。");
        }
      );
    });
  }

  // 返信表示（いいね＆管理者削除付き）
  function renderReplies(replies, container) {
    if (!container) return;
    if (!replies.length) {
      container.innerHTML =
        '<p class="muted" style="margin:0;">返信はまだありません。</p>';
      return;
    }
    container.innerHTML = replies
      .map((r) => {
        const crown = r.isAdmin
          ? '<span class="admin-star" title="管理者"></span>'
          : "";
        const likes = Number.isFinite(r.likes) ? r.likes : 0;
        const liked =
          Array.isArray(r.likedBy) && r.likedBy.includes(userId);
        const likeKey = `${r.postId}__${r.id}`;
        const deleteBtn = isAdminSession
          ? `<button class="btn btn-ghost btn-xxs reply-delete" data-reply-id="${r.id}" data-reply-post-id="${r.postId}">削除</button>`
          : "";

        return `
        <div class="reply-item">
          <p class="reply-header">
            ${escapeHtml(r.name || "匿名ユーザー")}${crown}
            / ${formatDate(r.timestamp)}${r.isAdmin ? " ・管理者" : ""}
          </p>
          <p class="reply-text">${escapeHtml(r.text || "")}</p>
          <div class="reply-footer" style="margin-top:4px; display:flex; gap:8px; align-items:center;">
            <button
              class="btn btn-ghost btn-xxs reply-like"
              data-reply-like-id="${r.id}"
              data-reply-post-id="${r.postId}"
              aria-pressed="${liked}"
            >
              ❤️ <span data-reply-like-count="${likeKey}">${likes}</span>
            </button>
            ${deleteBtn}
          </div>
        </div>`;
      })
      .join("");
  }

  // 投稿いいね
  function handleLike(postId, btn) {
    const post = currentPosts.find((p) => p.id === postId);
    if (!post) return;
    const likedBy = Array.isArray(post.likedBy) ? [...post.likedBy] : [];
    const likes = Number.isFinite(post.likes) ? post.likes : 0;
    const already = likedBy.includes(userId);
    const newLikes = already ? Math.max(0, likes - 1) : likes + 1;
    const newLikedBy = already
      ? likedBy.filter((id) => id !== userId)
      : [...likedBy, userId];

    // UI 先行更新
    const countEl = listEl.querySelector(`[data-like-count="${postId}"]`);
    if (countEl) countEl.textContent = newLikes;
    btn.setAttribute("aria-pressed", String(!already));

    updateDoc(doc(db, "posts", postId), {
      likes: newLikes,
      likedBy: newLikedBy,
    }).catch((err) => {
      console.error(err);
      showError("いいねの更新に失敗しました。");
    });
  }

  // 返信いいね
  function handleReplyLike(postId, replyId, btn) {
    const key = `${postId}__${replyId}`;
    const countEl = listEl.querySelector(
      `[data-reply-like-count="${key}"]`
    );
    let currentLikes = countEl ? Number(countEl.textContent) || 0 : 0;
    const already = btn.getAttribute("aria-pressed") === "true";
    const newLikes = already ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // UI 先行更新
    if (countEl) countEl.textContent = newLikes;
    btn.setAttribute("aria-pressed", String(!already));

    const ref = doc(db, "posts", postId, "replies", replyId);
    const payload = already
      ? {
          likes: increment(-1),
          likedBy: arrayRemove(userId),
        }
      : {
          likes: increment(1),
          likedBy: arrayUnion(userId),
        };

    updateDoc(ref, payload).catch((err) => {
      console.error(err);
      showError("返信のいいねの更新に失敗しました。");
    });
  }

  // 返信削除（Firestore 直接。セキュリティルールで delete を許可しておく必要あり）
  async function handleReplyDelete(postId, replyId) {
  if (!isAdminSession) {
    alert("管理者モードではありません。");
    return;
  }
  if (!confirm("この返信を削除しますか？")) return;

  const password = window.prompt("管理者パスワードを入力してください");
  if (!password) return;

  try {
    const res = await fetch(ADMIN_DELETE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteReply",
        pin: password,
        postId,
        replyId,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      alert(
        (data && (data.error || data.message)) ||
          "パスワードが違うか、削除できませんでした。"
      );
      return;
    }
  } catch (e) {
    console.error(e);
    alert("通信エラーが発生しました。");
  }
}


  // ユーティリティ
  function filterPosts(posts, keyword) {
    const key = (keyword || "").trim().toLowerCase();
    if (!key) return posts;
    return posts.filter((p) => {
      const text = (p.text || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      return text.includes(key) || name.includes(key);
    });
  }

  function updateStats(posts) {
    if (statPosts) statPosts.textContent = posts.length;
    if (statLatest && posts[0]?.timestamp?.seconds) {
      statLatest.textContent = new Date(
        posts[0].timestamp.seconds * 1000
      ).toLocaleDateString();
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

  function showError(msg) {
    if (errorEl) errorEl.textContent = msg;
  }

  function clearError() {
    if (errorEl) errorEl.textContent = "";
  }
}
