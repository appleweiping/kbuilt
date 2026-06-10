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

// ---- i18n + theme --------------------------------------------------------
function applyLang(lang) {
  LANG = I18N[lang] ? lang : "en";
  localStorage.setItem("kbuilt_lang", LANG);
  document.documentElement.lang = LANG;
  // text nodes flagged with data-t
  document.querySelectorAll("[data-t]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-t"));
  });
  $("hint").textContent = t("hint");
  urlEl.placeholder = t("urlPlaceholder");
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
  let i = 0;
  const timer = setInterval(() => {
    b.textContent = BANNER.slice(0, i++);
    if (i > BANNER.length) clearInterval(timer);
  }, 4);
})();

// ---- engine health check -------------------------------------------------
async function checkEngine() {
  const s = $("engine-status");
  if (!ENGINE || ENGINE.includes("REPLACE-WITH-YOUR")) {
    s.innerHTML = `<span class="down">● </span>${t("engineUnconfigured")}`;
    return;
  }
  s.textContent = t("engineChecking");
  try {
    const r = await fetch(ENGINE, { headers: { Accept: "application/json" } });
    const j = await r.json();
    const ver = (j.cobalt && j.cobalt.version) ? j.cobalt.version : "";
    s.innerHTML = `<span class="up">● </span>${t("engineOnline")}${ver ? " " + ver : ""}`;
  } catch (e) {
    s.innerHTML = `<span class="down">● </span>${t("engineOffline")}`;
  }
}

// ---- the download flow ---------------------------------------------------
async function startDownload() {
  const url = urlEl.value.trim();
  if (!url) { urlEl.focus(); return; }
  if (!ENGINE || ENGINE.includes("REPLACE-WITH-YOUR")) {
    clearLog();
    line(t("notConfigured"), "err");
    return;
  }

  goBtn.disabled = true;
  clearLog();
  line(t("fetching", url), "dim");

  const payload = {
    url,
    videoQuality: $("quality").value,
    downloadMode: $("mode").value,
    audioFormat: $("afmt").value,
    filenameStyle: "pretty",
  };

  const waking = line(t("contacting"), "info");

  try {
    const res = await fetch(ENGINE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    waking.remove();
    handleResponse(data, url);
  } catch (e) {
    waking.remove();
    line(t("unreachable"), "err");
    line("  " + e.message, "dim");
  } finally {
    goBtn.disabled = false;
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

function handleResponse(data, originalUrl) {
  switch (data.status) {
    case "tunnel":
    case "redirect": {
      const fn = data.filename || "";
      line(t("streamReady") + (fn ? `: ${fn}` : ""), "ok");
      line(t("saving"), "info");
      triggerSave(data.url, data.filename);
      htmlLine(t("didntStart", data.url), "dim");
      offerAi(originalUrl);
      break;
    }
    case "picker": {
      line(t("pickerFound"), "warn");
      (data.picker || []).forEach((item, i) => {
        const label = item.type ? `[${item.type}]` : "[item]";
        htmlLine(`  ${String(i + 1).padStart(2)}. ${label} <a href="${item.url}" target="_blank" rel="noopener">download</a>`, "");
      });
      if (data.audio) {
        htmlLine(`  audio: <a href="${data.audio}" target="_blank" rel="noopener">download</a>`, "dim");
      }
      offerAi(originalUrl);
      break;
    }
    case "local-processing": {
      line(t("needsMerge"), "warn");
      line(t("needsMergeHint"), "dim");
      (data.tunnel || []).forEach((u, i) => triggerSave(u, `${(data.output && data.output.filename) || "part"}-${i}`));
      offerAi(originalUrl);
      break;
    }
    case "error": {
      const code = (data.error && data.error.code) ? data.error.code : "unknown";
      line(t("errorPrefix") + code, "err");
      if (/youtube/i.test(code) || /youtu\.?be/i.test(originalUrl)) {
        line(t("ytNote1"), "dim");
        line(t("ytNote2"), "dim");
      }
      break;
    }
    default:
      line(t("unexpected"), "warn");
      line("  " + JSON.stringify(data), "dim");
  }
}

// ---- AI extras (subtitles translation / one-line summary) ----------------
function offerAi(url) {
  const wrap = htmlLine(t("aiOffer", url), "dim");
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

// ---- wire up events ------------------------------------------------------
goBtn.addEventListener("click", startDownload);
$("form").addEventListener("submit", (e) => { e.preventDefault(); startDownload(); });
urlEl.addEventListener("focus", () => { $("hint").classList.add("cursor"); });

initControls();
