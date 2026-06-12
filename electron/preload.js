// Preload runs in the renderer with access to Node APIs before the page loads.
// Keep it minimal — contextIsolation is on.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronApp", {
  platform: process.platform,
});
