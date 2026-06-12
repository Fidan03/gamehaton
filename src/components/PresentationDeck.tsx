"use client";

import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type TitlePart = { text: string; highlight?: true };

type Slide = {
  eyebrow: string;
  titleParts: TitlePart[];
  kicker: string;
  beats: string[];
  artifact: "memory" | "engine" | "timeline" | "recap" | "team";
  image: string;
  tint: string;
  accent: string;
};

const slides: Slide[] = [
  {
    eyebrow: "Act I / The memory gap",
    titleParts: [
      { text: "You return to the game. The world remembers you. " },
      { text: "You do not.", highlight: true },
    ],
    kicker:
      "RPGs ask players to hold a whole story in their head, but months later the memories live in screenshots, clips, achievements, and half-forgotten choices.",
    beats: ["Forgotten quests", "Scattered media", "No emotional recap"],
    artifact: "memory",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_hero.jpg",
    tint: "rgba(244,63,94,0.16)",
    accent: "#fb7185",
  },
  {
    eyebrow: "Act II / The product",
    titleParts: [
      { text: "Game Recap", highlight: true },
      { text: " rebuilds your adventure from the moments you already saved." },
    ],
    kicker:
      "It gathers game activity, screenshots, clips, achievements, and notes, then turns them into a short dramatic recap you actually want to watch.",
    beats: ["Clips", "Screenshots", "Achievements"],
    artifact: "engine",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_hero.jpg",
    tint: "rgba(34,211,238,0.18)",
    accent: "#67e8f9",
  },
  {
    eyebrow: "Act III / The transformation",
    titleParts: [
      { text: "Your scattered memories become " },
      { text: "a story", highlight: true },
      { text: " with a beginning, middle, and cliffhanger." },
    ],
    kicker:
      "Instead of a folder full of random media, the player gets a narrated sequence: arrival, struggle, victory, and the reason to come back.",
    beats: ["Arrival", "Struggle", "Triumph"],
    artifact: "timeline",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_hero.jpg",
    tint: "rgba(250,204,21,0.12)",
    accent: "#fbbf24",
  },
  {
    eyebrow: "Act IV / The cinematic moment",
    titleParts: [
      { text: "The recap plays like " },
      { text: "a movie trailer", highlight: true },
      { text: " for your own save file." },
    ],
    kicker:
      "Fullscreen motion, dramatic narration, smooth fades, and AI voice make your last session feel like a legendary episode.",
    beats: ["Fullscreen scenes", "Narrated story", "AI voice"],
    artifact: "recap",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_hero.jpg",
    tint: "rgba(20,184,166,0.15)",
    accent: "#2dd4bf",
  },
  {
    eyebrow: "Final Act / The builders",
    titleParts: [
      { text: "Built by four students who wanted " },
      { text: "game memories", highlight: true },
      { text: " to feel alive again." },
    ],
    kicker:
      "Fidan and Sabina shaped the cinematic front-end experience. Tural and Abdulqadir connected the data and AI flow behind it.",
    beats: ["Fidan", "Sabina", "Tural", "Abdulqadir"],
    artifact: "team",
    image: "https://cdn.cloudflare.steamstatic.com/steam/apps/383870/library_hero.jpg",
    tint: "rgba(168,85,247,0.14)",
    accent: "#a78bfa",
  },
];

type BootPhase = "boot" | "exiting" | "done";

