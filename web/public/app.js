/* kbuilt front-end — talks to a self-hosted cobalt engine and renders a
   terminal-style UI with 4-language i18n + light/dark theme.
   Cobalt API: POST {engine}/ with JSON { url, videoQuality, downloadMode,
   audioFormat } and Accept: application/json. Responses carry a `status`:
   tunnel | redirect | picker | error | local-processing. */

const CFG = window.KBUILT_CONFIG || {};
const ENGINE = (CFG.ENGINE_URL || "").replace(/\/?$/, "/");
const I18N = window.KBUILT_I18N || {};

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const urlEl = $("url");
const goBtn = $("go");

let LANG = "en";
const t = (k, ...args) => {
  const v = (I18N[LANG] && I18N[LANG][k]) ?? (I18N.en && I18N.en[k]) ?? k;
  return typeof v === "function" ? v(...args) : v;
};

const BANNER = String.raw`
 _    _           _ _ _
| | _| |__  _   _(_) | |_
| |/ / '_ \| | | | | | __|
|   <| |_) | |_| | | | |_
|_|\_\_.__/ \__,_|_|_|\__|   high-quality video downloader
`;

// ---- escaping (everything dynamic that goes through innerHTML) ------------
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// ---- tiny terminal helpers ----------------------------------------------
function line(text, cls = "") {
  const el = document.createElement("span");
  el.className = "line " + cls;
  el.textContent = text;
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
  return el;
}
function htmlLine(html, cls = "") {
  const el = document.createElement("span");
  el.className = "line " + cls;
  el.innerHTML = html;
  logEl.appendChild(el);
  logEl.scrollTop = logEl.scrollHeight;
  return el;
}
function clearLog() { logEl.innerHTML = ""; }

// animated spinner log line (returns a handle with .stop())
const SPIN_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const REDUCED_MOTION = window.matchMedia
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function spinnerLine(text) {
  const el = line((REDUCED_MOTION ? "→" : SPIN_FRAMES[0]) + " " + text, "info");
  let i = 0;
  const id = REDUCED_MOTION ? 0 : setInterval(() => {
    i = (i + 1) % SPIN_FRAMES.length;
    el.textContent = SPIN_FRAMES[i] + " " + text;
  }, 80);
  return {
    el,
    stop() { if (id) clearInterval(id); el.remove(); },
  };
}

function setBusy(busy) {
  goBtn.disabled = busy;
  goBtn.classList.toggle("busy", busy);
  goBtn.querySelector(".go-label").textContent = busy ? t("busy") : t("download");
  goBtn.setAttribute("aria-busy", busy ? "true" : "false");
}

// ---- i18n + theme --------------------------------------------------------
function applyLang(lang) {
  LANG = I18N[lang] ? lang : "en";
  localStorage.setItem("kbuilt_lang", LANG);
  document.documentElement.lang = LANG;
  // text nodes flagged with data-t (works for HTML and SVG <text> alike)
  document.querySelectorAll("[data-t]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-t"));
  });
  // aria-labels flagged with data-t-aria
  document.querySelectorAll("[data-t-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-t-aria")));
  });
  $("hint").textContent = t("hint");
  urlEl.placeholder = t("urlPlaceholder");
  renderHistory();
  checkEngine();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("kbuilt_theme", theme);
  $("theme").textContent = theme === "light" ? "☀" : "☾";
}

function initControls() {
  const sel = $("lang");
  Object.keys(I18N).forEach((code) => {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = I18N[code]._name;
    sel.appendChild(o);
  });
  const savedLang = localStorage.getItem("kbuilt_lang")
    || (navigator.language || "en").slice(0, 2);
  sel.value = I18N[savedLang] ? savedLang : "en";
  sel.addEventListener("change", () => applyLang(sel.value));
  applyLang(sel.value);

  const savedTheme = localStorage.getItem("kbuilt_theme")
    || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(savedTheme);
  $("theme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    applyTheme(cur === "light" ? "dark" : "light");
  });
}

