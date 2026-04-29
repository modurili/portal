const SHEET_CSV_URL =
  window.SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQuKN-1KWEw6ZC251S2xzdYsh-wYIdi1TfePMUrg_KfJpHSK9n6knLhJyhHS-BNAzx45du84NZbK2v2/pub?gid=0&single=true&output=csv";

const ALL_ROOM = "__all__";
const THUMBNAIL_MODE = "screenshot";

const SAMPLE_WORKS = [
  {
    title: "YMM4 Plugin Catalog",
    room: "Tools",
    type: "Web",
    url: "https://modurili.github.io/YMM4Plugin/",
    date: "2026-03-23",
    tags: "YMM4,Plugin,Catalog,GitHub",
    description: "YMM4 plugin catalog.",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
  {
    title: "BOOTH",
    room: "BOOTH",
    type: "Shop",
    url: "https://modurili.booth.pm/",
    date: "",
    tags: "BOOTH,YMM4,Assets",
    description: "YMM4 assets and templates.",
    thumbnail: "",
    featured: "TRUE",
    status: "public",
  },
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
  selectedIcon: "",
  selectedId: "",
  windows: new Map(),
  zIndex: 20,
  explorerCount: 0,
  settings: {
    theme: "light",
  },
};

const elements = {
  desktopIcons: document.querySelector("#desktop-icons"),
  windowLayer: document.querySelector("#window-layer"),
  taskbarApps: document.querySelector("#taskbar-apps"),
  taskbarClock: document.querySelector("#taskbar-clock"),
  startButton: document.querySelector("#start-button"),
  startMenu: document.querySelector("#start-menu"),
};

function clean(value) {
  return String(value ?? "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeWork(work, index) {
  const title = clean(work.title || work.name);

  return {
    id: clean(work.id) || slugify(`${title}-${index}`) || `work-${index}`,
    title,
    room: clean(work.room) || "Works",
    type: clean(work.type) || "item",
    url: clean(work.url || work.link),
    date: clean(work.date),
    tags: clean(work.tags),
    description: clean(work.description || work.discription || work.desc),
    thumbnail: clean(work.thumbnail || work.thumb || work.image),
    featured: clean(work.featured).toUpperCase() === "TRUE",
    status: clean(work.status || "public").toLowerCase(),
  };
}

function getPublicWorks() {
  return state.works.filter((work) => work.status === "public" && work.title);
}

function getRooms() {
  return [...new Set(getPublicWorks().map((work) => work.room))].filter(Boolean);
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
  if (text.includes("素材") || text.includes("asset")) return "S";
  if (text.includes("拡張") || text.includes("extension")) return "E";
  return clean(work.title).slice(0, 1).toUpperCase() || "?";
}

function getRoomIconType(room) {
  const text = clean(room).toLowerCase();
  if (text.includes("booth")) return "shop";
  if (text.includes("note") || text.includes("記録")) return "note";
  if (text.includes("github")) return "code";
  if (text.includes("youtube")) return "play";
  if (text.includes("tool") || text.includes("道具")) return "tools";
  if (text.includes("素材") || text.includes("asset")) return "media";
  return "folder";
}

function iconSvg(type) {
  const icons = {
    all: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 17h18l5 6h23v27H9z"/><path d="M9 14h17l5 6h24v6H9z"/></svg>`,
    folder: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 18h18l5 6h25v25H8z"/><path d="M8 15h18l5 6h25v6H8z"/></svg>`,
    links: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="23"/><path d="M10 32h44M32 9c7 7 10 15 10 23s-3 16-10 23M32 9C25 16 22 24 22 32s3 16 10 23"/></svg>`,
    about: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="22" r="10"/><path d="M14 54c3-12 11-18 18-18s15 6 18 18z"/></svg>`,
    settings: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M28 7h8l3 9 9-3 5 7-6 7 6 7-5 7-9-3-3 9h-8l-3-9-9 3-5-7 6-7-6-7 5-7 9 3z"/><circle cx="32" cy="32" r="8"/></svg>`,
    shop: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 25h36l-3 27H17z"/><path d="M22 25c0-9 4-14 10-14s10 5 10 14"/></svg>`,
    note: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 9h24l8 8v38H16z"/><path d="M40 9v10h10M23 29h18M23 37h18M23 45h12"/></svg>`,
    code: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 20 12 32l12 12M40 20l12 12-12 12M35 15 29 49"/></svg>`,
    play: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="16" width="44" height="32" rx="5"/><path d="m28 24 14 8-14 8z"/></svg>`,
    tools: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M42 10 54 22 42 34l-5-5-18 18-6-6 18-18-5-5z"/><path d="M13 15l9 9"/></svg>`,
    media: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="15" width="42" height="34" rx="3"/><path d="M17 42l10-11 8 8 6-7 7 10z"/><circle cx="43" cy="25" r="4"/></svg>`,
    file: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8h24l8 8v40H18z"/><path d="M42 8v10h10"/></svg>`,
  };

  return icons[type] || icons.file;
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
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
    const works = parseCsv(await response.text()).map(normalizeWork);
    return works.some((work) => work.status === "public" && work.title) ? works : SAMPLE_WORKS.map(normalizeWork);
  } catch (error) {
    console.warn(error);
    return SAMPLE_WORKS.map(normalizeWork);
  }
}

function filterWorks(room, query) {
  const q = clean(query).toLowerCase();
  return getPublicWorks()
    .filter((work) => room === ALL_ROOM || work.room === room)
    .filter((work) => `${work.title} ${work.room} ${work.type} ${work.description} ${work.tags}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getDesktopApps() {
  const folderApps = getRooms().map((room) => ({
    id: `folder-${slugify(room)}`,
    label: room,
    iconType: getRoomIconType(room),
    app: "explorer",
    room,
  }));

  return [
    { id: "all", label: "All Works", iconType: "all", app: "explorer", room: ALL_ROOM },
    ...folderApps,
    { id: "about", label: "About", iconType: "about", app: "about" },
    { id: "settings", label: "Settings", iconType: "settings", app: "settings" },
    { id: "links", label: "Links", iconType: "links", app: "links" },
  ];
}

function renderDesktop() {
  const apps = getDesktopApps();
  elements.desktopIcons.innerHTML = apps
    .map(
      (app) => `
        <button class="desktop-icon${state.selectedIcon === app.id ? " is-selected" : ""}" type="button" data-icon-id="${escapeAttribute(app.id)}" data-app="${escapeAttribute(app.app)}" data-room="${escapeAttribute(app.room || "")}">
          <span class="desktop-icon-image">${iconSvg(app.iconType)}</span>
          <span class="desktop-icon-label">${escapeHtml(app.label)}</span>
        </button>
      `,
    )
    .join("");
}

function openAppFromIcon(icon) {
  if (!icon) return;
  if (icon.dataset.app === "links") openLinks();
  if (icon.dataset.app === "about") openAbout();
  if (icon.dataset.app === "settings") openSettings();
  if (icon.dataset.app === "explorer") openExplorer(icon.dataset.room || ALL_ROOM, { newInstance: true });
}

function openExplorer(room = ALL_ROOM, options = {}) {
  const title = room === ALL_ROOM ? "All Works" : room;
  const id = options.newInstance ? `explorer-${++state.explorerCount}` : "explorer";
  const windowEl = ensureWindow(id, title, renderExplorerWindow(room, "thumb", ""), {
    width: 930,
    height: 590,
    x: 120 + state.windows.size * 22,
    y: 54 + state.windows.size * 18,
  });
  windowEl.dataset.appType = "explorer";
  bringToFront(windowEl);
  bindExplorerWindow(windowEl);
}

function openLinks() {
  const windowEl = ensureWindow("links", "Links", renderLinksWindow(), {
    width: 460,
    height: 340,
    x: 190,
    y: 96,
  });
  bringToFront(windowEl);
}

function openAbout() {
  const windowEl = ensureWindow("about", "About", renderAboutWindow(), {
    width: 520,
    height: 430,
    x: 170,
    y: 78,
  });
  bringToFront(windowEl);
}

function openSettings() {
  const windowEl = ensureWindow("settings", "Settings", renderSettingsWindow(), {
    width: 620,
    height: 440,
    x: 210,
    y: 92,
  });
  bringToFront(windowEl);
}

function ensureWindow(id, title, content, rect) {
  const existing = state.windows.get(id);
  if (existing) {
    existing.classList.remove("is-hidden");
    existing.dataset.windowTitle = title;
    existing.querySelector(".window-title").textContent = title;
    existing.querySelector(".window-content").innerHTML = content;
    updateTaskbar();
    return existing;
  }

  const windowEl = document.createElement("section");
  windowEl.className = "window";
  windowEl.dataset.windowId = id;
  windowEl.dataset.windowTitle = title;
  windowEl.style.width = `${rect.width}px`;
  windowEl.style.height = `${rect.height}px`;
  windowEl.style.left = `${rect.x}px`;
  windowEl.style.top = `${rect.y}px`;
  windowEl.innerHTML = `
    <div class="window-titlebar" data-drag-handle>
      <span class="window-title">${escapeHtml(title)}</span>
      <div class="window-controls">
        <button class="window-control minimize" type="button" data-window-minimize aria-label="Minimize"></button>
        <button class="window-control zoom" type="button" data-window-maximize aria-label="Maximize"></button>
        <button class="window-control close" type="button" data-window-close aria-label="Close"></button>
      </div>
    </div>
    <div class="window-content">${content}</div>
  `;
  elements.windowLayer.append(windowEl);
  state.windows.set(id, windowEl);
  makeDraggable(windowEl);
  updateTaskbar();
  return windowEl;
}

function renderExplorerWindow(room, view = "thumb", query = "") {
  const rooms = [ALL_ROOM, ...getRooms()];
  const works = filterWorks(room, query);
  const selected = works.find((work) => work.id === state.selectedId) || works[0];
  state.selectedId = selected?.id || "";

  return `
    <div class="explorer-layout" data-explorer-room="${escapeAttribute(room)}" data-view="${escapeAttribute(view)}">
      <aside class="sidebar">
        <div class="folder-list">
          ${rooms
            .map((item) => {
              const label = item === ALL_ROOM ? "All Works" : item;
              return `
                <button class="folder-button${item === room ? " is-active" : ""}" type="button" data-folder="${escapeAttribute(item)}">
                  <span class="folder-glyph">${iconSvg(item === ALL_ROOM ? "all" : "folder")}</span>
                  <span>${escapeHtml(label)}</span>
                  <small>${filterWorks(item, "").length}</small>
                </button>
              `;
            })
            .join("")}
        </div>
      </aside>
      <section class="file-area">
        <div class="command-bar">
          <button type="button" data-folder="${escapeAttribute(ALL_ROOM)}">Home</button>
          <button type="button" data-refresh>Refresh</button>
          <div class="view-toggle" role="group" aria-label="View">
            <button class="${view === "thumb" ? "is-active" : ""}" type="button" data-view-mode="thumb">Thumbnails</button>
            <button class="${view === "list" ? "is-active" : ""}" type="button" data-view-mode="list">List</button>
          </div>
        </div>
        <div class="file-toolbar">
          <div class="path-box" aria-label="Path">
            <span>Modurili</span>
            <span class="path-separator">›</span>
            <span>${escapeHtml(room === ALL_ROOM ? "All Works" : room)}</span>
          </div>
          <label class="search-shell">
            <span>${iconSvg("links")}</span>
            <input class="search-box" type="search" placeholder="Search" value="${escapeAttribute(query)}" data-search />
          </label>
        </div>
        <div class="file-list ${view === "thumb" ? "thumb-view" : "list-view"}" data-file-list>
          ${works.map((work) => (view === "thumb" ? renderThumbItem(work) : renderFileRow(work))).join("") || `<p class="empty-message">No items.</p>`}
        </div>
      </section>
      <aside class="preview-pane" data-preview>${renderPreview(selected)}</aside>
    </div>
  `;
}

function bindExplorerWindow(windowEl) {
  if (windowEl.dataset.explorerBound === "true") return;
  windowEl.dataset.explorerBound = "true";

  windowEl.addEventListener("dblclick", (event) => {
    const row = event.target.closest("[data-work-id]");
    if (!row) return;
    const work = getPublicWorks().find((item) => item.id === row.dataset.workId);
    if (work?.url) window.open(work.url, "_blank", "noopener");
  });

  windowEl.addEventListener("click", (event) => {
    const folder = event.target.closest("[data-folder]");
    if (folder) {
      navigateExplorer(windowEl, folder.dataset.folder);
      return;
    }

    const viewButton = event.target.closest("[data-view-mode]");
    if (viewButton) {
      const layout = windowEl.querySelector("[data-explorer-room]");
      const room = layout?.dataset.explorerRoom || ALL_ROOM;
      const query = windowEl.querySelector("[data-search]")?.value || "";
      navigateExplorer(windowEl, room, viewButton.dataset.viewMode, query);
      return;
    }

    const refresh = event.target.closest("[data-refresh]");
    if (refresh) {
      const layout = windowEl.querySelector("[data-explorer-room]");
      const room = layout?.dataset.explorerRoom || ALL_ROOM;
      const view = layout?.dataset.view || "thumb";
      const query = windowEl.querySelector("[data-search]")?.value || "";
      navigateExplorer(windowEl, room, view, query);
      return;
    }

    const row = event.target.closest("[data-work-id]");
    if (!row) return;
    const work = getPublicWorks().find((item) => item.id === row.dataset.workId);
    if (!work) return;
    state.selectedId = work.id;
    const fileList = windowEl.querySelector("[data-file-list]");
    const preview = windowEl.querySelector("[data-preview]");
    fileList.querySelectorAll("[data-work-id]").forEach((item) => item.classList.toggle("is-selected", item.dataset.workId === work.id));
    preview.innerHTML = renderPreview(work);
  });

  windowEl.addEventListener("input", (event) => {
    const search = event.target.closest("[data-search]");
    if (!search) return;
    const layout = windowEl.querySelector("[data-explorer-room]");
    const room = layout?.dataset.explorerRoom || ALL_ROOM;
    const view = layout?.dataset.view || "thumb";
    const fileList = windowEl.querySelector("[data-file-list]");
    const preview = windowEl.querySelector("[data-preview]");
    const works = filterWorks(room, search.value);
    const selected = works[0];
    state.selectedId = selected?.id || "";
    fileList.className = `file-list ${view === "thumb" ? "thumb-view" : "list-view"}`;
    fileList.innerHTML = works.map((work) => (view === "thumb" ? renderThumbItem(work) : renderFileRow(work))).join("") || `<p class="empty-message">No items.</p>`;
    preview.innerHTML = renderPreview(selected);
  });
}

function navigateExplorer(windowEl, room, view, query = "") {
  const layout = windowEl.querySelector("[data-explorer-room]");
  const nextView = view || layout?.dataset.view || "thumb";
  const title = room === ALL_ROOM ? "All Works" : room;
  windowEl.dataset.windowTitle = title;
  windowEl.querySelector(".window-title").textContent = title;
  windowEl.querySelector(".window-content").innerHTML = renderExplorerWindow(room, nextView, query);
  updateTaskbar();
}

function renderFileRow(work) {
  return `
    <article class="file-row${state.selectedId === work.id ? " is-selected" : ""}" data-work-id="${escapeAttribute(work.id)}" tabindex="0">
      <span class="file-icon">${iconSvg("file")}</span>
      <div class="file-title">
        <strong>${escapeHtml(work.title)}</strong>
        <small>${escapeHtml(work.description || getHostname(work.url))}</small>
      </div>
      <span class="file-type">${escapeHtml(work.type)}</span>
      <span class="file-date">${escapeHtml(formatDate(work.date))}</span>
    </article>
  `;
}

function renderThumbItem(work) {
  return `
    <article class="thumb-item${state.selectedId === work.id ? " is-selected" : ""}" data-work-id="${escapeAttribute(work.id)}" tabindex="0">
      ${renderThumbnail(work)}
      <div class="thumb-title">${escapeHtml(work.title)}</div>
      <div class="thumb-type">${escapeHtml(work.type)}</div>
    </article>
  `;
}

function renderPreview(work) {
  if (!work) return `<p class="preview-description">Select an item.</p>`;
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
      <p class="preview-description">${escapeHtml(work.description || "No description.")}</p>
      ${tags.length ? `<ul class="tag-list">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>` : ""}
      ${work.url ? `<a class="open-link" href="${escapeAttribute(work.url)}" target="_blank" rel="noopener">Open</a>` : ""}
      ${work.url ? `<p class="preview-host">${escapeHtml(getHostname(work.url))}</p>` : ""}
    </article>
  `;
}

function renderThumbnail(work) {
  const thumbnailUrl = getAutoThumbnailUrl(work);
  const faviconUrl = getFaviconUrl(work.url);

  return `
    <div class="thumb-frame${thumbnailUrl ? "" : " is-fallback"}">
      ${
        thumbnailUrl
          ? `<img src="${escapeAttribute(thumbnailUrl)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('is-fallback'); this.remove();" />`
          : ""
      }
      <span class="fallback-thumb">${iconSvg("file")}</span>
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

function renderAboutWindow() {
  return `
    <section class="about-panel">
      <div class="about-avatar">${iconSvg("about")}</div>
      <div>
        <h2>もづりぃ</h2>
        <p>編集、YMM4素材、便利ツール、制作メモなどを作っています。</p>
        <p>ここは作ったものへ行くためのポータルです。</p>
      </div>
      <dl class="about-specs">
        <div><dt>Mode</dt><dd>Creator / Editor / Tool maker</dd></div>
        <div><dt>Main</dt><dd>YMM4, BOOTH, note, GitHub</dd></div>
        <div><dt>Portal</dt><dd>Modurili OS</dd></div>
      </dl>
    </section>
  `;
}

function renderSettingsWindow() {
  const darkChecked = state.settings.theme === "dark" ? "checked" : "";
  return `
    <section class="settings-app">
      <aside class="settings-sidebar">
        <button class="is-active" type="button">Personalization</button>
        <button type="button">System</button>
        <button type="button">About</button>
      </aside>
      <div class="settings-main">
        <h2>Personalization</h2>
        <div class="setting-card">
          <div>
            <strong>Dark mode</strong>
            <p>Switch the desktop and windows to a darker theme.</p>
          </div>
          <label class="switch">
            <input type="checkbox" data-setting-theme ${darkChecked} />
            <span></span>
          </label>
        </div>
      </div>
    </section>
  `;
}

function applyTheme(theme) {
  state.settings.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.settings.theme;
  setCookie("modurili_theme", state.settings.theme, 365);
}

function loadSettings() {
  applyTheme(getCookie("modurili_theme") || "light");
}

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const key = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(key))
    ?.slice(key.length);
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

  handle.addEventListener("dblclick", () => toggleMaximize(windowEl));

  handle.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    moveWindow(windowEl, dragging.left + event.clientX - dragging.startX, dragging.top + event.clientY - dragging.startY);
  });

  handle.addEventListener("pointerup", (event) => {
    if (!dragging || event.pointerId !== dragging.pointerId) return;
    dragging = null;
    windowEl.classList.remove("is-dragging");
  });

  windowEl.addEventListener("pointerdown", () => bringToFront(windowEl));
}

function moveWindow(windowEl, left, top) {
  if (windowEl.classList.contains("is-maximized")) return;
  const maxLeft = Math.max(0, window.innerWidth - windowEl.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - windowEl.offsetHeight - 46);
  windowEl.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
  windowEl.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
}

function bringToFront(windowEl) {
  state.zIndex += 1;
  windowEl.style.zIndex = state.zIndex;
  updateTaskbar();
}

function toggleMaximize(windowEl) {
  if (window.matchMedia("(max-width: 820px)").matches) return;

  if (windowEl.classList.contains("is-maximized")) {
    const old = JSON.parse(windowEl.dataset.restoreRect || "{}");
    windowEl.classList.remove("is-maximized");
    windowEl.style.left = old.left || "120px";
    windowEl.style.top = old.top || "70px";
    windowEl.style.width = old.width || "880px";
    windowEl.style.height = old.height || "560px";
    return;
  }

  windowEl.dataset.restoreRect = JSON.stringify({
    left: windowEl.style.left,
    top: windowEl.style.top,
    width: windowEl.style.width,
    height: windowEl.style.height,
  });
  windowEl.classList.add("is-maximized");
  windowEl.style.left = "10px";
  windowEl.style.top = "10px";
  windowEl.style.width = "calc(100vw - 20px)";
  windowEl.style.height = "calc(100vh - 62px)";
}

function updateTaskbar() {
  const items = [...state.windows.entries()];
  elements.taskbarApps.innerHTML = items
    .map(([id, windowEl]) => {
      const title = windowEl.dataset.windowTitle || id;
      const active = windowEl.classList.contains("is-hidden") ? "" : " is-active";
      return `<button class="taskbar-app${active}" type="button" data-taskbar-window="${escapeAttribute(id)}">${escapeHtml(title)}</button>`;
    })
    .join("");
}

function updateClock() {
  elements.taskbarClock.textContent = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (icon) {
      if (event.detail > 1) return;
      state.selectedIcon = icon.dataset.iconId;
      elements.desktopIcons.querySelectorAll(".desktop-icon").forEach((item) => {
        item.classList.toggle("is-selected", item === icon);
      });
      return;
    }

    if (!event.target.closest(".start-menu") && !event.target.closest(".start-button")) {
      elements.startMenu.classList.add("is-hidden");
    }
  });

  document.addEventListener("dblclick", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (!icon) return;
    event.preventDefault();
    openAppFromIcon(icon);
  });

  elements.startButton.addEventListener("click", () => {
    elements.startMenu.classList.toggle("is-hidden");
  });

  elements.startMenu.addEventListener("click", (event) => {
    const app = event.target.closest("[data-start-app]")?.dataset.startApp;
    if (app === "all") openExplorer(ALL_ROOM);
    if (app === "about") openAbout();
    if (app === "settings") openSettings();
    if (app === "links") openLinks();
    elements.startMenu.classList.add("is-hidden");
  });

  elements.taskbarApps.addEventListener("click", (event) => {
    const id = event.target.closest("[data-taskbar-window]")?.dataset.taskbarWindow;
    const windowEl = state.windows.get(id);
    if (!windowEl) return;
    if (windowEl.classList.contains("is-hidden")) {
      windowEl.classList.remove("is-hidden");
      bringToFront(windowEl);
    } else {
      windowEl.classList.add("is-hidden");
      updateTaskbar();
    }
  });

  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-window-close]");
    if (close) {
      const windowEl = close.closest(".window");
      state.windows.delete(windowEl.dataset.windowId);
      windowEl.remove();
      updateTaskbar();
      return;
    }

    const minimize = event.target.closest("[data-window-minimize]");
    if (minimize) {
      minimize.closest(".window").classList.add("is-hidden");
      updateTaskbar();
      return;
    }

    const maximize = event.target.closest("[data-window-maximize]");
    if (maximize) {
      toggleMaximize(maximize.closest(".window"));
      return;
    }

    const themeToggle = event.target.closest("[data-setting-theme]");
    if (themeToggle) {
      applyTheme(themeToggle.checked ? "dark" : "light");
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
  try {
    loadSettings();
    bindEvents();
    updateClock();
    setInterval(updateClock, 30000);
    state.works = (await loadWorks()).filter((work) => work.status === "public");
    renderDesktop();
  } catch (error) {
    console.error(error);
    state.works = SAMPLE_WORKS.map(normalizeWork);
    renderDesktop();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
