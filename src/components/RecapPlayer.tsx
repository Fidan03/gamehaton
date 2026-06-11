"use client";

import { Cormorant_Garamond } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Recap } from "@/src/types/scene";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const TITLE_MS = 2800;
const FIN_MS = 2600;

// Tiny silent WAV played synchronously inside the click gesture so the browser
// unlocks the <audio> element for the programmatic plays that come later.
function silentWavUri(): string {
  const sampleRate = 8000;
  const samples = 8;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  let bin = "";
  new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return "data:audio/wav;base64," + btoa(bin);
}

// Beat timeline: -1 idle · 0 title card · 1..N scenes · N+1 fin fade · N+2 replay
export default function RecapPlayer({
  recap,
  prepare,
}: {
  recap: Recap;
  // Optional async step run once on first play (e.g. voiceover generation);
  // its result replaces the recap before the title card rolls.
  prepare?: () => Promise<Recap | null>;
}) {
  const [effective, setEffective] = useState(recap);
  const n = effective.scenes.length;
  const [beat, setBeat] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const preparedRef = useRef(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // remaining/started let pause() freeze the countdown and resume() re-arm it
  const timerRef = useRef<{
    id: number | null;
    remaining: number;
    started: number;
    cb: (() => void) | null;
  }>({ id: null, remaining: 0, started: 0, cb: null });

  const clearTimer = useCallback(() => {
    const t = timerRef.current;
    if (t.id !== null) {
      window.clearTimeout(t.id);
      t.id = null;
    }
    t.cb = null;
  }, []);

  const schedule = useCallback(
    (ms: number, cb: () => void) => {
      clearTimer();
      timerRef.current = {
        id: window.setTimeout(cb, ms),
        remaining: ms,
        started: performance.now(),
        cb,
      };
    },
    [clearTimer]
  );

  useEffect(() => {
    if (beat === -1 || beat === n + 2) return;
    if (beat === 0) {
      schedule(TITLE_MS, () => setBeat(1));
      return;
    }
    if (beat <= n) {
      const scene = effective.scenes[beat - 1];
      const advance = () => setBeat(beat + 1);
      const a = audioRef.current;
      if (scene.audioPath && a) {
        // audio length wins over durationMs; onEnded advances
        clearTimer();
        a.src = scene.audioPath;
        a.currentTime = 0;
        a.play().catch(() => schedule(scene.durationMs, advance));
      } else {
        a?.pause();
        schedule(scene.durationMs, advance);
      }
      return;
    }
    schedule(FIN_MS, () => setBeat(n + 2));
  }, [beat, n, effective.scenes, schedule, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const start = useCallback(async () => {
    setPaused(false);
    if (prepare && !preparedRef.current) {
      preparedRef.current = true;
      const a = audioRef.current;
      if (a) {
        // consume the click gesture to unlock programmatic audio later
        a.src = silentWavUri();
        a.play().catch(() => {});
      }
      setPreparing(true);
      try {
        const r = await prepare();
        if (r) setEffective(r);
      } catch {
        // keep the silent recap — playback must never break
      }
      setPreparing(false);
    }
    setBeat(0);
  }, [prepare]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const pausing = !p;
      const t = timerRef.current;
      if (pausing) {
        if (t.id !== null) {
          window.clearTimeout(t.id);
          t.id = null;
          t.remaining -= performance.now() - t.started;
        }
        audioRef.current?.pause();
      } else {
        if (t.cb && t.id === null) {
          t.started = performance.now();
          t.id = window.setTimeout(t.cb, Math.max(50, t.remaining));
        }
        const a = audioRef.current;
        if (a && a.src && a.paused && !a.ended) a.play().catch(() => {});
      }
      return pausing;
    });
  }, []);

  const onSurfaceClick = () => {
    if (preparing) return;
    if (beat === -1 || beat === n + 2) start();
    else togglePause();
  };

  return (
    <div
      onClick={onSurfaceClick}
      className="fixed inset-0 select-none cursor-pointer overflow-hidden bg-black"
    >
      {/* scene layers, all mounted so media preloads; crossfade via opacity */}
      {effective.scenes.map((scene, i) => {
        const sceneBeat = i + 1;
        const active = beat === sceneBeat;
        const started = beat >= sceneBeat && beat <= n + 2;
        return (
          <div
            key={scene.id}
            className={`absolute inset-0 transition-opacity ease-in-out duration-[1400ms] ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`absolute -inset-[2%] ${
                started ? (i % 2 === 0 ? "kenburns-a" : "kenburns-b") : ""
              }`}
              style={{ animationPlayState: paused ? "paused" : "running" }}
            >
              {scene.mediaType === "video" ? (
                <video
                  src={scene.mediaPath}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={scene.mediaPath}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div
              className={`absolute inset-x-0 bottom-[15%] px-[10%] text-center transition-all ease-out duration-[1600ms] ${
                active
                  ? "opacity-100 translate-y-0 delay-700"
                  : "opacity-0 translate-y-3 delay-0"
              }`}
            >
              <p
                className={`${serif.className} text-2xl md:text-4xl font-light italic leading-snug text-neutral-100 [text-shadow:0_2px_24px_rgba(0,0,0,0.9)]`}
              >
                {scene.narration}
              </p>
            </div>
          </div>
        );
      })}

      {/* title card — above scenes so scene 1 fades in beneath it */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-black px-8 transition-opacity ease-in-out duration-[1400ms] ${
          beat === 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        {beat >= 0 && beat <= 1 && (
          <>
            <p className="title-in mb-7 text-xs uppercase tracking-[0.55em] text-neutral-500 md:text-sm">
              {effective.game}
            </p>
            <h1
              className={`${serif.className} title-in text-center text-5xl font-medium text-neutral-100 md:text-7xl`}
            >
              {effective.title}
            </h1>
          </>
        )}
      </div>

      {/* mood: vignette + animated film grain */}
      <div className="vignette pointer-events-none absolute inset-0 z-20" />
      <div className="grain pointer-events-none absolute -inset-[4%] z-20 opacity-[0.07]" />

      {/* letterbox bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[7vh] bg-black" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[7vh] bg-black" />

      {/* fin fade-out */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-black transition-opacity ease-in duration-[2200ms] ${
          beat >= n + 1 ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <p
          className={`${serif.className} text-3xl italic text-neutral-500 transition-opacity duration-1000 ${
            beat >= n + 1 ? "opacity-100 delay-1000" : "opacity-0"
          }`}
        >
          fin
        </p>
      </div>

      {/* idle: single play button */}
      {beat === -1 && !preparing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-9 bg-black">
          <p className="text-xs uppercase tracking-[0.55em] text-neutral-600">
            {effective.game}
          </p>
          <button
            aria-label="Play recap"
            className="group flex h-20 w-20 items-center justify-center rounded-full border border-neutral-700 transition-colors duration-300 hover:border-neutral-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-7 w-7 fill-neutral-400 transition-colors duration-300 group-hover:fill-neutral-100"
            >
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
          <p
            className={`${serif.className} text-lg italic tracking-wide text-neutral-600`}
          >
            {effective.title}
          </p>
        </div>
      )}

      {/* voiceover generation veil */}
      {preparing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black">
          <div className="flex gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:400ms]" />
          </div>
          <p
            className={`${serif.className} animate-pulse text-xl italic tracking-wide text-neutral-400`}
          >
            Summoning the narrator…
          </p>
        </div>
      )}

      {/* paused veil */}
      {paused && beat >= 0 && beat < n + 2 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex gap-2.5 opacity-80">
            <div className="h-9 w-[5px] rounded-sm bg-neutral-200" />
            <div className="h-9 w-[5px] rounded-sm bg-neutral-200" />
          </div>
        </div>
      )}

      {/* replay */}
      {beat === n + 2 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-black">
          <button
            aria-label="Replay recap"
            className="group flex h-16 w-16 items-center justify-center rounded-full border border-neutral-700 transition-colors duration-300 hover:border-neutral-200"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 fill-none stroke-neutral-400 stroke-[1.75] transition-colors duration-300 group-hover:stroke-neutral-100"
            >
              <path d="M4 10a8 8 0 1 1 1.7 6.9" strokeLinecap="round" />
              <path d="M4 5v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-xs uppercase tracking-[0.45em] text-neutral-600">
            replay
          </p>
        </div>
      )}

      <audio
        ref={audioRef}
        // advance only while inside scenes — the unlock wav also fires onEnded
        onEnded={() => setBeat((b) => (b >= 1 && b <= n ? b + 1 : b))}
        className="hidden"
      />
    </div>
  );
}
