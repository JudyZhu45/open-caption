const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (s) => ipcRenderer.invoke("save-settings", s),
  setOpacity: (v) => ipcRenderer.invoke("set-opacity", v),
  quit: () => ipcRenderer.invoke("quit-app"),

  // region selection
  openRegionSelector: () => ipcRenderer.invoke("open-region-selector"),
  regionSelected: (rect) => ipcRenderer.invoke("region-selected", rect),
  cancelRegion: () => ipcRenderer.invoke("cancel-region"),
  onRegionSaved: (cb) => ipcRenderer.on("region-saved", (_e, r) => cb(r)),

  // capture + analyze
  captureRegion: () => ipcRenderer.invoke("capture-region"),
  analyzeImage: (payload) => ipcRenderer.invoke("analyze-image", payload),

  // hotkey
  onHotkeyCapture: (cb) => ipcRenderer.on("hotkey-capture", () => cb()),
});
