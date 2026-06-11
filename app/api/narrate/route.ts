import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { Recap, Scene } from "@/src/types/scene";

type Material = {
  game: string;
  playtimeHours?: number;
  recentHours?: number;
  achievements?: string[];
  notes?: string;
  media: { type: "image" | "video"; path: string }[];
};

const SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Short, epic recap title — like a film or DLC name, not a sentence",
    },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          narration: {
            type: "string",
            description: "1-2 sentences of dramatic movie-trailer narration",
          },
          mediaIndex: {
            type: "integer",
            description: "0-based index into the provided media list",
          },
          durationMs: {
            type: "integer",
            description: "Scene hold time in ms, between 3500 and 5500",
          },
        },
        required: ["narration", "mediaIndex", "durationMs"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "scenes"],
  additionalProperties: false,
} as const;

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
    .map((m, i) => `${i}: [${m.type}] ${m.path.split("/").pop()}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    system:
      "You write narration for cinematic video-game recap trailers — the deep, dramatic " +
      "voice of a prestige game trailer. Sparse, evocative, second person or mythic third " +
      "person. Never cheesy, never listy, never mention numbers like hours played verbatim — " +
      "transmute the raw facts into legend.",
    messages: [
      {
        role: "user",
        content:
          `Create a recap trailer script from this player's raw material.\n\n` +
          `Game: ${material.game}\n` +
          (material.playtimeHours ? `Total hours played: ${material.playtimeHours}\n` : "") +
          (material.recentHours ? `Hours in the last two weeks: ${material.recentHours}\n` : "") +
          (material.achievements?.length
            ? `Recently earned achievements: ${material.achievements.join("; ")}\n`
            : "") +
          (material.notes ? `Player's own notes: ${material.notes}\n` : "") +
          `\nAvailable media (pick a mediaIndex per scene, use each at most once, ` +
          `prefer the video for the opening or climax):\n${mediaList}\n\n` +
          `Write 4-6 scenes. Arc: arrival → struggle → triumph (or cliffhanger if the ` +
          `notes suggest unfinished business). durationMs between 3500 and 5500.`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: SCHEMA as any } },
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("no text block in response");
  const parsed = JSON.parse(text.text) as {
    title: string;
    scenes: { narration: string; mediaIndex: number; durationMs: number }[];
  };

  const scenes: Scene[] = parsed.scenes.slice(0, 7).map((s, i) => {
    const media =
      material.media[Math.min(Math.max(s.mediaIndex, 0), material.media.length - 1)];
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
    `Every legend begins somewhere. For one player, it began in ${material.game}.`,
    material.achievements?.length
      ? `Trials were faced. "${material.achievements[0]}" — earned, not given.`
      : `Countless trials. Countless defeats. And still, they pressed on.`,
    material.notes
      ? `${material.notes.slice(0, 120)} — the story, in their own words.`
      : `Hours turned to days. The world learned their name.`,
    `This is not the end. The journey continues.`,
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
  return { game: material.game, title: `Tales of ${material.game}`, scenes };
}
