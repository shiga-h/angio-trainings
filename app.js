// アンギオ部門 研修会・学会一覧 — クライアントサイドフィルタリング
(() => {
  "use strict";

  // 仕様で確定している 8 タグ（順序は表示順）
  const ALL_TAGS = [
    "循環器", "脳神経", "消化器", "その他アンギオ",
    "画像診断", "線量管理", "画像管理", "その他モダリティ",
  ];

  // 開催形式のバッジ用 CSS クラスマップ
  const FORMAT_CLASS = {
    "web":                  "fmt-web",
    "現地":                  "fmt-genchi",
    "現地（オンデマンドあり）": "fmt-genchi",
    "Hybrid":               "fmt-hybrid",
    "オンデマンド":           "fmt-ondemand",
    "未定":                  "fmt-undecided",
  };

  // ── 状態 ──────────────────────────────
  const state = {
    items: [],
    selectedMonth: null,   // "YYYY-MM" or null (=すべて)
    selectedTags: new Set(),
    keyword: "",
    showPast: false,
  };

  // ── 起動 ──────────────────────────────
  async function init() {
    try {
      const res = await fetch("data.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.items = await res.json();
    } catch (e) {
      document.getElementById("list").innerHTML =
        `<p class="empty-state">データの読み込みに失敗しました: ${escapeHtml(String(e))}</p>`;
      return;
    }

    renderMonthChips();
    renderTagChips();
    wireEvents();
    render();
  }

  // ── 月チップ ─────────────────────────
  function renderMonthChips() {
    const months = new Set();
    for (const item of state.items) {
      const m = monthOf(item.dateStart);
      if (m) months.add(m);
    }
    const sorted = Array.from(months).sort();
    const root = document.getElementById("monthChips");
    root.innerHTML = "";
    root.appendChild(makeChip("すべて", null, "month"));
    for (const m of sorted) {
      root.appendChild(makeChip(formatMonthLabel(m), m, "month"));
    }
    updateChipActiveStates();
  }

  // ── タグチップ ───────────────────────
  function renderTagChips() {
    // データ中に出現するタグだけを表示（仕様は8固定だが、データに無いものを出してもクリックしても何も出ないため）
    const present = new Set();
    for (const item of state.items) {
      for (const t of (item.tags || [])) present.add(t);
    }
    const ordered = ALL_TAGS.filter(t => present.has(t));
    const root = document.getElementById("tagChips");
    root.innerHTML = "";
    for (const t of ordered) {
      root.appendChild(makeChip(t, t, "tag"));
    }
    updateChipActiveStates();
  }

  function makeChip(label, value, kind) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "chip";
    el.dataset.kind = kind;
    el.dataset.value = value == null ? "" : value;
    el.textContent = label;
    return el;
  }

  function updateChipActiveStates() {
    for (const chip of document.querySelectorAll(".chip")) {
      const kind = chip.dataset.kind;
      const val = chip.dataset.value;
      let active = false;
      if (kind === "month") {
        active = (val === "" && state.selectedMonth === null) ||
                 (val !== "" && state.selectedMonth === val);
      } else if (kind === "tag") {
        active = state.selectedTags.has(val);
      }
      chip.classList.toggle("active", active);
    }
  }

  // ── イベント ───────────────────────
  function wireEvents() {
    document.getElementById("monthChips").addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const val = chip.dataset.value;
      state.selectedMonth = (val === "") ? null : val;
      updateChipActiveStates();
      render();
    });

    document.getElementById("tagChips").addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const val = chip.dataset.value;
      if (state.selectedTags.has(val)) state.selectedTags.delete(val);
      else                              state.selectedTags.add(val);
      updateChipActiveStates();
      render();
    });

    document.getElementById("searchInput").addEventListener("input", e => {
      state.keyword = e.target.value.trim();
      render();
    });

    document.getElementById("showPastToggle").addEventListener("change", e => {
      state.showPast = e.target.checked;
      render();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      state.selectedMonth = null;
      state.selectedTags.clear();
      state.keyword = "";
      state.showPast = false;
      document.getElementById("searchInput").value = "";
      document.getElementById("showPastToggle").checked = false;
      updateChipActiveStates();
      render();
    });
  }

  // ── 描画 ──────────────────────────
  function render() {
    const today = todayISO();
    const filtered = state.items.filter(item => {
      // 月
      if (state.selectedMonth) {
        if (monthOf(item.dateStart) !== state.selectedMonth) return false;
      }
      // タグ OR
      if (state.selectedTags.size > 0) {
        const tags = item.tags || [];
        let hit = false;
        for (const t of tags) if (state.selectedTags.has(t)) { hit = true; break; }
        if (!hit) return false;
      }
      // キーワード（名称・テーマ）
      if (state.keyword) {
        const k = state.keyword.toLowerCase();
        const haystack = `${item.name || ""} ${item.theme || ""}`.toLowerCase();
        if (!haystack.includes(k)) return false;
      }
      // 過去除外（デフォルト）
      if (!state.showPast && isPast(item, today)) return false;
      return true;
    });

    // 並び替え: 開始日昇順、日付不明は末尾
    filtered.sort((a, b) => {
      const da = a.dateStart || "9999-99-99";
      const db = b.dateStart || "9999-99-99";
      return da.localeCompare(db);
    });

    const list = document.getElementById("list");
    list.innerHTML = "";
    for (const item of filtered) {
      list.appendChild(renderCard(item, today));
    }
    document.getElementById("emptyState").hidden = filtered.length > 0;
    document.getElementById("resultCount").textContent = String(filtered.length);
  }

  function renderCard(item, today) {
    const card = document.createElement("article");
    card.className = "card";
    if (isPast(item, today)) card.classList.add("past");

    const dateLine = document.createElement("div");
    dateLine.className = "card-date";
    dateLine.textContent = formatDateRange(item.dateStart, item.dateEnd);
    if (item.time) {
      const t = document.createElement("span");
      t.className = "card-time";
      t.textContent = item.time;
      dateLine.appendChild(t);
    }
    card.appendChild(dateLine);

    const h = document.createElement("h2");
    h.className = "card-name";
    h.textContent = item.name;
    card.appendChild(h);

    if (item.theme) {
      const p = document.createElement("p");
      p.className = "card-theme";
      p.textContent = item.theme;
      card.appendChild(p);
    }

    // バッジ群（開催形式 + タグ）
    const badges = document.createElement("div");
    badges.className = "badge-group";
    if (item.format) {
      const b = document.createElement("span");
      const cls = FORMAT_CLASS[item.format] || "fmt-undecided";
      b.className = `badge ${cls}`;
      b.textContent = item.format;
      badges.appendChild(b);
    }
    for (const tag of (item.tags || [])) {
      const b = document.createElement("span");
      b.className = "badge tag";
      b.textContent = tag;
      badges.appendChild(b);
    }
    card.appendChild(badges);

    if (item.loc) {
      const d = document.createElement("div");
      d.className = "card-loc";
      d.textContent = item.loc;
      card.appendChild(d);
    }
    if (item.fee) {
      const d = document.createElement("div");
      d.className = "card-fee";
      d.textContent = item.fee;
      card.appendChild(d);
    }
    if (item.points) {
      const details = document.createElement("details");
      details.className = "points";
      const summary = document.createElement("summary");
      summary.textContent = "認定単位を見る";
      details.appendChild(summary);
      const body = document.createElement("div");
      body.className = "points-body";
      body.textContent = item.points;
      details.appendChild(body);
      card.appendChild(details);
    }
    if (item.url) {
      const a = document.createElement("a");
      a.className = "card-link";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "HPを開く";
      card.appendChild(a);
    }
    return card;
  }

  // ── ユーティリティ ────────────────────
  function monthOf(iso) {
    if (!iso || typeof iso !== "string") return null;
    const m = iso.match(/^(\d{4})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : null;
  }

  function formatMonthLabel(ym) {
    const [y, m] = ym.split("-");
    return `${Number(y)}年${Number(m)}月`;
  }

  function formatDateRange(start, end) {
    const s = formatDateJa(start);
    const e = formatDateJa(end);
    if (s && e) return `${s} 〜 ${e}`;
    if (s)      return s;
    return "日程未定";
  }

  function formatDateJa(iso) {
    if (!iso) return "";
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    const d = new Date(`${iso}T00:00:00`);
    const w = ["日","月","火","水","木","金","土"][d.getDay()];
    return `${Number(m[2])}/${Number(m[3])}（${w}）`;
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function isPast(item, today) {
    // 日付なし → 常に表示（過去判定しない）
    const ref = item.dateEnd || item.dateStart;
    if (!ref) return false;
    return ref < today;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  // ── 起動 ──────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
