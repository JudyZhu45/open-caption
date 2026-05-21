// ---------------------------------------------------------------------------
// State (kept in-memory + persisted to a JSON file via main on export only;
// for simplicity notes live in memory for the session — see README for how to
// add disk persistence if you want notes to survive restarts.)
// ---------------------------------------------------------------------------
let notes = [];
let lastAnalysis = null;

// Timer
let timerStart = null;
let timerElapsed = 0; // ms
let timerInterval = null;

const $ = (id) => document.getElementById(id);

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return hh === "00" ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

function currentTimerStamp() {
  const total = timerElapsed + (timerStart ? Date.now() - timerStart : 0);
  return fmtTime(total);
}

function toast(msg, ms = 2200) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), ms);
}

// ---------------------------------------------------------------------------
// Timer controls
// ---------------------------------------------------------------------------
$("timerToggle").addEventListener("click", () => {
  if (timerStart) {
    timerElapsed += Date.now() - timerStart;
    timerStart = null;
    clearInterval(timerInterval);
    $("timerToggle").textContent = "▶";
  } else {
    timerStart = Date.now();
    $("timerToggle").textContent = "⏸";
    timerInterval = setInterval(() => {
      $("timerDisplay").textContent = currentTimerStamp();
    }, 500);
  }
});
$("timerReset").addEventListener("click", () => {
  timerStart = null;
  timerElapsed = 0;
  clearInterval(timerInterval);
  $("timerToggle").textContent = "▶";
  $("timerDisplay").textContent = "00:00";
});

// ---------------------------------------------------------------------------
// Notes rendering
// ---------------------------------------------------------------------------
const TYPE_LABEL = { note: "随手记", quote: "金句", plot: "剧情", vocab: "生词" };

function renderNotes() {
  const box = $("notes");
  box.innerHTML = "";
  notes
    .slice()
    .reverse()
    .forEach((n) => {
      const el = document.createElement("div");
      el.className = "note-item";
      el.innerHTML = `
        <div class="meta">
          <span class="tag ${n.type}">${TYPE_LABEL[n.type] || "记"}</span>
          ${n.ts ? `<span>${n.ts}</span>` : ""}
          <span>${n.time}</span>
        </div>
        <div class="body"></div>
        <button class="del" title="删除">✕</button>`;
      el.querySelector(".body").textContent = n.text;
      el.querySelector(".del").addEventListener("click", () => {
        notes = notes.filter((x) => x.id !== n.id);
        renderNotes();
      });
      box.appendChild(el);
    });
}

function addNote(text, type, ts) {
  if (!text.trim()) return;
  notes.push({
    id: Date.now() + Math.random(),
    text: text.trim(),
    type: type || "note",
    ts: ts || "",
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
  });
  renderNotes();
}

$("addNoteBtn").addEventListener("click", () => {
  const text = $("noteText").value;
  const ts = $("tsField").value.trim() || currentTimerStamp();
  addNote(text, $("noteType").value, ts);
  $("noteText").value = "";
});

$("noteText").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    $("addNoteBtn").click();
  }
});

// ---------------------------------------------------------------------------
// Capture + analyze
// ---------------------------------------------------------------------------
async function doCapture() {
  const btn = $("captureBtn");
  const old = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> 正在识别…';
  btn.disabled = true;

  try {
    const cap = await window.api.captureRegion();
    if (!cap.ok) {
      toast(cap.error);
      return;
    }
    const contextNote = $("noteText").value.trim();
    const res = await window.api.analyzeImage({ dataUrl: cap.dataUrl, contextNote });
    if (!res.ok) {
      toast(res.error, 4000);
      return;
    }
    lastAnalysis = res.result;
    renderAnalysis(res.result);
  } catch (e) {
    toast("出错了：" + e.message, 4000);
  } finally {
    btn.innerHTML = old;
    btn.disabled = false;
  }
}

