(function () {
  // 要素取得
  const openBtn = document.getElementById("chat-open");
  const modal = document.getElementById("chat-modal");
  const closeBtn = document.getElementById("chat-close");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const sendBtn = document.getElementById("chat-send");

  if (!openBtn || !modal || !closeBtn || !form || !input || !messages) return;

  // 設定
  const PROXY_URL = "https://blkyahxl6wtzvk2ugmnmlhmpvy0clpks.lambda-url.ap-northeast-1.on.aws/";
  const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=35.1815&longitude=136.9066&timezone=Asia%2FTokyo&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&hourly=precipitation_probability,relativehumidity_2m&forecast_days=1";
  const WEATHER_CODE_MAP = {
    0: "快晴",
    1: "晴れ",
    2: "薄曇り",
    3: "曇り",
    45: "霧",
    48: "着氷性の霧",
    51: "霧雨 (弱い)",
    53: "霧雨 (中程度)",
    55: "霧雨 (強い)",
    56: "着氷性の霧雨 (弱い)",
    57: "着氷性の霧雨 (強い)",
    61: "雨 (弱い)",
    63: "雨 (中程度)",
    65: "雨 (強い)",
    66: "着氷性の雨 (弱い)",
    67: "着氷性の雨 (強い)",
    71: "雪 (弱い)",
    73: "雪 (中程度)",
    75: "雪 (強い)",
    77: "みぞれ / 雪粒",
    80: "にわか雨 (弱い)",
    81: "にわか雨 (中程度)",
    82: "にわか雨 (激しい)",
    85: "にわか雪 (弱い)",
    86: "にわか雪 (強い)",
    95: "雷雨 (弱い/中程度)",
    96: "雷雨と雹 (弱い)",
    99: "雷雨と雹 (強い)",
  };

  const LOCAL_FAQ = [
    {
      patterns: [/mコモンとは/i, /mcommon/i, /サイト.*使い方/i],
      text: "Mコモンは 2D/3D グラフ、分子ビューア、変換ツール、割り勘ツール、クイックメモ、掲示板などをまとめた学習ポータルです。",
      card: { title: "トップページ", description: "最新情報と主要ツール", url: "/index.html" },
    },
    {
      patterns: [/科目(一覧|選択)/i, /subject/i],
      text: "科目別のまとめは科目選択ページに集約しています。",
      card: { title: "科目選択", description: "数学・物理・化学などの教材ページ", url: "/subjects.html" },
    },
    {
      patterns: [/2d.*グラフ/i, /plot/i],
      text: "2D グラフツールでは y=f(x) や媒介表示をブラウザで描画できます。",
      card: { title: "グラフツール (2D/3D)", description: "2D/3D を切り替えて描画", url: "/tools/tool-graph.html" },
    },
    {
      patterns: [/3d.*グラフ/i, /曲面/i],
      text: "3D 曲面ツールでは z=f(x,y) や暗黙曲面を Plotly で表示します。",
      card: { title: "グラフツール (2D/3D)", description: "3D サーフェス表示", url: "/tools/tool-graph.html" },
    },
    {
      patterns: [/分子ビューア/i, /化学式/i, /分子/i],
      text: "分子ビューアは代表的な分子構造を確認できます。",
      card: { title: "分子ビューア", description: "分子構造の可視化", url: "/tools/tool-molecule.html" },
    },
    {
      patterns: [/変換/i, /ffmpeg/i, /コンバータ/i],
      text: "メディア変換ツールで画像・音声を変換できます。",
      card: { title: "メディア変換", description: "画像・音声フォーマット変換", url: "/tools/tool-convert.html" },
    },
    {
      patterns: [/割り勘/i, /split/i],
      text: "割り勘ツールでは人数と金額を入れて公平に計算します。",
      card: { title: "割り勘ツール", description: "支払いの計算を補助", url: "/tools/tool-split.html" },
    },
    {
      patterns: [/メモ/i, /memo/i, /ノート/i],
      text: "メモツールでシンプルに記録できます。",
      card: { title: "メモツール", description: "シンプルなメモパッド", url: "/tools/tool-memo.html" },
    },
    {
      patterns: [/掲示板/i, /board/i, /コミュニティ/i],
      text: "掲示板では要望や質問を匿名でも投稿できます。",
      card: { title: "掲示板", description: "コミュニティで意見交換", url: "/bbs.html" },
    },
  ];

  const NAV_GUIDE = [
    {
      keywords: ["graph", "グラフ", "2d", "3d"],
      title: "グラフツール (2D/3D)",
      description: "2D/3D グラフを描画",
      url: "/tools/tool-graph.html",
    },
    {
      keywords: ["molecule", "分子", "化学"],
      title: "分子ビューア",
      description: "分子構造を可視化",
      url: "/tools/tool-molecule.html",
    },
    {
      keywords: ["convert", "変換", "ffmpeg", "音声", "画像"],
      title: "メディア変換",
      description: "画像・音声フォーマット変換",
      url: "/tools/tool-convert.html",
    },
    {
      keywords: ["memo", "メモ"],
      title: "メモツール",
      description: "シンプルメモパッド",
      url: "/tools/tool-memo.html",
    },
    {
      keywords: ["割り勘", "split", "会計"],
      title: "割り勘ツール",
      description: "支払い計算",
      url: "/tools/tool-split.html",
    },
    {
      keywords: ["掲示板", "bbs", "board"],
      title: "掲示板",
      description: "質問・共有スペース",
      url: "/bbs.html",
    },
    {
      keywords: ["科目", "subjects", "授業"],
      title: "科目一覧",
      description: "科目ページへ",
      url: "/subjects.html",
    },
  ];

  // UI 操作
  openBtn.addEventListener("click", () => {
    modal.classList.remove("hide");
    openBtn.classList.add("hide");
    setTimeout(() => input.focus(), 30);
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hide");
    openBtn.classList.remove("hide");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hide");
      openBtn.classList.remove("hide");
    }
  });

  // メッセージ描画
  function addMessage(text, sender = "ai", typing = false) {
    const row = document.createElement("div");
    row.className = sender === "user" ? "chat-row user" : "chat-row ai";
    const bubble = document.createElement("div");
    bubble.className = sender === "user" ? "bubble bubble-user" : "bubble bubble-ai";
    if (typing) bubble.dataset.typing = "true";
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();
    return row;
  }

  function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function setLoading(isLoading) {
    input.disabled = isLoading;
    if (sendBtn) sendBtn.disabled = isLoading;
  }

  // ローカルマッチ
  function matchLocalFAQ(msg) {
    for (const entry of LOCAL_FAQ) {
      if (entry.patterns.some((p) => p.test(msg))) return entry;
    }
    return null;
  }

  function findNavigationCards(msg) {
    const lower = msg.toLowerCase();
    const cards = [];
    NAV_GUIDE.forEach((entry) => {
      const hit = entry.keywords?.some((kw) => lower.includes(kw.toLowerCase()));
      if (hit) cards.push({ title: entry.title, description: entry.description, url: entry.url });
    });
    return cards.slice(0, 5);
  }

  function addCardMessage(cards) {
    if (!cards || !cards.length) return;
    const wrapper = document.createElement("div");
    wrapper.className = "chat-row ai";
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-ai";
    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";
    cards.forEach((c) => {
      const item = document.createElement("li");
      item.style.marginBottom = "6px";
      const link = document.createElement("a");
      link.href = c.url;
      link.textContent = `${c.title} – ${c.description}`;
      link.style.color = "#0a84ff";
      link.style.textDecoration = "none";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.appendChild(link);
      list.appendChild(item);
    });
    bubble.appendChild(list);
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    scrollToBottom();
  }

  // 天気
  async function fetchNagoyaWeather() {
    const res = await fetch(WEATHER_API_URL);
    if (!res.ok) throw new Error("天気APIエラー");
    return res.json();
  }

  function formatWeather(data) {
    const cw = data?.current_weather;
    if (!cw) return "天気情報を取得できませんでした。";
    const desc = WEATHER_CODE_MAP[cw.weathercode] || "天気情報";
    const t = cw.temperature;
    return `名古屋の現在 (${cw.time}): ${desc} / 気温 ${t}℃`;
  }

  // API
  async function sendToProxy(message) {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      let errText = "";
      try {
        errText = (await res.json()).error || "";
      } catch (e) {
        errText = await res.text();
      }
      throw new Error(`proxy error ${res.status} ${errText}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "回答を解析できませんでした。";
  }

  // 送信ハンドラ
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const typingRow = addMessage("思考中...", "ai", true);
    setLoading(true);

    try {
      // FAQ/ナビ先に回答
      const faq = matchLocalFAQ(text);
      if (faq) {
        typingRow.querySelector(".bubble").textContent = faq.text || "関連情報です。";
        if (faq.card) addCardMessage(Array.isArray(faq.card) ? faq.card : [faq.card]);
        typingRow.querySelector(".bubble").removeAttribute("data-typing");
        return;
      }
      const nav = findNavigationCards(text);
      if (nav.length) {
        typingRow.remove();
        addCardMessage(nav);
        return;
      }

      // 天気（名古屋）キーワード
      if (/天気|名古屋/.test(text)) {
        const weather = await fetchNagoyaWeather();
        typingRow.querySelector(".bubble").textContent = formatWeather(weather);
        typingRow.querySelector(".bubble").removeAttribute("data-typing");
        return;
      }

      // プロキシ経由
      const reply = await sendToProxy(text);
      typingRow.querySelector(".bubble").textContent = reply;
    } catch (err) {
      console.error(err);
      typingRow.querySelector(".bubble").textContent =
        "AIアシスタントは現在応答できません。以下のリンクをご利用ください。";
      const nav = findNavigationCards(text);
      if (nav.length) addCardMessage(nav);
    } finally {
      typingRow.querySelector(".bubble").removeAttribute("data-typing");
      setLoading(false);
      scrollToBottom();
    }
  });
})();
