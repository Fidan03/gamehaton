# Cinematic Game Recap

Hackathon project: a cinematic player that plays back a "game recap" (4–7 scenes with dramatic narration), fed by data collectors.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Deploying to Vercel
- API keys (Claude, ElevenLabs) live in serverless API routes only — never in the browser

## THE FIXED CONTRACT
The `Scene` and `Recap` types in `src/types/scene.ts` are the FIXED CONTRACT.
The cinematic player consumes this shape; every data collector (web, desktop) must emit it.
Do not change these types casually — everything hangs off them.

```ts
export type Scene = {
  id: string;
  narration: string;          // dramatic trailer voice, 1–2 sentences
  mediaType: "image" | "video";
  mediaPath: string;          // URL or path the player can load
  audioPath?: string;         // ElevenLabs narration clip; optional until voice step
  durationMs: number;         // how long the scene holds (~2500–6000)
};

export type Recap = {
  game: string;
  title: string;
  scenes: Scene[];            // 4–7 scenes
};
```

Sample data for building/demoing the player: `public/sample/sample-recap.json`.

## API routes
- `POST /api/voice` — `{ text }` → ElevenLabs TTS, returns `audio/mpeg`. Needs
  `ELEVENLABS_API_KEY` in `.env.local` (optional `ELEVENLABS_VOICE_ID`, defaults
  to "Adam"). Client-side `src/lib/voiceover.ts` fans out one call per scene in
  parallel and fills `audioPath` with blob URLs; failures leave `audioPath`
  empty so the player falls back to `durationMs` — playback never breaks.
- `POST /api/narrate` — raw material `{ game, playtimeHours?, achievements?,
  notes?, media[] }` → `{ recap, source }`. Uses Claude (`claude-opus-4-8`,
  structured outputs) with `ANTHROPIC_API_KEY`; without a key or on failure it
  returns a template recap (`source: "fallback"`) so the flow never breaks.
- `POST /api/steam` — `{ id }` (SteamID64 / vanity / profile URL) → resolved
  `steamId` + top games by recent playtime. Needs `STEAM_API_KEY`.
- `POST /api/steam/game` — `{ steamId?, appid }` → real screenshots + trailer
  mp4 from the public Steam store API (no key) + best-effort achievements.

## Flow
Home page = `src/components/CollectorFlow.tsx`: Steam ID input (with demo
profile + sample-recap escape hatches) → game cards → compose (seeded media
from `public/seeded/manifest.json` first, then Steam media; notes; screenshot
upload) → `/api/narrate` → `RecapExperience` (player + ElevenLabs voiceover on
play).

## Build order
1. Player on hardcoded JSON
2. Claude narrator (raw session material → scene JSON)
3. Voice (ElevenLabs audio per scene)
4. Web collector (Steam + seeded clips)
5. Polish + deploy to Vercel
6. (Bonus) Electron desktop collector