function renderAnalysis(result) {
  const box = $("analysis");
  box.classList.remove("hidden");
  $("subtitleLine").textContent = result.subtitle || "（未识别到字幕）";
  const analysisEl = $("analysisText");
  if (result.analysis) {
    analysisEl.textContent = result.analysis;
    analysisEl.classList.remove("hidden");
  } else {
    analysisEl.classList.add("hidden");
  }
  const list = $("wordsList");
  list.innerHTML = "";
  if (!result.words || result.words.length === 0) {
    list.innerHTML = '<div class="word-card"><div class="m">没有发现明显难词 🎉</div></div>';
    return;
  }
  result.words.forEach((w) => {
    const card = document.createElement("div");
    card.className = "word-card";
    card.innerHTML = `<div class="w"></div><div class="m"></div><div class="e"></div>`;
    card.querySelector(".w").textContent = w.word;
    card.querySelector(".m").textContent = w.meaning;
    card.querySelector(".e").textContent = w.example ? "e.g. " + w.example : "";
    list.appendChild(card);
  });
}

$("captureBtn").addEventListener("click", doCapture);
window.api.onHotkeyCapture(() => doCapture());

$("saveWordsBtn").addEventListener("click", () => {
  if (!lastAnalysis) return;
  const ts = currentTimerStamp();
  const lines = [];
  if (lastAnalysis.subtitle) lines.push("「" + lastAnalysis.subtitle + "」");
  if (lastAnalysis.analysis) lines.push("含义：" + lastAnalysis.analysis);
  (lastAnalysis.words || []).forEach((w) => {
    lines.push(`• ${w.word} — ${w.meaning}` + (w.example ? `\n   e.g. ${w.example}` : ""));
  });
  addNote(lines.join("\n"), "vocab", ts);
  toast("已存入笔记");
});

// ---------------------------------------------------------------------------
// Region selector
// ---------------------------------------------------------------------------
$("regionBtn").addEventListener("click", () => {
  window.api.openRegionSelector();
});
window.api.onRegionSaved(() => toast("字幕区域已保存 ✓"));

// ---------------------------------------------------------------------------
// Opacity / ghost mode / quit
// ---------------------------------------------------------------------------
$("opacity").addEventListener("input", (e) => {
  window.api.setOpacity(parseFloat(e.target.value));
});

$("quitBtn").addEventListener("click", () => window.api.quit());

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
$("settingsBtn").addEventListener("click", async () => {
  const s = await window.api.getSettings();
  $("apiKey").value = s.apiKey || "";
  $("model").value = s.model || "gpt-4o-mini";
  $("nativeLang").value = s.nativeLang || "中文";
  $("settingsPanel").classList.remove("hidden");
});
$("closeSettingsBtn").addEventListener("click", () =>
  $("settingsPanel").classList.add("hidden")
);
$("saveSettingsBtn").addEventListener("click", async () => {
  await window.api.saveSettings({
    apiKey: $("apiKey").value.trim(),
    model: $("model").value,
    nativeLang: $("nativeLang").value.trim() || "中文",
  });
  $("settingsPanel").classList.add("hidden");
  toast("设置已保存");
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
$("exportBtn").addEventListener("click", () => {
  if (notes.length === 0) {
    toast("还没有笔记可导出");
    return;
  }
  const md = ["# OpenCaption 看剧笔记\n", `导出于 ${new Date().toLocaleString("zh-CN")}\n`];
  notes.forEach((n) => {
    md.push(`### [${TYPE_LABEL[n.type] || "记"}]${n.ts ? " " + n.ts : ""}`);
    md.push(n.text + "\n");
  });
  const blob = new Blob([md.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `看剧笔记_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出 Markdown");
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
(async function init() {
  const s = await window.api.getSettings();
  $("opacity").value = s.opacity || 0.85;
  if (!s.apiKey) {
    toast("首次使用：点右上角 ⚙ 填入你的 OpenAI API Key", 4000);
  }
  renderNotes();
})();
