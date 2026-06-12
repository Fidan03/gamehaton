const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const PORT = 3000;
const DEV_URL = `http://localhost:${PORT}`;
const isDev = !app.isPackaged;

let mainWindow;
let nextProcess;

function waitForServer(url, retries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    function attempt(n) {
      http
        .get(url, (res) => resolve())
        .on("error", () => {
          if (n <= 0) return reject(new Error("Next.js server never started"));
          setTimeout(() => attempt(n - 1), delay);
        });
    }
    attempt(retries);
  });
}

function startNextServer() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  nextProcess = spawn(npmCmd, ["run", "dev"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env },
    stdio: "inherit",
    shell: true,
  });
  nextProcess.on("error", (err) => console.error("Next.js spawn error:", err));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Cinematic Game Recap",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "..", "public", "favicon.ico"),
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(DEV_URL);

  // Open external links in the system browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(async () => {
  if (isDev) {
    startNextServer();
    console.log("Waiting for Next.js dev server…");
    try {
      await waitForServer(DEV_URL);
    } catch (e) {
      console.error(e.message);
      app.quit();
      return;
    }
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
