const SHEET_CSV_URL = window.SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuKN-1KWEw6ZC251S2xzdYsh-wYIdi1TfePMUrg_KfJpHSK9n6knLhJyhHS-BNAzx45du84NZbK2v2/pub?gid=0&single=true&output=csv";

const THUMBNAIL_MODE = "screenshot"; // "screenshot" or "favicon"

const SAMPLE_WORKS = [
  {
    title: "YMM4 Plugin Catalog",
    room: "道具室",
    type: "Webサイト",
    url: "https://modurili.github.io/YMM4Plugin/",
    date: "2026-03-23",
    tags: "YMM4,プラグイン,カタログ,AI",
    description: "YMM4プラグインを一覧で検索、閲覧できるカタログサイト。",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
  {
    title: "日本語検索ワード自動英訳拡張機能",
    room: "道具室",
    type: "拡張機能",
    url: "https://note.com/modurili/n/n50ffd1fa8375",
    date: "2026-01-27",
    tags: "拡張機能,検索,AI,配布",
    description: "日本語の検索ワードを英語にして検索するChrome拡張機能。",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
  {
    title: "テロップアニメーション30選",
    room: "素材配布室",
    type: "YMM4素材",
    url: "https://modurili.booth.pm/items/6058221",
    date: "2024-08-31",
    tags: "YMM4,テロップ,テンプレート,BOOTH",
    description: "YMM4向けテロップアニメーションのテンプレート集。",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
  {
    title: "超キラキラさせる素材440種",
    room: "素材配布室",
    type: "YMM4素材",
    url: "https://modurili.booth.pm/items/6527444",
    date: "2025-01-28",
    tags: "YMM4,素材,PNG,BOOTH",
    description: "動画やサムネをきらっとさせるPNG素材とYMM4プロジェクト。",
    thumbnail: "",
    featured: "FALSE",
    status: "public",
  },
  {
    title: "YMM4 Plugin Catalogを作った話",
    room: "記録室",
    type: "note",
    url: "https://note.com/modurili/n/n4ade1b49c962",
    date: "2026-03-23",
    tags: "note,YMM4,制作記録,AI",
    description: "プラグイン一覧サイトをAIで作った制作メモ。",
    thumbnail: "",
    featured: "FALSE",
    status: "public",
  },
  {
    title: "もづりぃショップ",
    room: "売店",
    type: "BOOTH",
    url: "https://modurili.booth.pm/",
    date: "2024-01-01",
    tags: "BOOTH,素材,グッズ,配布",
    description: "YMM4素材、テンプレート、グッズなどの配布場所。",
    thumbnail: "",
    featured: "FALSE",
    status: "public",
  },
];

const ROOM_DETAILS = {
  展示室: "代表作や最初に見てほしいもの。",
  素材配布室: "YMM4素材、テンプレ、PNG素材など。",
  道具室: "サイト、拡張機能、プラグイン、便利ツール。",
  記録室: "note、制作メモ、試行錯誤のログ。",
  売店: "BOOTH、グッズ、有料素材への入口。",
  リンク室: "SNS、動画、各種プロフィールへの入口。",
  実験室: "試作、検証、まだ分類しにくいもの。",
};

const state = {
  works: [],
  activeRoom: "すべて",
  query: "",
  selectedId: "",
};

const elements = {
  desktopIcons: document.querySelector("#desktop-icons"),
  roomFilters: document.querySelector("#room-filters"),
  workList: document.querySelector("#work-list"),
  featuredWorks: document.querySelector("#featured-works"),
  workPreview: document.querySelector("#work-preview"),
  searchInput: document.querySelector("#search-input"),
  emptyMessage: document.querySelector("#empty-message"),
  totalCount: document.querySelector("#total-count"),
  featuredCount: document.querySelector("#featured-count"),
  roomCount: document.querySelector("#room-count"),
  sourceNote: document.querySelector("#source-note"),
  clock: document.querySelector("#clock"),
};

function normalizeWork(work, index) {
  const description = clean(work.description || work.discription || work.desc);
  const title = clean(work.title || work.name);

  return {
    id: clean(work.id) || slugify(`${title}-${index}`),
    title,
    room: clean(work.room) || "展示室",
    type: clean(work.type) || "item",
    url: clean(work.url || work.link),
    date: clean(work.date),
    tags: clean(work.tags),
    description,
    thumbnail: clean(work.thumbnail || work.thumb || work.image),
    featured: clean(work.featured).toUpperCase() === "TRUE",
    status: clean(work.status || "public").toLowerCase(),
  };
}

function clean(value) {
  return String(value ?? "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function getRooms(works) {
  return [...new Set(works.map((work) => work.room))].filter(Boolean);
}

function getTags(work) {
  return work.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatDate(dateText) {
  if (!dateText) return "";
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateText;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getFaviconUrl(url) {
  if (!url) return "";
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`;
}

function getAutoThumbnailUrl(work) {
  if (work.thumbnail) return work.thumbnail;
  if (!work.url || THUMBNAIL_MODE !== "screenshot") return "";
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(work.url)}?w=640`;
}

function getFileLabel(work) {
  const type = work.type.toLowerCase();
  if (type.includes("note")) return "N";
  if (type.includes("booth")) return "B";
  if (type.includes("web")) return "W";
  if (type.includes("素材")) return "S";
  if (type.includes("拡張")) return "E";
  return work.title.slice(0, 1).toUpperCase();
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  return rows.map((values) =>
    headers.reduce((item, header, index) => {
      item[header] = values[index] ?? "";
      return item;
    }, {}),
  );
}

async function loadWorks() {
  if (!SHEET_CSV_URL) {
    elements.sourceNote.textContent = "sample data";
    return SAMPLE_WORKS.map(normalizeWork);
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
    const csvText = await response.text();
    elements.sourceNote.textContent = "google spreadsheet";
    return parseCsv(csvText).map(normalizeWork);
  } catch (error) {
    console.warn(error);
    elements.sourceNote.textContent = "sample data / csv error";
    return SAMPLE_WORKS.map(normalizeWork);
  }
}

function filterWorks() {
  const query = state.query.toLowerCase();
  return state.works.filter((work) => {
    const roomMatches = state.activeRoom === "すべて" || work.room === state.activeRoom;
    const searchable = `${work.title} ${work.room} ${work.type} ${work.description} ${work.tags}`.toLowerCase();
    return roomMatches && searchable.includes(query);
  });
}

function renderDesktopIcons(works) {
  const rooms = getRooms(works);
  elements.desktopIcons.innerHTML = rooms
    .map((room) => {
      const count = works.filter((work) => work.room === room).length;
      const activeClass = state.activeRoom === room ? " is-active" : "";
      return `
        <button class="desktop-icon${activeClass}" type="button" data-room="${escapeAttribute(room)}">
          <span class="icon-symbol">${escapeHtml(room.slice(0, 1))}</span>
          <span>${escapeHtml(room)}</span>
          <small>${count} items</small>
        </button>
      `;
    })
    .join("");
}

function renderFilters(works) {
  const rooms = ["すべて", ...getRooms(works)];
  elements.roomFilters.innerHTML = rooms
    .map((room) => {
      const count = room === "すべて" ? works.length : works.filter((work) => work.room === room).length;
      const activeClass = state.activeRoom === room ? " is-active" : "";
      return `
        <button class="folder-button${activeClass}" type="button" data-room="${escapeAttribute(room)}">
          <span>${room === "すべて" ? "□" : "▣"}</span>
          <span>${escapeHtml(room)}</span>
          <small>${count}</small>
        </button>
      `;
    })
    .join("");
}

function renderFeatured(works) {
  const featured = works
    .filter((work) => work.featured)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const items = featured.length ? featured : works.slice(0, 3);

  elements.featuredWorks.innerHTML = items.map(renderFeaturedCard).join("");
}

function renderFeaturedCard(work) {
  return `
    <article class="featured-card" data-work-id="${escapeAttribute(work.id)}" tabindex="0">
      ${renderThumbnail(work)}
      <div class="featured-body">
        <div class="meta-line">
          <span>${escapeHtml(work.room)}</span>
          <span>${escapeHtml(work.type)}</span>
        </div>
        <h3>${escapeHtml(work.title)}</h3>
      </div>
    </article>
  `;
}

function renderWorkList(works) {
  elements.workList.innerHTML = works.map(renderWorkRow).join("");
}

function renderWorkRow(work) {
  const selectedClass = state.selectedId === work.id ? " is-selected" : "";
  return `
    <article class="file-row${selectedClass}" data-work-id="${escapeAttribute(work.id)}" tabindex="0">
      <span class="file-icon">${escapeHtml(getFileLabel(work))}</span>
      <div class="file-title">
        <strong>${escapeHtml(work.title)}</strong>
        <small>${escapeHtml(work.description || ROOM_DETAILS[work.room] || "")}</small>
      </div>
      <span class="file-type">${escapeHtml(work.type)}</span>
      <span class="file-date">${escapeHtml(formatDate(work.date))}</span>
    </article>
  `;
}

function renderThumbnail(work) {
  const thumbnailUrl = getAutoThumbnailUrl(work);
  const faviconUrl = getFaviconUrl(work.url);
  const label = getFileLabel(work);

  return `
    <div class="thumb-frame${thumbnailUrl ? "" : " is-fallback"}">
      ${
        thumbnailUrl
          ? `<img src="${escapeAttribute(thumbnailUrl)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('is-fallback'); this.remove();" />`
          : ""
      }
      <span class="fallback-thumb">${escapeHtml(label)}</span>
      ${
        faviconUrl
          ? `<span class="favicon-chip"><img src="${escapeAttribute(faviconUrl)}" alt="" loading="lazy" /></span>`
          : ""
      }
    </div>
  `;
}

function renderPreview(work) {
  if (!work) {
    elements.workPreview.innerHTML = `<p class="preview-empty">作品を選ぶと詳細が表示されます。</p>`;
    return;
  }

  const tags = getTags(work);
  elements.workPreview.innerHTML = `
    <article class="preview-card">
      ${renderThumbnail(work)}
      <div class="meta-line">
        <span>${escapeHtml(work.room)}</span>
        <span>${escapeHtml(work.type)}</span>
        ${work.date ? `<span>${escapeHtml(formatDate(work.date))}</span>` : ""}
      </div>
      <h3>${escapeHtml(work.title)}</h3>
      <p class="preview-description">${escapeHtml(work.description || "説明文は未設定です。")}</p>
      ${
        tags.length
          ? `<ul class="tag-list">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>`
          : ""
      }
      ${work.url ? `<a class="open-link" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">開く</a>` : ""}
      ${work.url ? `<p class="preview-description">${escapeHtml(getHostname(work.url))}</p>` : ""}
    </article>
  `;
}

function render() {
  const publicWorks = state.works.filter((work) => work.status === "public");
  const filtered = filterWorks().sort((a, b) => b.date.localeCompare(a.date));
  const selected = publicWorks.find((work) => work.id === state.selectedId) || filtered[0] || publicWorks[0];
  state.selectedId = selected?.id || "";

  elements.totalCount.textContent = publicWorks.length;
  elements.featuredCount.textContent = publicWorks.filter((work) => work.featured).length;
  elements.roomCount.textContent = getRooms(publicWorks).length;

  renderDesktopIcons(publicWorks);
  renderFilters(publicWorks);
  renderFeatured(publicWorks);
  renderWorkList(filtered);
  renderPreview(selected);
  elements.emptyMessage.hidden = filtered.length > 0;
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function selectWork(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;
  state.selectedId = work.id;
  render();
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const roomButton = event.target.closest("[data-room]");
    if (roomButton) {
      state.activeRoom = roomButton.dataset.room;
      render();
      document.querySelector("#explorer").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const workItem = event.target.closest("[data-work-id]");
    if (workItem) {
      selectWork(workItem.dataset.workId);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const workItem = event.target.closest("[data-work-id]");
    if (workItem) selectWork(workItem.dataset.workId);
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    render();
  });
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

async function init() {
  bindEvents();
  updateClock();
  setInterval(updateClock, 30000);
  state.works = (await loadWorks()).filter((work) => work.status === "public");
  render();
}

init();