// typewriter banner
(function typeBanner() {
  const b = $("banner");
  if (REDUCED_MOTION) { b.textContent = BANNER; return; }
  let i = 0;
  const timer = setInterval(() => {
    b.textContent = BANNER.slice(0, i++);
    if (i > BANNER.length) clearInterval(timer);
  }, 4);
})();

// ---- engine health check -------------------------------------------------
async function checkEngine() {
  const s = $("engine-status");
  if (!ENGINE) {
    s.innerHTML = `<span class="down">● </span>${esc(t("engineUnconfigured"))}`;
    return;
  }
  s.textContent = t("engineChecking");
  try {
    const r = await fetch(ENGINE, { headers: { Accept: "application/json" } });
    const j = await r.json();
    const ver = (j.cobalt && j.cobalt.version) ? j.cobalt.version : "";
    s.innerHTML = `<span class="up">● </span>${esc(t("engineOnline"))}${ver ? " " + esc(ver) : ""}`;
  } catch (e) {
    s.innerHTML = `<span class="down">● </span>${esc(t("engineOffline"))}`;
  }
}

// ---- download history (last 10, localStorage) ------------------------------
const HISTORY_KEY = "kbuilt_history";
function getHistory() {
  try {
    const h = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(h) ? h : [];
  } catch { return []; }
}
function pushHistory(entry) {
  const h = getHistory();
  h.unshift(entry);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 10))); } catch {}
  renderHistory();
}
function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
  renderHistory();
}
function renderHistory() {
  const list = $("history-list");
  const count = $("history-count");
  if (!list) return;
  const h = getHistory();
  count.textContent = h.length ? `(${h.length})` : "";
  list.innerHTML = "";
  if (!h.length) {
    const li = document.createElement("li");
    li.className = "history-empty";
    li.textContent = t("historyEmpty");
    list.appendChild(li);
    $("history-clear").hidden = true;
    return;
  }
  $("history-clear").hidden = false;
  h.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-row";
    btn.title = t("historyRefill");

    const status = document.createElement("span");
    status.className = "h-status " + (item.ok ? "ok" : "err");
    status.textContent = item.ok ? "✓" : "✗";

    const time = document.createElement("span");
    time.className = "h-time";
    time.textContent = new Date(item.ts).toLocaleString(LANG, {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });

    const url = document.createElement("span");
    url.className = "h-url";
    url.textContent = item.url; // textContent => injection-safe

    btn.append(status, time, url);
    btn.addEventListener("click", () => {
      urlEl.value = item.url;
      urlEl.focus();
    });
    li.appendChild(btn);
    list.appendChild(li);
  });
}

