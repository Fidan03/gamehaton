// Desktop collector — minimal Electron shell around the Next.js app.
// The renderer IS the web app (localhost:3000/desktop); this process only
// contributes the things a browser can't do: process list, ShadowPlay clip
// folders, and screen capture. Same Recap JSON, same player, same endpoints.
const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require("electron");
const { execFile } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const APP_URL = process.env.RECAP_URL || "http://localhost:3000/desktop";

// exe name (lowercase) -> game. ShadowPlay saves clips under Videos\<name>\.
const KNOWN_GAMES = {
  "eldenring.exe": { name: "ELDEN RING", appid: 1245620 },
  "nightreign.exe": { name: "ELDEN RING NIGHTREIGN", appid: 2622380 },
  "hades.exe": { name: "Hades", appid: 1145360 },
  "hades2.exe": { name: "Hades II", appid: 1145350 },
  "bg3.exe": { name: "Baldur's Gate 3", appid: 1086940 },
  "bg3_dx11.exe": { name: "Baldur's Gate 3", appid: 1086940 },
  "witcher3.exe": { name: "The Witcher 3", appid: 292030 },
  "cyberpunk2077.exe": { name: "Cyberpunk 2077", appid: 1091500 },
  "hollow_knight.exe": { name: "Hollow Knight", appid: 367520 },
  "celeste.exe": { name: "Celeste", appid: 504230 },
  "stardew valley.exe": { name: "Stardew Valley", appid: 413150 },
  "dota2.exe": { name: "Dota 2", appid: 570 },
  "cs2.exe": { name: "Counter-Strike 2", appid: 730 },
};

// ---- tiny local media server -------------------------------------------
// The renderer is an http page, so it can't load file:// videos. We serve
// whitelisted local files (clips, screenshots) over 127.0.0.1 instead.
const mediaTokens = new Map(); // token -> absolute file path
let mediaPort = 0;

function registerMedia(filePath) {
  const token = crypto.randomBytes(12).toString("hex");
  mediaTokens.set(token, filePath);
  return `http://127.0.0.1:${mediaPort}/m/${token}`;
}

function startMediaServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const m = req.url.match(/^\/m\/([a-f0-9]+)$/);
      const file = m && mediaTokens.get(m[1]);
      if (!file || !fs.existsSync(file)) {
        res.writeHead(404);
        return res.end();
      }
      const stat = fs.statSync(file);
      const type = file.toLowerCase().endsWith(".png")
        ? "image/png"
        : file.toLowerCase().endsWith(".jpg")
        ? "image/jpeg"
        : "video/mp4";
      const range = req.headers.range;
      if (range) {
        const [, s, e] = range.match(/bytes=(\d*)-(\d*)/) || [];
        const start = s ? parseInt(s, 10) : 0;
        const end = e ? parseInt(e, 10) : stat.size - 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1,
          "Content-Type": type,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": stat.size,
          "Content-Type": type,
          "Accept-Ranges": "bytes",
        });
        fs.createReadStream(file).pipe(res);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      mediaPort = server.address().port;
      resolve();
    });
  });
}

// ---- collector functions -------------------------------------------------

function getRunningGame() {
  return new Promise((resolve) => {
    execFile(
      "tasklist",
      ["/fo", "csv", "/nh"],
      { maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err) return resolve(null);
        for (const line of stdout.split("\n")) {
          const exe = line.split('","')[0]?.replace(/^"/, "").trim().toLowerCase();
          if (exe && KNOWN_GAMES[exe]) {
            return resolve({ exe, ...KNOWN_GAMES[exe] });
          }
        }
        resolve(null);
      }
    );
  });
}

function getClips(gameName) {
  // ShadowPlay default: %USERPROFILE%\Videos\<Game Name>\*.mp4
  const dir = path.join(os.homedir(), "Videos", gameName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .map((f) => {
      const full = path.join(dir, f);
      return { full, name: f, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 4)
    .map((c) => ({ url: registerMedia(c.full), file: c.name }));
}

async function takeScreenshot() {
  // NOTE: fullscreen-exclusive games capture black — run the game in
  // borderless windowed mode for the demo.
  const { width, height } = screen.getPrimaryDisplay().size;
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width, height },
  });
  if (sources.length === 0) return null;
  const png = sources[0].thumbnail.toPNG();
  const file = path.join(os.tmpdir(), `recap-screenshot-${Date.now()}.png`);
  fs.writeFileSync(file, png);
  return { url: registerMedia(file), file };
}

// ---- wiring ---------------------------------------------------------------

ipcMain.handle("get-known-games", () => Object.values(KNOWN_GAMES));
ipcMain.handle("get-current-game", () => getRunningGame());
ipcMain.handle("get-clips", (_e, gameName) => getClips(String(gameName)));
ipcMain.handle("take-screenshot", () => takeScreenshot());

async function smokeTest() {
  console.log("[smoke] running collector smoke test…");
  const game = await getRunningGame();
  console.log("[smoke] getCurrentGame:", game ?? "none detected");
  const clipGame = game?.name ?? "ELDEN RING";
  console.log(`[smoke] getClips(${clipGame}):`, getClips(clipGame));
  const shot = await takeScreenshot();
  console.log("[smoke] takeScreenshot:", shot ? shot.file : "FAILED");
  if (shot) {
    const size = fs.statSync(mediaTokens.get(shot.url.split("/m/")[1])).size;
    console.log(`[smoke] screenshot bytes: ${size}${size < 10000 ? "  (suspiciously small — possibly a black frame)" : ""}`);
  }
  app.quit();
}

app.whenReady().then(async () => {
  await startMediaServer();
  console.log(`[desktop] media server on 127.0.0.1:${mediaPort}`);

  if (process.env.RECAP_SMOKE) return smokeTest();

  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.webContents.on("did-fail-load", () => {
    win.loadURL(
      "data:text/html," +
        encodeURIComponent(
          "<body style='background:#000;color:#888;font-family:serif;display:grid;place-items:center;height:100vh'>" +
            `<div>Couldn't reach ${APP_URL}.<br>Start the web app first: <code>npm run dev</code>, then relaunch.</div></body>`
        )
    );
  });
  win.loadURL(APP_URL);
});

app.on("window-all-closed", () => app.quit());
