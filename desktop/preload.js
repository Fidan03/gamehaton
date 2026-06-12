const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  getKnownGames: () => ipcRenderer.invoke("get-known-games"),
  getCurrentGame: () => ipcRenderer.invoke("get-current-game"),
  getClips: (gameName) => ipcRenderer.invoke("get-clips", gameName),
  takeScreenshot: () => ipcRenderer.invoke("take-screenshot"),
});