// ---- the download flow ---------------------------------------------------
async function startDownload() {
  const url = urlEl.value.trim();
  if (!url) { urlEl.focus(); return; }
  if (!ENGINE) {
    clearLog();
    line(t("notConfigured"), "err");
    return;
  }

  setBusy(true);
  clearLog();
  line(t("fetching", url), "dim");

  const payload = {
    url,
    videoQuality: $("quality").value,
    downloadMode: $("mode").value,
    audioFormat: $("afmt").value,
    filenameStyle: "pretty",
    localProcessing: "disabled",
  };

  const waking = spinnerLine(t("contacting"));

  try {
    const res = await fetch(ENGINE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    waking.stop();
    handleResponse(data, url);
  } catch (e) {
    waking.stop();
    // network-level failure (DNS, CORS, cold-start, offline) — engine never answered
    line(t("errNetwork"), "err");
    line("  " + e.message, "dim");
    pushHistory({ url, ok: false, ts: Date.now() });
  } finally {
    setBusy(false);
  }
}

// ---- interpret cobalt's response ----------------------------------------
function triggerSave(fileUrl, filename) {
  const a = document.createElement("a");
  a.href = fileUrl;
  if (filename) a.download = filename;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function fxPulse() {
  if (window.kbuiltFX && typeof window.kbuiltFX.pulse === "function") {
    window.kbuiltFX.pulse();
  }
}

// classify a cobalt error code into a friendly i18n message
function explainError(code, originalUrl) {
  const isYt = /youtube|youtu\.?be/i.test(code) || /youtu\.?be|youtube\.com/i.test(originalUrl);
  if (isYt) {
    line(t("errYouTube"), "err");
    line(t("ytNote1"), "dim");
    line(t("ytNote2"), "dim");
  } else if (/link\.(invalid|unsupported)|service\.(disabled|notfound)|url/i.test(code)) {
    line(t("errUnsupported"), "err");
  } else if (/fetch|content|empty|unavailable|private|region/i.test(code)) {
    line(t("errFetch"), "err");
  } else {
    line(t("errorPrefix") + code, "err");
  }
  line(t("errorCode", code), "dim");
}

function handleResponse(data, originalUrl) {
  switch (data.status) {
    case "tunnel":
    case "redirect": {
      const fn = data.filename || "";
      line(t("streamReady") + (fn ? `: ${fn}` : ""), "ok");
      line(t("saving"), "info");
      triggerSave(data.url, data.filename);
      htmlLine(t("didntStart", esc(data.url)), "dim");
      fxPulse();
      pushHistory({ url: originalUrl, ok: true, ts: Date.now() });
      offerAi(originalUrl);
      break;
    }
    case "picker": {
      line(t("pickerFound"), "warn");
      (data.picker || []).forEach((item, i) => {
        const label = item.type ? `[${esc(item.type)}]` : "[item]";
        htmlLine(`  ${String(i + 1).padStart(2)}. ${label} <a href="${esc(item.url)}" target="_blank" rel="noopener">download</a>`, "");
      });
      if (data.audio) {
        htmlLine(`  audio: <a href="${esc(data.audio)}" target="_blank" rel="noopener">download</a>`, "dim");
      }
      fxPulse();
      pushHistory({ url: originalUrl, ok: true, ts: Date.now() });
      offerAi(originalUrl);
      break;
    }
    case "local-processing": {
      line(t("needsMerge"), "warn");
      line(t("needsMergeHint"), "dim");
      line(t("needsMergeTry"), "dim");
      offerAi(originalUrl);
      break;
    }
    case "error": {
      const code = (data.error && data.error.code) ? data.error.code : "unknown";
      explainError(code, originalUrl);
      pushHistory({ url: originalUrl, ok: false, ts: Date.now() });
      break;
    }
    default:
      line(t("unexpected"), "warn");
      line("  " + JSON.stringify(data), "dim");
  }
}

// ---- AI extras (subtitles translation / one-line summary) ----------------
function offerAi(url) {
  const wrap = htmlLine(t("aiOffer", esc(url)), "dim");
  wrap.querySelectorAll("[data-ai]").forEach((a) => {
    a.addEventListener("click", (e) => { e.preventDefault(); aiCall(a.getAttribute("data-ai"), url); });
  });
}

async function aiCall(kind, url) {
  const l = line(t("aiRunning", kind), "info");
  try {
    const r = await fetch(`${CFG.API_BASE || "/api"}/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const j = await r.json();
    l.remove();
    if (j.error) { line(`✗ ${kind}: ${j.error}`, "err"); return; }
    line(`✦ ${kind}:`, "ok");
    line("  " + (j.result || JSON.stringify(j)).replace(/\n/g, "\n  "), "");
  } catch (e) {
    l.remove();
    line(t("aiUnavailable", kind), "warn");
  }
}

// ---- scroll-triggered section reveals --------------------------------------
function initReveals() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || REDUCED_MOTION) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
  targets.forEach((el) => io.observe(el));
}

// ---- wire up events ------------------------------------------------------
goBtn.addEventListener("click", startDownload);
$("form").addEventListener("submit", (e) => { e.preventDefault(); startDownload(); });
urlEl.addEventListener("focus", () => { $("hint").classList.add("cursor"); });
$("history-clear").addEventListener("click", clearHistory);

initControls();
initReveals();
