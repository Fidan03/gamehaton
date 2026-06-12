import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { Recap, Scene } from "@/src/types/scene";

type Material = {
  game: string;
  playtimeHours?: number;
  recentHours?: number;
  achievements?: string[];
  notes?: string;
  media: { type: "image" | "video"; path: string; description?: string }[];
};

// Second-person narrator: the model picks a mediaPath per scene directly from
// the provided list, so the output mirrors the FIXED CONTRACT scene shape.
const SCHEMA = {
  type: "object",
  properties: {
    game: { type: "string" },
    title: {
      type: "string",
      description: "Short, evocative recap title (2–5 words)",
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          narration: {
            type: "string",
            description:
              "1–2 sentences, second person, spoken aloud (~12–28 words)",
          },
          mediaType: { type: "string", enum: ["image", "video"] },
          mediaPath: {
            type: "string",
            description: "Exact mediaPath copied from the provided media list",
          },
          durationMs: {
            type: "integer",
            description: "Scene hold time in ms, between 2500 and 6000",
          },
        },
        required: ["id", "narration", "mediaType", "mediaPath", "durationMs"],
        additionalProperties: false,
      },
    },
  },
  required: ["game", "title", "scenes"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are a cinematic narrator writing a personal, second-person recap of ONE player's
gaming session. Prestige game-trailer voice, but speaking directly to the player as
"you" — as if the game itself is recounting your journey.

You receive: the game's name, a list of available media (clips/screenshots, each with
mediaType, mediaPath, and an optional description), and optionally player notes,
achievements, and total playtime.

VOICE & CONTENT:
- Address the player as "you" throughout. e.g. "You stepped into the fog." "You fell
  here, again and again." "You chose to press on instead of turning back."
- Make it about THIS game and THIS session: where you arrived, where you struggled or
  got stuck, the choices you made, how it turned. Build an arc: arrival → struggle or
  setback → a turning point or choice → triumph or cliffhanger.
- Use the game's real world, tone, and vocabulary (you know it from its name) for
  atmosphere.

GROUNDING — do not fabricate (this is critical):
- Any SPECIFIC claim — a named boss, mission, death, choice, or outcome — must be
  supported by the provided evidence: achievement names, clip/screenshot descriptions,
  player notes, or playtime. Achievement names and clip descriptions are your best
  source of real specifics — lean on them.
- When evidence is thin, stay personal and evocative about the EXPERIENCE using the
  game's authentic atmosphere, but do NOT invent specific events. "You pushed deeper
  than you meant to" needs no evidence; "You slew Malenia" requires evidence that you
  did. Never contradict or overstate what the evidence shows.

FORM:
- 4 to 7 scenes. A short, evocative title (2–5 words).
- 1–2 sentences per scene, ~12–28 words, WRITTEN TO BE SPOKEN ALOUD: natural rhythm,
  no tongue-twisters, room to breathe between lines.
- Use ONLY mediaPath values from the provided list; one per scene (you may reuse a
  strong one if media is thin). Set mediaType to match. Set durationMs 2500–6000.
  Leave audioPath empty — it is filled in later.
- Output ONLY valid JSON in this exact shape, no markdown fences, no commentary:

{
  "game": string,
  "title": string,
  "scenes": [
    { "id": string, "narration": string, "mediaType": "image" | "video",
      "mediaPath": string, "durationMs": number }
  ]
}`;

export async function POST(req: Request) {
  let material: Material;
  try {
    material = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!material?.game || !Array.isArray(material.media) || material.media.length === 0) {
    return NextResponse.json(
      { error: "game (string) and media (non-empty array) required" },
      { status: 400 }
    );
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const recap = await narrateWithClaude(material);
      return NextResponse.json({ recap, source: "claude" });
    } catch (e) {
      console.error("narrate: Claude failed, using fallback:", e);
    }
  }
  // no key or Claude failed — the demo must still produce a recap
  return NextResponse.json({ recap: fallbackRecap(material), source: "fallback" });
}

async function narrateWithClaude(material: Material): Promise<Recap> {
  const client = new Anthropic();

  const mediaList = material.media
    .map((m) => {
      const desc = m.description ? ` — ${m.description}` : "";
      return `- mediaType: ${m.type}, mediaPath: ${m.path}${desc}`;
    })
    .join("\n");

  const userContent =
    `Game: ${material.game}\n\n` +
    `Available media (use ONLY these mediaPath values, one per scene):\n${mediaList}\n` +
    (material.playtimeHours ? `\nTotal playtime: ${material.playtimeHours} hours` : "") +
    (material.recentHours ? `\nPlaytime in the last two weeks: ${material.recentHours} hours` : "") +
    (material.achievements?.length
      ? `\nAchievements earned: ${material.achievements.join("; ")}`
      : "") +
    (material.notes ? `\nPlayer's notes: ${material.notes}` : "") +
    `\n\nWrite the recap now as JSON in the exact shape specified.`;

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: { type: "json_schema", schema: SCHEMA as any } },
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no text block in response");
  const parsed = JSON.parse(text.text) as {
    game?: string;
    title: string;
    scenes: {
      id?: string;
      narration: string;
      mediaType: "image" | "video";
      mediaPath: string;
      durationMs: number;
    }[];
  };

  // Map each returned mediaPath back to a real media item. The actual media's
  // type is authoritative so the player always loads the right element; an
  // unknown path falls back to a real one rather than breaking playback.
  const byPath = new Map(material.media.map((m) => [m.path, m]));

  const scenes: Scene[] = parsed.scenes.slice(0, 7).map((s, i) => {
    const media = byPath.get(s.mediaPath) ?? material.media[i % material.media.length];
    return {
      id: `scene-${i + 1}`,
      narration: s.narration,
      mediaType: media.type,
      mediaPath: media.path,
      audioPath: "",
      durationMs: Math.min(Math.max(s.durationMs, 2500), 6000),
    };
  });

  return { game: material.game, title: parsed.title, scenes };
}

function fallbackRecap(material: Material): Recap {
  const lines = [
    `${material.game}. You stepped in not knowing how far it would pull you under.`,
    material.achievements?.length
      ? `You earned this here: "${material.achievements[0]}." Not given — taken.`
      : `You struggled in this place. You came back anyway, again and again.`,
    material.notes
      ? `In your own words: ${material.notes.slice(0, 120)}`
      : `Somewhere in the dark, it stopped being a game and became your story.`,
    `This isn't where it ends. It's only where you stopped to breathe.`,
  ];
  const scenes: Scene[] = lines.map((narration, i) => {
    const media = material.media[i % material.media.length];
    return {
      id: `scene-${i + 1}`,
      narration,
      mediaType: media.type,
      mediaPath: media.path,
      audioPath: "",
      durationMs: 4500,
    };
  });
  return { game: material.game, title: `Your ${material.game} Story`, scenes };
}
