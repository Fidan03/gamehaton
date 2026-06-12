"use client";

import { Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import RecapExperience from "@/src/components/RecapExperience";
import type { Recap } from "@/src/types/scene";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

type SteamGame = {
  appid: number;
  name: string;
  playtimeHours: number;
  recentHours: number;
  headerUrl: string;
};
type Media = { type: "image" | "video"; path: string };

// Demo fallback so the flow is walkable without a Steam key / public profile
const DEMO_GAMES: SteamGame[] = [
  { appid: 1245620, name: "ELDEN RING", playtimeHours: 142.3, recentHours: 11.2 },
  { appid: 1145360, name: "Hades", playtimeHours: 87.5, recentHours: 4.5 },
  { appid: 1086940, name: "Baldur's Gate 3", playtimeHours: 96.1, recentHours: 8.9 },
  { appid: 292030, name: "The Witcher 3: Wild Hunt", playtimeHours: 210.7, recentHours: 0 },
  { appid: 367520, name: "Hollow Knight", playtimeHours: 64.2, recentHours: 2.1 },
  { appid: 1091500, name: "Cyberpunk 2077", playtimeHours: 78.4, recentHours: 6.3 },
].map((g) => ({
  ...g,
  headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
}));

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Step = "input" | "games" | "compose" | "narrating" | "player";

export default function CollectorFlow({ sample }: { sample: Recap }) {
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [steamInput, setSteamInput] = useState("");
  const [steamId, setSteamId] = useState<string | null>(null);
  const [games, setGames] = useState<SteamGame[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  const [game, setGame] = useState<SteamGame | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const [recap, setRecap] = useState<Recap | null>(null);

  const lookupGames = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: steamInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `request failed (${res.status})`);
      setSteamId(data.steamId);
      setGames(data.games);
      setIsDemo(false);
      setStep("games");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const useDemo = () => {
    setError("");
    setSteamId(null);
    setGames(DEMO_GAMES);
    setIsDemo(true);
    setStep("games");
  };

  const pickGame = async (g: SteamGame) => {
    setGame(g);
    setNotes("");
    setAchievements([]);
    setStep("compose");
    setMediaLoading(true);
    try {
      const [detailRes, manifestRes] = await Promise.all([
        fetch("/api/steam/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steamId, appid: g.appid }),
        }),
        fetch("/seeded/manifest.json"),
      ]);
      const detail = detailRes.ok ? await detailRes.json() : { media: [], achievements: [] };
      const manifest = manifestRes.ok ? await manifestRes.json() : {};
      const seeded: Media[] = manifest[slugify(g.name)] ?? [];
      const combined = [...seeded, ...(detail.media ?? [])];
      setMedia(
        combined.length > 0 ? combined : [{ type: "image", path: g.headerUrl }]
      );
      setAchievements(detail.achievements ?? []);
    } catch {
      setMedia([{ type: "image", path: g.headerUrl }]);
    } finally {
      setMediaLoading(false);
    }
  };

  const addScreenshot = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setMedia((m) => [{ type: "image", path: URL.createObjectURL(file) }, ...m]);
  };

  const createRecap = async () => {
    if (!game) return;
    setStep("narrating");
    setError("");
    try {
      const res = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game: game.name,
          playtimeHours: game.playtimeHours,
          recentHours: game.recentHours,
          achievements,
          notes,
          media,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `narration failed (${res.status})`);
      setRecap(data.recap);
      setStep("player");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Narration failed");
      setStep("compose");
    }
  };

  // ---- player takeover ----
  if (step === "player" && recap) {
    return (
      <>
        <RecapExperience recap={recap} />
        <button
          aria-label="Back to setup"
          onClick={() => setStep("compose")}
          className="fixed right-5 top-5 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-200"
        >
          ✕
        </button>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-14 text-neutral-200">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex justify-end">
          <Link
            href="/presentation"
            className="rounded border border-cyan-200/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-cyan-100 transition-colors hover:border-cyan-100 hover:bg-cyan-950/20"
          >
            presentation
          </Link>
        </div>
        <header className="mb-12 text-center">
          <p className="mb-3 text-[11px] uppercase tracking-[0.5em] text-neutral-600">
            cinematic game recap
          </p>
          <h1 className={`${serif.className} text-4xl text-neutral-100 md:text-5xl`}>
            Your sessions, retold as legend
          </h1>
        </header>

        {error && (
          <p className="mb-6 rounded border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {step === "input" && (
          <section className="mx-auto max-w-md">
            <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-neutral-500">
              SteamID64 · vanity name · profile URL
            </label>
            <div className="flex gap-2">
              <input
                value={steamInput}
                onChange={(e) => setSteamInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && steamInput.trim() && lookupGames()}
                placeholder="76561198…  or  gaben"
                className="w-full rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm outline-none transition-colors placeholder:text-neutral-700 focus:border-neutral-500"
              />
              <button
                onClick={lookupGames}
                disabled={busy || !steamInput.trim()}
                className="rounded border border-neutral-700 px-5 text-sm transition-colors hover:border-neutral-300 disabled:opacity-40"
              >
                {busy ? "…" : "→"}
              </button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-600">
              <button onClick={useDemo} className="underline-offset-4 hover:text-neutral-300 hover:underline">
                use demo profile
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  setRecap(sample);
                  setStep("player");
                }}
                className="underline-offset-4 hover:text-neutral-300 hover:underline"
              >
                watch sample recap
              </button>
            </div>
          </section>
        )}

        {step === "games" && (
          <section>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                {isDemo ? "demo library — pick a game" : "your most-played — pick a game"}
              </h2>
              <button
                onClick={() => setStep("input")}
                className="text-xs text-neutral-600 hover:text-neutral-300"
              >
                ← back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {games.map((g) => (
                <button
                  key={g.appid}
                  onClick={() => pickGame(g)}
                  className="group overflow-hidden rounded border border-neutral-900 bg-neutral-950 text-left transition-colors hover:border-neutral-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.headerUrl}
                    alt=""
                    className="aspect-[460/215] w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                  <div className="p-3">
                    <p className="truncate text-sm text-neutral-200">{g.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      {g.playtimeHours}h
                      {g.recentHours > 0 && ` · ${g.recentHours}h recent`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "compose" && game && (
          <section>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className={`${serif.className} text-2xl text-neutral-100`}>{game.name}</h2>
              <button
                onClick={() => setStep("games")}
                className="text-xs text-neutral-600 hover:text-neutral-300"
              >
                ← back
              </button>
            </div>

            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">footage</p>
            {mediaLoading ? (
              <p className="mb-6 animate-pulse text-sm text-neutral-600">
                gathering footage…
              </p>
            ) : (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {media.map((m, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-36 flex-none overflow-hidden rounded border border-neutral-900"
                  >
                    {m.type === "video" ? (
                      <video src={m.path} muted className="h-full w-full object-cover" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={m.path} alt="" className="h-full w-full object-cover" />
                    )}
                    {m.type === "video" && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-neutral-300">
                        ▶
                      </span>
                    )}
                  </div>
                ))}
                <label className="flex h-20 w-36 flex-none cursor-pointer items-center justify-center rounded border border-dashed border-neutral-800 text-xs text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-400">
                  + screenshot
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => addScreenshot(e.target.files?.[0])}
                  />
                </label>
              </div>
            )}

            {achievements.length > 0 && (
              <>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
                  recent achievements
                </p>
                <div className="mb-6 flex flex-wrap gap-2">
                  {achievements.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </>
            )}

            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
              your notes <span className="normal-case tracking-normal">(optional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="finally beat Malenia after 40 tries…"
              className="mb-8 w-full rounded border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm outline-none transition-colors placeholder:text-neutral-700 focus:border-neutral-500"
            />

            <button
              onClick={createRecap}
              disabled={mediaLoading || media.length === 0}
              className="w-full rounded border border-neutral-600 py-4 text-sm uppercase tracking-[0.3em] text-neutral-200 transition-colors hover:border-neutral-200 hover:bg-neutral-950 disabled:opacity-40"
            >
              create my recap
            </button>
          </section>
        )}

        {step === "narrating" && (
          <section className="py-24 text-center">
            <div className="mb-6 flex justify-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:400ms]" />
            </div>
            <p className={`${serif.className} animate-pulse text-2xl italic text-neutral-400`}>
              Writing your legend…
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
