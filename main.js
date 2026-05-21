const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen,
  nativeImage,
  globalShortcut,
} = require("electron");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Settings storage (plain JSON in userData). We deliberately store the OpenAI
// key locally on the user's own machine — it is never bundled into the app.
// ---------------------------------------------------------------------------
const SETTINGS_PATH = path.join(app.getPath("userData"), "settings.json");

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
  } catch {
    return {
      apiKey: "",
      model: "gpt-4o-mini",
      opacity: 0.85,
      subtitleRegion: null, // {x, y, width, height} in screen pixels
      nativeLang: "中文",
    };
  }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

let settings = loadSettings();

let mainWindow = null;
let overlayWindow = null;

// ---------------------------------------------------------------------------
// Main floating note window
// ---------------------------------------------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 560,
    x: 60,
    y: 60,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 300,
    minHeight: 320,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Keep it above full-screen video players too.
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
}

// ---------------------------------------------------------------------------
// Region selector: a fullscreen transparent overlay the user drags across to
// define where the subtitles sit. Coordinates are saved for reuse.
// ---------------------------------------------------------------------------
function openRegionSelector() {
  const primary = screen.getPrimaryDisplay();
  const { x, y, width, height } = primary.bounds;

  overlayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    enableLargerThanScreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.loadFile(path.join(__dirname, "src", "overlay.html"));
}

ipcMain.handle("open-region-selector", () => {
  openRegionSelector();
});

ipcMain.handle("region-selected", (_evt, rect) => {
  // rect comes in CSS pixels relative to the primary display origin.
  const scale = screen.getPrimaryDisplay().scaleFactor;
  settings.subtitleRegion = {
    x: Math.round(rect.x * scale),
    y: Math.round(rect.y * scale),
    width: Math.round(rect.width * scale),
    height: Math.round(rect.height * scale),
  };
  saveSettings(settings);
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  if (mainWindow) mainWindow.webContents.send("region-saved", settings.subtitleRegion);
  return settings.subtitleRegion;
});

ipcMain.handle("cancel-region", () => {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
});

// ---------------------------------------------------------------------------
// Capture the saved subtitle region as a cropped PNG (base64).
// Uses Electron's built-in desktopCapturer (no native deps).
// ---------------------------------------------------------------------------
async function captureSubtitleRegion() {
  const region = settings.subtitleRegion;
  const primary = screen.getPrimaryDisplay();
  const scale = primary.scaleFactor;

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: Math.round(primary.size.width * scale),
      height: Math.round(primary.size.height * scale),
    },
  });

  // Pick the primary screen source.
  const source = sources[0];
  if (!source) throw new Error("无法获取屏幕画面，请检查录屏权限。");

  let img = source.thumbnail;

  if (region && region.width > 0 && region.height > 0) {
    img = img.crop({
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    });
  }

  return img.toDataURL(); // data:image/png;base64,...
}

ipcMain.handle("capture-region", async () => {
  try {
    const dataUrl = await captureSubtitleRegion();
    return { ok: true, dataUrl };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------------------------------------------------------------------------
// Send the cropped subtitle image to OpenAI's vision model. It reads the
// English subtitle and returns difficult words with native-language meaning.
// ---------------------------------------------------------------------------
ipcMain.handle("analyze-image", async (_evt, { dataUrl, contextNote }) => {
  if (!settings.apiKey) {
    return { ok: false, error: "尚未设置 OpenAI API Key，请在设置里填入你自己的 key。" };
  }

  const sys =
    "You are a language-learning assistant helping a Chinese native speaker watch English-language shows. " +
    "You will be given a screenshot crop that contains an English subtitle line (and possibly some surrounding visuals). " +
    "First transcribe the English subtitle text you can read. " +
    "Then provide a clear " + (settings.nativeLang || "中文") + " explanation of the overall meaning of this line in context — " +
    "including tone, subtext, cultural references, slang, or idioms if applicable. " +
    "Then identify the genuinely difficult or advanced words/phrases for an upper-intermediate (CEFR B2+) learner — " +
    "skip basic vocabulary. For each, give the word, a concise " +
    (settings.nativeLang || "中文") +
    " definition fitting THIS context, and a short natural example sentence. " +
    'Respond ONLY with strict JSON, no markdown, in the shape: ' +
    '{"subtitle":"...","analysis":"...","words":[{"word":"...","meaning":"...","example":"..."}]}. ' +
    "The analysis field should be a " + (settings.nativeLang || "中文") + " explanation of what the subtitle means in this scene. " +
    "If you cannot read any subtitle, return {\"subtitle\":\"\",\"analysis\":\"\",\"words\":[]}.";

  const userContent = [
    {
      type: "text",
      text:
        "Here is the subtitle screenshot." +
        (contextNote ? " Context the viewer gave: " + contextNote : ""),
    },
    { type: "image_url", image_url: { url: dataUrl } },
  ];

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + settings.apiKey,
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userContent },
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return { ok: false, error: "OpenAI 返回错误 " + resp.status + ": " + t };
    }

    const data = await resp.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "无法解析模型返回的内容：" + text };
    }
    return { ok: true, result: parsed };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ---------------------------------------------------------------------------
// Settings get/set + opacity live update
// ---------------------------------------------------------------------------
ipcMain.handle("get-settings", () => settings);

ipcMain.handle("save-settings", (_evt, next) => {
  settings = { ...settings, ...next };
  saveSettings(settings);
  return settings;
});

ipcMain.handle("set-opacity", (_evt, value) => {
  if (mainWindow) mainWindow.setOpacity(value);
  settings.opacity = value;
  saveSettings(settings);
});


ipcMain.handle("quit-app", () => app.quit());

// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  createMainWindow();
  if (mainWindow) mainWindow.setOpacity(settings.opacity || 0.85);

  // Global hotkey to quickly capture+analyze the subtitle region.
  globalShortcut.register("CommandOrControl+Shift+D", () => {
    if (mainWindow) mainWindow.webContents.send("hotkey-capture");
  });


  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