export default function PresentationDeck() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bootPhase, setBootPhase] = useState<BootPhase>("boot");
  const slide = slides[index];
  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index]);

  useEffect(() => {
    const exit = setTimeout(() => setBootPhase("exiting"), 2600);
    const done = setTimeout(() => setBootPhase("done"), 3260);
    return () => { clearTimeout(exit); clearTimeout(done); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setIndex((current) => Math.min(current + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key.toLowerCase() === "p") {
        setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current === slides.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 7600);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] text-neutral-100">
      {bootPhase !== "done" && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030303] ${bootPhase === "exiting" ? "boot-screen-exit" : ""}`}
        >
          <div className="grain pointer-events-none absolute -inset-10 opacity-[0.07]" />
          <div className="presentation-scanlines pointer-events-none absolute inset-0" />
          <div className="boot-scan-line" />

          <p className="boot-text mb-10 text-[10px] uppercase tracking-[0.6em] text-neutral-600">
            Game Recap
          </p>

          <h2 className={`${serif.className} boot-heading mb-14 text-center text-5xl italic leading-tight text-neutral-100 md:text-7xl`}>
            Reconstructing<br />
            <span className="text-cyan-200/75">your memories</span>
          </h2>

          <div className="relative mb-10 h-[3px] w-72 overflow-hidden rounded-full bg-neutral-800/60">
            <div className="boot-glow absolute left-0 top-0 h-full rounded-full bg-cyan-200/40 blur-sm" />
            <div className="boot-fill absolute left-0 top-0 h-full rounded-full bg-cyan-200" />
          </div>

          <div className="w-72 space-y-3">
            {(
              [
                ["save data", "found", 550],
                ["media fragments", "collected", 1050],
                ["story arc", "ready", 1650],
              ] as const
            ).map(([label, status, delay]) => (
              <div
                key={label}
                className="boot-status flex items-center gap-3 text-[9px] uppercase tracking-[0.35em]"
                style={{ animationDelay: `${delay}ms` }}
              >
                <span className="text-neutral-600">{label}</span>
                <span className="h-px flex-1 bg-neutral-800" />
                <span className="text-emerald-300">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        key={slide.image}
        className="presentation-backdrop absolute inset-0"
        style={{ backgroundImage: `linear-gradient(90deg, #030303 0%, rgba(3,3,3,0.76) 45%, rgba(3,3,3,0.42) 100%), url(${slide.image})` }}
      />
      <div className="presentation-grid absolute inset-0 opacity-40" />
      <div className="presentation-scanlines pointer-events-none absolute inset-0" />
      <div className="grain pointer-events-none absolute -inset-10 opacity-[0.07]" />
      <div
        className="presentation-light absolute -right-40 top-1/4 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: slide.tint }}
      />

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 text-xs uppercase tracking-[0.25em] text-neutral-500 md:px-8">
        <Link href="/" className="transition-colors hover:text-neutral-200">
          Game Recap
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((current) => !current)}
            className="rounded border border-white/10 px-3 py-2 text-[10px] text-neutral-300 transition-colors hover:border-cyan-100 hover:text-cyan-100"
          >
            {playing ? "pause" : "auto"}
          </button>
          <div className={`${display.className} hidden items-center gap-3 sm:flex`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="h-px w-16 bg-neutral-800">
              <div className="h-px transition-all duration-500" style={{ width: `${progress}%`, background: slide.accent }} />
            </div>
            <span>{String(slides.length).padStart(2, "0")}</span>
          </div>
        </div>
      </header>

      <section className="relative z-10 grid min-h-screen items-center gap-10 px-5 pb-28 pt-20 md:grid-cols-[0.82fr_1.18fr] md:px-10 lg:px-16">
        <div key={slide.eyebrow} className={`presentation-copy max-w-3xl ${slide.artifact === "team" ? "self-end" : ""}`}>
          <p
            className={`${display.className} mb-5 text-[10px] uppercase tracking-[0.45em]`}
            style={{ color: slide.accent }}
          >
            {slide.eyebrow}
          </p>
          <h1 className={`${serif.className} text-balance text-4xl leading-[1.02] text-neutral-50 md:text-6xl lg:text-7xl`}>
            {slide.titleParts.map((part, i) =>
              part.highlight ? (
                <span
                  key={i}
                  className={display.className}
                  style={{
                    color: slide.accent,
                    fontWeight: 700,
                    fontStyle: "normal",
                    textShadow: `0 0 48px ${slide.accent}55`,
                  }}
                >
                  {part.text.toUpperCase()}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              )
            )}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
            {slide.kicker}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {slide.beats.map((beat, beatIndex) => (
              <span
                key={beat}
                className={`${display.className} presentation-chip rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-neutral-300`}
                style={{ animationDelay: `${beatIndex * 130 + 300}ms` }}
              >
                {beat}
              </span>
            ))}
          </div>
        </div>

        <div key={slide.artifact} className={`presentation-artifact ${slide.artifact === "team" ? "self-start" : ""}`}>
          <SlideArtifact type={slide.artifact} />
        </div>
      </section>

      <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-4 border-t border-white/10 bg-black/50 px-5 py-4 backdrop-blur md:px-8">
        <button
          onClick={() => setIndex((current) => Math.max(current - 1, 0))}
          disabled={index === 0}
          className="h-10 rounded border border-neutral-800 px-4 text-xs uppercase tracking-[0.25em] text-neutral-300 transition-colors hover:border-neutral-400 disabled:opacity-30"
        >
          back
        </button>
        <div className="flex gap-2">
          {slides.map((item, itemIndex) => (
            <button
              key={item.eyebrow}
              aria-label={`Go to chapter ${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={`h-2.5 rounded-full transition-all ${itemIndex === index ? "w-10" : "w-2.5 bg-neutral-700 hover:bg-neutral-500"
                }`}
              style={itemIndex === index ? { background: slide.accent } : undefined}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}
          disabled={index === slides.length - 1}
          className={`${display.className} h-10 rounded border px-4 text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30`}
          style={{ borderColor: `${slide.accent}80`, color: slide.accent }}
        >
          next
        </button>
      </nav>
    </main>
  );
}

function SlideArtifact({ type }: { type: Slide["artifact"] }) {
  if (type === "memory") return <MemoryStorm />;
  if (type === "engine") return <CaptureEngine />;
  if (type === "timeline") return <StoryTimeline />;
  if (type === "recap") return <RecapSimulator />;
  return <TeamPanel />;
}

function MemoryStorm() {
  return (
    <div
      className="relative mx-auto w-full max-w-[720px] overflow-hidden shadow-2xl"
      style={{ background: "#0b0b0b", border: "1px solid rgba(244,63,94,0.22)" }}
    >
      {/* Hero: full-width game art with cinematic overlay */}
      <div className="relative h-52 overflow-hidden">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center memory-drift"
          style={{ backgroundImage: "url(https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_hero.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-[#0b0b0b]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0b]/85 via-transparent to-transparent" />
        <div
          className="memory-scan absolute inset-x-0 top-0 h-full"
          style={{ background: "linear-gradient(to bottom, rgba(244,63,94,0.07), transparent)" }}
        />

        {/* Corrupted badge */}
        <div
          className="absolute right-4 top-4 px-3 py-1.5"
          style={{ border: "1px solid rgba(244,63,94,0.35)", background: "rgba(80,10,20,0.6)" }}
        >
          <span className={`${display.className} text-[9px] uppercase tracking-[0.38em] text-rose-400`}>
            save corrupted
          </span>
        </div>

        {/* Hero stat */}
        <div className="absolute bottom-5 left-5">
          <p className={`${display.className} mb-1.5 text-[8px] uppercase tracking-[0.55em] text-neutral-500`}>
            last session
          </p>
          <p className={`${display.className} text-6xl font-bold leading-none text-white`}>
            4 MONTHS
          </p>
          <p className={`${display.className} mt-2 text-[9px] uppercase tracking-[0.4em] text-rose-400`}>
            ago · story arc unknown
          </p>
        </div>
      </div>

      {/* Two-column data section */}
      <div className="grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Left: corrupted save data */}
        <div className="p-5" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <p className={`${display.className} mb-4 text-[9px] uppercase tracking-[0.45em] text-neutral-600`}>
            fragmented data
          </p>
          <div className="space-y-3">
            {(
              [
                ["main quest", "█ ████ ██", "missing", 0],
                ["allies", "████ ██", "missing", 110],
                ["location", "░░░ ░░", "unknown", 220],
                ["choices", "—", "lost", 330],
              ] as const
            ).map(([label, value, state, delay]) => (
              <div key={label} className="memory-fragment" style={{ animationDelay: `${delay}ms` }}>
                <div className="mb-0.5 flex items-center justify-between">
                  <span className={`${display.className} text-[8px] uppercase tracking-[0.22em] text-neutral-500`}>
                    {label}
                  </span>
                  <span className={`${display.className} text-[8px] uppercase tracking-[0.18em] text-rose-400/60`}>
                    {state}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-neutral-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: narrative + recovery gauge */}
        <div className="flex flex-col justify-between p-5">
          <div>
            <p className={`${display.className} mb-3 text-[9px] uppercase tracking-[0.45em] text-neutral-600`}>
              the gap
            </p>
            <p className={`${serif.className} text-xl italic leading-7 text-neutral-300`}>
              The world moved on. You didn't know where you left off.
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className={`${display.className} text-[9px] uppercase tracking-[0.28em] text-neutral-600`}>
                recoverable
              </span>
              <span className={`${display.className} text-[9px] uppercase tracking-[0.28em] text-rose-400`}>
                3 / 47
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
              <div className="h-1 rounded-full" style={{ width: "6%", background: "rgba(244,63,94,0.6)" }} />
            </div>
            <p className={`${display.className} mt-2 text-[8px] uppercase tracking-[0.25em] text-neutral-800`}>
              memories · fragments · story beats
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function CaptureEngine() {
  const sources = [
    { label: "Current game", count: "1", status: "active" },
    { label: "Saved clips", count: "47", status: "found" },
    { label: "Screenshots", count: "23", status: "found" },
    { label: "Achievements", count: "12", status: "found" },
  ] as const;

  const grid = ["1091500", "1245620", "367520", "1086940", "292030", "1145360"] as const;

  return (
    <div
      className="relative mx-auto w-full max-w-[680px] overflow-hidden shadow-2xl"
      style={{ background: "#0a0a0a", border: "1px solid rgba(103,232,249,0.18)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className={`${display.className} text-[9px] uppercase tracking-[0.45em] text-neutral-500`}>
          Memory collector
        </span>
        <span className={`${display.className} text-[9px] uppercase tracking-[0.4em] text-cyan-300`}>
          finding moments
        </span>
      </div>

      {/* Hero scan */}
      <div className="relative h-40 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_hero.jpg)",
            opacity: 0.48,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        {/* Sweeping scan beam */}
        <div className="scan-beam-x absolute inset-y-0" />

        {/* Info overlay */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <p className={`${display.className} mb-1 text-[8px] uppercase tracking-[0.55em] text-cyan-200/55`}>
              now scanning
            </p>
            <p className={`${display.className} text-sm font-semibold uppercase tracking-widest text-white`}>
              Cyberpunk 2077
            </p>
          </div>
          <div className="text-right">
            <p className={`${display.className} text-[8px] uppercase tracking-[0.35em] text-neutral-500`}>
              fragments found
            </p>
            <p className={`${display.className} text-3xl font-bold leading-none text-cyan-200`}>83</p>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div
        className="grid grid-cols-[0.9fr_1.1fr]"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Sources */}
        <div className="p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <p className={`${display.className} mb-3 text-[8px] uppercase tracking-[0.45em] text-neutral-600`}>
            Data sources
          </p>
          <div className="space-y-1.5">
            {sources.map(({ label, count, status }, i) => (
              <div
                key={label}
                className="process-row flex items-center gap-2.5 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                {status === "active" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full border border-neutral-600" />
                )}
                <span className={`${display.className} flex-1 text-[9px] uppercase tracking-[0.18em] text-neutral-400`}>
                  {label}
                </span>
                <span
                  className={`${display.className} text-[9px] font-semibold tabular-nums`}
                  style={{ color: status === "active" ? "#67e8f9" : "rgba(255,255,255,0.22)" }}
                >
                  {status === "active" ? "LIVE" : count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Collected moments grid */}
        <div className="p-4">
          <p className={`${display.className} mb-3 text-[8px] uppercase tracking-[0.45em] text-neutral-600`}>
            Collected moments
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {grid.map((appid, i) => (
              <div
                key={appid}
                className="relative overflow-hidden border border-white/[0.08]"
                style={{ aspectRatio: "16/9", opacity: i < 4 ? 1 : 0.38 }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg)` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {i === 0 && (
                  <div className="absolute bottom-1 left-1.5">
                    <span className={`${display.className} text-[7px] uppercase tracking-[0.2em] text-cyan-300`}>
                      ready
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Status strip */}
          <div
            className="mt-2.5 flex items-center gap-2 px-2.5 py-2"
            style={{ border: "1px solid rgba(103,232,249,0.14)", background: "rgba(8,51,68,0.35)" }}
          >
            <span className="data-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <p className={`${display.className} text-[8px] uppercase tracking-[0.28em] text-cyan-200/65`}>
              memories become story material
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryTimeline() {
  const acts = [
    {
      num: "01",
      label: "Arrival",
      text: "The game world opens again, and the player remembers the stakes.",
      appid: "1086940",
      artOpacity: 0.18,
      phase: "discovery",
      fill: "25%",
    },
    {
      num: "02",
      label: "Struggle",
      text: "Boss fights, failures, clips, and achievements become the middle act.",
      appid: "1245620",
      artOpacity: 0.28,
      phase: "tension",
      fill: "60%",
    },
    {
      num: "03",
      label: "Triumph",
      text: "The recap ends with momentum: what happened, what changed, what comes next.",
      appid: "367520",
      artOpacity: 0.40,
      phase: "resolution",
      fill: "100%",
    },
  ] as const;

  return (
    <div
      className="relative mx-auto w-full max-w-[700px] overflow-hidden shadow-2xl"
      style={{ border: "1px solid rgba(251,191,36,0.2)", background: "#0a0a0a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(251,191,36,0.15)" }}
      >
        <span className={`${display.className} text-[9px] uppercase tracking-[0.45em] text-neutral-500`}>
          From save file to story
        </span>
        <span className={`${display.className} text-[9px] uppercase tracking-[0.4em] text-amber-400`}>
          cinematic arc
        </span>
      </div>

      {/* Act panels */}
      <div>
        {acts.map(({ num, label, text, appid, artOpacity, phase, fill }, i) => (
          <div
            key={label}
            className="timeline-source relative overflow-hidden"
            style={{
              minHeight: 136,
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
              animationDelay: `${i * 160}ms`,
            }}
          >
            {/* Game art background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg)`,
                opacity: artOpacity,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/55" />

            {/* Amber left film marker */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px]"
              style={{ background: `rgba(251,191,36,${0.35 + i * 0.2})` }}
            />

            {/* Giant act number watermark */}
            <div
              className={`${display.className} pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-[110px] font-bold leading-none select-none`}
              style={{ color: "rgba(255,255,255,0.035)" }}
            >
              {num}
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between px-7 py-5" style={{ minHeight: 136 }}>
              <div>
                <p
                  className={`${display.className} mb-2 text-[8px] font-semibold uppercase tracking-[0.55em]`}
                  style={{ color: `rgba(251,191,36,${0.5 + i * 0.18})` }}
                >
                  Act {num}
                </p>
                <p className={`${serif.className} text-3xl text-neutral-100`}>{label}</p>
                <p className="mt-1.5 text-sm leading-6 text-neutral-400">{text}</p>
              </div>

              {/* Phase progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-800 overflow-hidden">
                  <div
                    className="h-px"
                    style={{ width: fill, background: `rgba(251,191,36,${0.4 + i * 0.2})` }}
                  />
                </div>
                <span
                  className={`${display.className} text-[8px] uppercase tracking-[0.35em]`}
                  style={{ color: `rgba(251,191,36,${0.4 + i * 0.2})` }}
                >
                  {phase}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecapSimulator() {
  return (
    <div className="relative mx-auto aspect-video w-full max-w-[760px] overflow-hidden border border-white/10 bg-black shadow-2xl">
      <div className="recap-frame recap-frame-one absolute inset-0 bg-cover bg-center" />
      <div className="recap-frame recap-frame-two absolute inset-0 bg-cover bg-center" />
      <div className="recap-frame recap-frame-three absolute inset-0 bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/15" />
      <div className="vignette absolute inset-0" />
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-neutral-300">
        <span>Generated recap</span>
        <span className="text-cyan-200">voice rendering</span>
      </div>
      <div className="absolute bottom-8 left-8 right-8">
        <p className={`${serif.className} recap-caption text-balance text-3xl text-neutral-50 md:text-5xl`}>
          Every legend begins with a return.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-1 flex-1 bg-white/10">
            <div className="recap-progress h-1 bg-cyan-200" />
          </div>
          <div className="waveform flex h-8 items-center gap-1">
            {Array.from({ length: 18 }).map((_, i) => (
              <span key={i} className="w-1 bg-cyan-200/80" style={{ animationDelay: `${i * 55}ms` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPanel() {
  const members = [
    { name: "Fidan", role: "front-end", file: "fidan", glow: "rgba(168,85,247,0.5)", scale: 1.0 },
    { name: "Sabina", role: "front-end", file: "sabina", glow: "rgba(168,85,247,0.45)", scale: 1.0 },
    { name: "Tural", role: "back-end", file: "tural", glow: "rgba(103,232,249,0.4)", scale: 1.44 },
    { name: "Abdulqadir", role: "back-end", file: "abdulqadir", glow: "rgba(103,232,249,0.45)", scale: 1.28 },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-[760px] flex-col items-center">

      {/* Characters — soft stage backdrop, no hard box */}
      <div className="relative flex w-full max-w-[700px] justify-center gap-2" style={{ height: 380 }}>
        {/* Dark ground — only covers bottom half, top is fully transparent */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: "linear-gradient(to top, rgba(3,3,3,0.95) 0%, rgba(3,3,3,0.80) 20%, rgba(3,3,3,0.35) 42%, transparent 62%)",
          }}
        />

        {members.map(({ name, role, file, glow, scale }, i) => (
          <div
            key={name}
            className="team-tile relative z-10 flex min-w-0 flex-1 flex-col items-center justify-end pb-5"
            style={{ animationDelay: `${i * 140}ms`, maxWidth: 172 }}
          >
            {/* Floor glow */}
            <div
              className="absolute bottom-9 left-1/2 -translate-x-1/2 h-12 w-32 blur-2xl opacity-80"
              style={{ background: glow }}
            />

            {/* Thin floor line */}
            <div
              className="absolute bottom-9 left-1/2 -translate-x-1/2 h-px w-20 opacity-40"
              style={{ background: glow }}
            />

            {/* Character PNG */}
            <img
              src={`/avatars/${file}.png`}
              alt={name}
              className="absolute bottom-10 left-1/2 w-auto select-none"
              style={{ height: "88%", objectFit: "contain", objectPosition: "bottom", transform: `translateX(-50%) scale(${scale})`, transformOrigin: "bottom center" }}
              draggable={false}
            />

            {/* Name */}
            <div className="relative z-10 w-full px-1 text-center">
              <p
                className={`${display.className} whitespace-nowrap text-[14px] font-bold uppercase text-white md:text-[15px]`}
                style={{
                  letterSpacing: name.length > 8 ? "0.16em" : "0.24em",
                  textShadow: "0 0 18px rgba(255,255,255,0.28)",
                }}
              >
                {name}
              </p>
              <p className={`${display.className} mt-1 text-[9px] uppercase tracking-[0.24em] text-neutral-400`}>
                {role}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* What we built — minimal strip */}
      <div className="mt-3 grid w-full max-w-[560px] grid-cols-3 gap-2">
        {(
          [
            ["Cinematic Player", "01"],
            ["Memory Collector", "02"],
            ["AI Narrator", "03"],
          ] as const
        ).map(([item, num], i) => (
          <div
            key={item}
            className="check-row relative overflow-hidden px-4 py-3"
            style={{
              border: "1px solid rgba(168,85,247,0.18)",
              background: "rgba(168,85,247,0.04)",
              animationDelay: `${i * 150}ms`,
            }}
          >
            <p
              className={`${display.className} pointer-events-none absolute -right-1 -top-1 text-5xl font-bold leading-none select-none`}
              style={{ color: "rgba(168,85,247,0.22)" }}
            >
              {num}
            </p>
            <span className="mb-2 block h-[2px] w-8 rounded-full" style={{ background: "rgba(168,85,247,0.9)", boxShadow: "0 0 6px rgba(168,85,247,0.6)" }} />
            <span className={`${display.className} relative text-[9px] uppercase leading-4 tracking-[0.22em] text-neutral-200`}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
