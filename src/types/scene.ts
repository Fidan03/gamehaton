// THE CONTRACT — fixed shape consumed by the player and emitted by all collectors.
// Do not change casually. See CLAUDE.md.

export type Scene = {
  id: string;
  narration: string;          // dramatic trailer voice, 1–2 sentences
  mediaType: "image" | "video";
  mediaPath: string;          // URL or path the player can load
  audioPath?: string;         // ElevenLabs narration clip; optional until step 3
  durationMs: number;         // how long the scene holds (~2500–6000)
};

export type Recap = {
  game: string;
  title: string;              // e.g. "Ashes of the Erdtree"
  scenes: Scene[];            // 4–7 scenes
};
