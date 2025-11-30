(function () {
  window.initChatbot = function initChatbot() {
    const openBtn = document.querySelector("#chat-open");
    const modal = document.querySelector("#chat-modal");
    const closeBtn = document.querySelector("#chat-close");
    const form = document.querySelector("#chat-form");
    const input = document.querySelector("#chat-input");
    const messages = document.querySelector("#chat-messages");

    if (!openBtn || !modal || !closeBtn || !form || !input || !messages) return;

    const CHAT_API_ENDPOINT =
      "https://mu2kepsvd6anz4k3r5ft2avbt40ctjnc.lambda-url.ap-northeast-1.on.aws/";
    const history = [];

    function openChat() {
      modal.classList.remove("hide");
      openBtn.classList.add("hide");
      setTimeout(() => input.focus(), 50);
    }

    function closeChat() {
      modal.classList.add("hide");
      openBtn.classList.remove("hide");
    }

    openBtn.addEventListener("click", openChat);
    closeBtn.addEventListener("click", closeChat);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeChat();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hide")) {
        closeChat();
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      appendUserMessage(text);
      input.value = "";
      input.focus();

      history.push({ role: "user", content: text });

      const typingId = appendTypingIndicator();
      setSending(true);

      try {
        const payload = buildPayload(history);
        const res = await fetch(CHAT_API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        removeTypingIndicator(typingId);

        if (!res.ok) {
          appendAiMessage("エラーが発生しました。時間をおいて再試行してください。");
          setSending(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const replyText = data.reply || data.message || "回答を取得できませんでした。";

        appendAiMessage(replyText);
        history.push({ role: "assistant", content: replyText });
      } catch (err) {
        console.error(err);
        removeTypingIndicator(typingId);
        appendAiMessage("通信エラーが発生しました。ネットワークを確認してください。");
      } finally {
        setSending(false);
      }
    });

    function setSending(sending) {
      const submitBtn = form.querySelector('button[type="submit"]');
      input.disabled = sending;
      if (submitBtn) submitBtn.disabled = sending;
    }

    function appendUserMessage(text) {
      const row = document.createElement("div");
      row.className = "chat-row user";
      const bubble = document.createElement("div");
      bubble.className = "bubble bubble-user";
      bubble.textContent = text;
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollChatToBottom();
    }

    function appendAiMessage(text) {
      const row = document.createElement("div");
      row.className = "chat-row ai";
      const bubble = document.createElement("div");
      bubble.className = "bubble bubble-ai";
      bubble.textContent = text;
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollChatToBottom();
    }

    function appendTypingIndicator() {
      const id = "typing-" + Date.now();
      const row = document.createElement("div");
      row.className = "chat-row ai";
      row.dataset.typingId = id;
      const bubble = document.createElement("div");
      bubble.className = "bubble bubble-ai";
      bubble.textContent = "入力中…";
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollChatToBottom();
      return id;
    }

    function removeTypingIndicator(id) {
      const el = messages.querySelector(`[data-typing-id="${id}"]`);
      if (el) el.remove();
    }

    function scrollChatToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function buildPayload(frontHistory) {
      const systemPrompt = {
        role: "system",
        content:
          "あなたは mcommon.jp の案内をするチャットボットです。" +
          "主なページ: ホーム(/index.html)、科目一覧(/subjects.html)、ツール(/tools.html)、掲示板(/bbs.html)、お知らせ(/news.html)、お問い合わせ(/contact.html) など。" +
          "割り勘ツール、メモツール、2D/3Dグラフツールなど、ツールページもあります。" +
          "ユーザーが『〜どこ？』『〜を開きたい』と聞いたら、URLパスを日本語の説明と一緒に教えてください。" +
          "知らない機能は無理に作らず、『まだ対応していません』とはっきり伝えてください。",
      };

      const recent = frontHistory.slice(-10);

      return {
        model: "gpt-4o-mini",
        messages: [systemPrompt, ...recent],
      };
    }
  };
})();
