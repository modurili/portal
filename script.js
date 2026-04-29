const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuKN-1KWEw6ZC251S2xzdYsh-wYIdi1TfePMUrg_KfJpHSK9n6knLhJyhHS-BNAzx45du84NZbK2v2/pub?gid=0&single=true&output=csv";

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
  展示室: "まず見てほしい代表作を置く場所。",
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
};

const elements = {
  roomMap: document.querySelector("#room-map"),
  roomFilters: document.querySelector("#room-filters"),
  workList: document.querySelector("#work-list"),
  featuredWorks: document.querySelector("#featured-works"),
  searchInput: document.querySelector("#search-input"),
  emptyMessage: document.querySelector("#empty-message"),
  totalCount: document.querySelector("#total-count"),
  featuredCount: document.querySelector("#featured-count"),
  roomCount: document.querySelector("#room-count"),
  sourceNote: document.querySelector("#source-note"),
  year: document.querySelector("#year"),
};

function normalizeWork(work) {
  return {
    title: clean(work.title),
    room: clean(work.room) || "展示室",
    type: clean(work.type),
    url: clean(work.url),
    date: clean(work.date),
    tags: clean(work.tags),
    description: clean(work.description),
    thumbnail: clean(work.thumbnail),
    featured: clean(work.featured).toUpperCase() === "TRUE",
    status: clean(work.status || "public").toLowerCase(),
  };
}

function clean(value) {
  return String(value ?? "").trim();
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
    elements.sourceNote.textContent = "サンプルデータを表示中";
    return SAMPLE_WORKS.map(normalizeWork);
  }

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
    const csvText = await response.text();
    elements.sourceNote.textContent = "Googleスプレッドシートから読み込み中";
    return parseCsv(csvText).map(normalizeWork);
  } catch (error) {
    console.warn(error);
    elements.sourceNote.textContent = "CSVを読めないためサンプルデータを表示中";
    return SAMPLE_WORKS.map(normalizeWork);
  }
}

function renderRoomMap(works) {
  const rooms = getRooms(works);
  elements.roomMap.innerHTML = rooms
    .map((room, index) => {
      const count = works.filter((work) => work.room === room).length;
      const description = ROOM_DETAILS[room] ?? "作品を分類して見つけやすくする場所。";
      const activeClass = state.activeRoom === room ? " is-active" : "";

      return `
        <article class="room-card${activeClass}">
          <button type="button" data-room="${escapeHtml(room)}" aria-label="${escapeHtml(room)}で絞り込む"></button>
          <div class="room-meta">
            <span class="room-number">${String(index + 1).padStart(2, "0")}</span>
            <span>${count} items</span>
          </div>
          <div>
            <h3>${escapeHtml(room)}</h3>
            <p>${escapeHtml(description)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFilters(works) {
  const rooms = ["すべて", ...getRooms(works)];
  elements.roomFilters.innerHTML = rooms
    .map((room) => {
      const activeClass = state.activeRoom === room ? " is-active" : "";
      return `<button class="filter-button${activeClass}" type="button" data-room="${escapeHtml(room)}">${escapeHtml(room)}</button>`;
    })
    .join("");
}

function renderWorks(target, works) {
  target.innerHTML = works.map(renderWorkCard).join("");
}

function renderWorkCard(work) {
  const tags = getTags(work);
  const initial = work.title.slice(0, 1).toUpperCase();
  const thumbnail = work.thumbnail
    ? `<img src="${escapeAttribute(work.thumbnail)}" alt="" loading="lazy" />`
    : `<span>${escapeHtml(initial)}</span>`;

  return `
    <article class="work-card">
      <div class="work-thumb">${thumbnail}</div>
      <div class="work-body">
        <div class="work-meta">
          <span>${escapeHtml(work.room)}</span>
          ${work.type ? `<span>${escapeHtml(work.type)}</span>` : ""}
          ${work.date ? `<span>${escapeHtml(formatDate(work.date))}</span>` : ""}
        </div>
        <h3>${escapeHtml(work.title)}</h3>
        <p class="work-description">${escapeHtml(work.description)}</p>
        <ul class="tag-list">
          ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
        </ul>
        ${work.url ? `<a class="work-link" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">開く</a>` : ""}
      </div>
    </article>
  `;
}

function filterWorks() {
  const query = state.query.toLowerCase();
  return state.works.filter((work) => {
    const roomMatches = state.activeRoom === "すべて" || work.room === state.activeRoom;
    const searchable = `${work.title} ${work.room} ${work.type} ${work.description} ${work.tags}`.toLowerCase();
    return roomMatches && searchable.includes(query);
  });
}

function render() {
  const publicWorks = state.works.filter((work) => work.status === "public");
  const featured = publicWorks
    .filter((work) => work.featured)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const filtered = filterWorks().sort((a, b) => b.date.localeCompare(a.date));

  elements.totalCount.textContent = publicWorks.length;
  elements.featuredCount.textContent = featured.length;
  elements.roomCount.textContent = getRooms(publicWorks).length;

  renderRoomMap(publicWorks);
  renderFilters(publicWorks);
  renderWorks(elements.featuredWorks, featured.length ? featured : publicWorks.slice(0, 3));
  renderWorks(elements.workList, filtered);
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

function bindEvents() {
  document.addEventListener("click", (event) => {
    const roomButton = event.target.closest("[data-room]");
    if (!roomButton) return;
    state.activeRoom = roomButton.dataset.room;
    render();
    if (roomButton.closest(".room-card")) {
      document.querySelector("#works").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    render();
  });
}

async function init() {
  elements.year.textContent = new Date().getFullYear();
  bindEvents();
  state.works = (await loadWorks()).filter((work) => work.status === "public");
  render();
}

init();
