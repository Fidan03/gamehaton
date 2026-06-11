import { NextResponse } from "next/server";

const API = "https://api.steampowered.com";

export type GameMedia = { type: "image" | "video"; path: string };

// Per-game detail: real screenshots + trailer clips from the public Steam
// store API (no key needed), plus the player's achievements (best-effort,
// needs STEAM_API_KEY and a public profile).
export async function POST(req: Request) {
  let body: { steamId?: string; appid?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { steamId, appid } = body;
  if (typeof appid !== "number") {
    return NextResponse.json({ error: "appid (number) required" }, { status: 400 });
  }

  const [media, achievements] = await Promise.all([
    fetchStoreMedia(appid),
    typeof steamId === "string" ? fetchAchievements(steamId, appid) : Promise.resolve([]),
  ]);

  return NextResponse.json({ media, achievements });
}

async function fetchStoreMedia(appid: number): Promise<GameMedia[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&l=en`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.[appid]?.data;
    if (!data) return [];

    const media: GameMedia[] = [];
    // one trailer up front gives the recap real motion
    const movie = data.movies?.[0]?.mp4?.max ?? data.movies?.[0]?.mp4?.["480"];
    if (movie) media.push({ type: "video", path: movie });
    for (const ss of (data.screenshots ?? []).slice(0, 6)) {
      if (ss?.path_full) media.push({ type: "image", path: ss.path_full });
    }
    if (media.length === 0 && data.header_image) {
      media.push({ type: "image", path: data.header_image });
    }
    return media;
  } catch {
    return [];
  }
}

async function fetchAchievements(steamId: string, appid: number): Promise<string[]> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return [];
  try {
    const [playerRes, schemaRes] = await Promise.all([
      fetch(
        `${API}/ISteamUserStats/GetPlayerAchievements/v1/?key=${key}&steamid=${steamId}&appid=${appid}`,
        { cache: "no-store" }
      ),
      fetch(`${API}/ISteamUserStats/GetSchemaForGame/v2/?key=${key}&appid=${appid}`, {
        next: { revalidate: 3600 },
      }),
    ]);
    if (!playerRes.ok) return [];
    const player = await playerRes.json();
    const unlocked: any[] = (player?.playerstats?.achievements ?? [])
      .filter((a: any) => a.achieved === 1)
      .sort((a: any, b: any) => (b.unlocktime ?? 0) - (a.unlocktime ?? 0))
      .slice(0, 10);

    let names: Record<string, string> = {};
    if (schemaRes.ok) {
      const schema = await schemaRes.json();
      for (const a of schema?.game?.availableGameStats?.achievements ?? []) {
        names[a.name] = a.displayName;
      }
    }
    return unlocked.map(
      (a) => names[a.apiname] ?? a.apiname.replace(/_/g, " ").toLowerCase()
    );
  } catch {
    return [];
  }
}
