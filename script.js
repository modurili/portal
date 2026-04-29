const SHEET_CSV_URL =
  window.SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuKN-1KWEw6ZC251S2xzdYsh-wYIdi1TfePMUrg_KfJpHSK9n6knLhJyhHS-BNAzx45du84NZbK2v2/pub?gid=0&single=true&output=csv";

const THUMBNAIL_MODE = "screenshot";

const SAMPLE_WORKS = [
  {
    title: "YMM4 Plugin Catalog",
    room: "道具",
    type: "Webサイト",
    url: "https://modurili.github.io/YMM4Plugin/",
    date: "2026-03-23",
    tags: "YMM4,プラグイン,カタログ,GitHub",
    description: "YMM4プラグインを検索、閲覧できるカタログサイト。",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
  {
    title: "もづりぃショップ",
    room: "BOOTH",
    type: "ショップ",
    url: "https://modurili.booth.pm/",
    date: "",
    tags: "BOOTH,YMM4,素材,テンプレ",
    description: "YMM4素材やテンプレートの配布場所。",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
];

const EXTERNAL_APPS = [
  { id: "links", label: "Links", icon: "↗", app: "links" },
  { id: "all", label: "All Works", icon: "＊", app: "explorer", room: "すべて" },
];

const LINKS = [
  ["X", "https://x.com/modurili"],
  ["note", "https://note.com/modurili"],
  ["BOOTH", "https://modurili.booth.pm/"],
  ["GitHub", "https://github.com/modurili"],
  ["YouTube", "https://www.youtube.com/@modurili"],
];

const state = {
  works: [],
  activeRoom: "すべて",
  query: "",
  selectedId: "",
  windows: new Map(),
  zIndex: 10,
};

const elements = {
  desktopIcons: document.querySelector("#desktop-icons"),
  windowLayer: document.querySelector("#window-layer"),
};

function normalizeWork(work, index) {
  const title = clean(work.title || work.name);
  const description = clean(work.description || work.discription || work.desc);

  return {
    id: clean(work.id) || slugify(`${title}-${index}`),
    title,
    room: clean(work.room) || "作品",
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

function getPublicWorks() {
  return state.works.filter((work) => work.status === "public" && work.title);
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
  const text = `${work.type} ${work.room}`.toLowerCase();
  if (text.includes("note")) return "N";
  if (text.includes("booth")) return "B";
  if (text.includes("github")) return "G";
  if (text.includes("youtube")) return "Y";
  if (text.includes("web")) return "W";
  if (text.includes("素材")) return "S";
  if (text.includes("拡張")) return "E";
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
  if (!SHEET_CSV_URL) return SAMPLE_WORKS.map(normalizeWork);

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
    return parseCsv(await response.text()).map(normalizeWork);
  } catch (error) {
    console.warn(error);
    return SAMPLE_WORKS.map(normalizeWork);
  }
}

function filterWorks(room, query) {
  const q = query.toLowerCase();
  return getPublicWorks()
    .filter((work) => room === "すべて" || work.room === room)
    .filter((work) => `${work.title} ${work.room} ${work.type} ${work.description} ${work.tags}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderDesktop() {
  const works = getPublicWorks();
  const roomApps = getRooms(works).map((room) => ({
    id: `room-${slugify(room)}`,
    label: room,
    icon: room.slice(0, 1),
    app: "explorer",
    room,
  }));
  const apps = [...roomApps, ...EXTERNAL_APPS];

  elements.desktopIcons.innerHTML = apps
    .map(
      (app) => `
        <button class="desktop-icon" type="button" data-app="${escapeAttribute(app.app)}" data-room="${escapeAttribute(app.room || "")}">
          <span class="desktop-icon-image">${escapeHtml(app.icon)}</span>
          <span class="desktop-icon-label">${escapeHtml(app.label)}</span>
        </button>
      `,
    )
    .join("");
}

function openExplorer(room = "すべて") {
  state.activeRoom = room;
  const id = `explorer-${slugify(room) || "all"}`;
  const windowEl = ensureWindow(id, `${room}.explorer`, renderExplorerWindow(room), {
    width: 880,
    height: 560,
    x: 150,
    y: 70,
  });
  bringToFront(windowEl);
  bindExplorerWindow(windowEl, room);
}

function openLinks() {
  const windowEl = ensureWindow("links", "links.app", renderLinksWindow(), {
    width: 440,
    height: 330,
    x: 210,
    y: 120,
  });
  bringToFront(windowEl);
}

function ensureWindow(id, title, content, rect) {
  const existing = state.windows.get(id);
  if (existing) {
    existing.classList.remove("is-hidden");
    existing.querySelector(".window-title").textContent = title;
    existing.querySelector(".window-content").innerHTML = content;
    return existing;
  }

  const windowEl = document.createElement("section");
  windowEl.className = "window";
  windowEl.dataset.windowId = id;
  windowEl.style.width = `${rect.width}px`;
  windowEl.style.height = `${rect.height}px`;
  windowEl.style.left = `${rect.x}px`;
  windowEl.style.top = `${rect.y}px`;
  windowEl.innerHTML = `
    <div class="window-titlebar" data-drag-handle>
      <div class="window-controls">
        <button class="window-control close" type="button" data-window-close aria-label="閉じる"></button>
        <button class="window-control minimize" type="button" data-window-hide aria-label="隠す"></button>
        <button class="window-control zoom" type="button" data-window-front aria-label="前面へ"></button>
      </div>
      <span class="window-title">${escapeHtml(title)}</span>
    </div>
    <div class="window-content">${content}</div>
  `;
  elements.windowLayer.append(windowEl);
  state.windows.set(id, windowEl);
  makeDraggable(windowEl);
  return windowEl;
}

function renderExplorerWindow(room) {
  const rooms = ["すべて", ...getRooms(getPublicWorks())];
  const works = filterWorks(room, "");
  const selected = works.find((work) => work.id === state.selectedId) || works[0];
  state.selectedId = selected?.id || "";

  return `
    <div class="explorer-layout" data-explorer-room="${escapeAttribute(room)}">
      <aside class="sidebar">
        <div class="folder-list">
          ${rooms
            .map(
              (item) => `
                <button class="folder-button${item === room ? " is-active" : ""}" type="button" data-folder="${escapeAttribute(item)}">
                  <span>${item === "すべて" ? "□" : "▣"}</span>
                  <span>${escapeHtml(item)}</span>
                  <small>${filterWorks(item, "").length}</small>
                </button>
              `,
            )
            .join("")}
        </div>
      </aside>
      <section class="file-area">
        <div class="file-toolbar">
          <div class="path-box">Modurili / ${escapeHtml(room)}</div>
          <input class="search-box" type="search" placeholder="Search" data-search />
        </div>
        <div class="file-list" data-file-list>
          ${works.map(renderFileRow).join("") || `<p class="empty-message">見つかりませんでした。</p>`}
        </div>
      </section>
      <aside class="preview-pane" data-preview>
        ${renderPreview(selected)}
      </aside>
    </div>
  `;
}

function bindExplorerWindow(windowEl, room) {
  const layout = windowEl.querySelector("[data-explorer-room]");
  const search = windowEl.querySelector("[data-search]");
  const fileList = windowEl.querySelector("[data-file-list]");
  const preview = windowEl.querySelector("[data-preview]");

  layout.addEventListener("click", (event) => {
    const folder = event.target.closest("[data-folder]");
    if (folder) {
      openExplorer(folder.dataset.folder);
      return;
    }

    const row = event.target.closest("[data-work-id]");
    if (!row) return;
    const work = getPublicWorks().find((item) => item.id === row.dataset.workId);
    if (!work) return;
    state.selectedId = work.id;
    fileList.querySelectorAll(".file-row").forEach((item) => item.classList.toggle("is-selected", item.dataset.workId === work.id));
    preview.innerHTML = renderPreview(work);
  });

  search.addEventListener("input", () => {
    const works = filterWorks(room, search.value.trim());
    const selected = works[0];
    state.selectedId = selected?.id || "";
    fileList.innerHTML = works.map(renderFileRow).join("") || `<p class="empty-message">見つかりませんでした。</p>`;
    preview.innerHTML = renderPreview(selected);
  });
}

function renderFileRow(work) {
  const selectedClass = state.selectedId === work.id ? " is-selected" : "";
  return `
    <article class="file-row${selectedClass}" data-work-id="${escapeAttribute(work.id)}" tabindex="0">
      <span class="file-icon">${escapeHtml(getFileLabel(work))}</span>
      <div class="file-title">
        <strong>${escapeHtml(work.title)}</strong>
        <small>${escapeHtml(work.description || getHostname(work.url))}</small>
      </div>
      <span class="file-type">${escapeHtml(work.type)}</span>
      <span class="file-date">${escapeHtml(formatDate(work.date))}</span>
    </article>
  `;
}

function renderPreview(work) {
  if (!work) return `<p class="preview-description">作品を選択してください。</p>`;
  const tags = getTags(work);

  return `
    <article class="preview-card">
      ${renderThumbnail(work)}
      <div class="meta-line">
        <span>${escapeHtml(work.room)}</span>
        <span>${escapeHtml(work.type)}</span>
        ${work.date ? `<span>${escapeHtml(formatDate(work.date))}</span>` : ""}
      </div>
      <h2>${escapeHtml(work.title)}</h2>
      <p class="preview-description">${escapeHtml(work.description || "説明文は未設定です。")}</p>
      ${tags.length ? `<ul class="tag-list">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : ""}
      ${work.url ? `<a class="open-link" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">Open</a>` : ""}
      ${work.url ? `<p class="preview-host">${escapeHtml(getHostname(work.url))}</p>` : ""}
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
      ${faviconUrl ? `<span class="favicon-chip"><img src="${escapeAttribute(faviconUrl)}" alt="" loading="lazy" /></span>` : ""}
    </div>
  `;
}

function renderLinksWindow() {
  return `
    <div class="link-grid">
      ${LINKS.map(([label, url]) => `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join("")}
    </div>
  `;
}

function makeDraggable(windowEl) {
  const handle = windowEl.querySelector("[data-drag-handle]");
  let dragging = null;

  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    if (window.matchMedia("(max-width: 820px)").matches) return;

    bringToFront(windowEl);
    const rect = windowEl.getBoundingClientRect();
    dragging = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    windowEl.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    const nextLeft = dragging.left + event.clientX - dragging.startX;
    const nextTop = dragging.top + event.clientY - dragging.startY;
    moveWindow(windowEl, nextLeft, nextTop);
  });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    dragging = null;
    windowEl.classList.remove("is-dragging");
  });

  windowEl.addEventListener("pointerdown", () => bringToFront(windowEl));
}

function moveWindow(windowEl, left, top) {
  const maxLeft = Math.max(0, window.innerWidth - windowEl.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - windowEl.offsetHeight);
  windowEl.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
  windowEl.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
}

function bringToFront(windowEl) {
  state.zIndex += 1;
  windowEl.style.zIndex = state.zIndex;
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (!icon) return;
    if (icon.dataset.app === "links") openLinks();
    if (icon.dataset.app === "explorer") openExplorer(icon.dataset.room || "すべて");
  });

  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-window-close]");
    if (close) {
      const windowEl = close.closest(".window");
      state.windows.delete(windowEl.dataset.windowId);
      windowEl.remove();
      return;
    }

    const hide = event.target.closest("[data-window-hide]");
    if (hide) {
      hide.closest(".window").classList.add("is-hidden");
      return;
    }

    const front = event.target.closest("[data-window-front]");
    if (front) {
      bringToFront(front.closest(".window"));
    }
  });
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

async function init() {
  bindEvents();
  state.works = (await loadWorks()).filter((work) => work.status === "public");
  renderDesktop();
}

init();
