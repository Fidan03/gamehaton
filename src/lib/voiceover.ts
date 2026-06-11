import type { Recap, Scene } from "@/src/types/scene";

/**
 * Generates one ElevenLabs narration clip per scene (in parallel) and returns
 * a copy of the Recap with each scene's audioPath set to a blob object URL.
 * Any scene whose clip fails keeps an empty audioPath — the player then falls
 * back to durationMs timing, so a missing key or network hiccup never breaks
 * playback.
 */
export async function addVoiceover(recap: Recap): Promise<Recap> {
  const scenes = await Promise.all(recap.scenes.map(voiceScene));
  return { ...recap, scenes };
}

async function voiceScene(scene: Scene): Promise<Scene> {
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: scene.narration }),
    });
    if (!res.ok) return scene;
    const blob = await res.blob();
    return { ...scene, audioPath: URL.createObjectURL(blob) };
  } catch {
    return scene;
  }
}
