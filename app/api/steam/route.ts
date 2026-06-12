import { NextResponse } from "next/server";

const API = "https://api.steampowered.com";

export type SteamGame = {
  appid: number;
  name: string;
  playtimeHours: number;
  recentHours: number;
  headerUrl: string;
};

// Accepts a SteamID64, a vanity name, or a full profile URL in `id`.
export async function POST(req: Request) {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "STEAM_API_KEY is not set — add it to .env.local" },
      { status: 500 }
    );
  }

  let id: unknown;
  try {
    ({ id } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "id (string) required" }, { status: 400 });
  }

  try {
    const steamId = await resolveSteamId(id.trim(), key);
    if (!steamId) {
      return NextResponse.json(
        { error: "Could not resolve that Steam ID or vanity URL" },
        { status: 404 }
      );
    }

    const res = await fetch(
      `${API}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`GetOwnedGames ${res.status}`);
    const data = await res.json();
    const games: any[] = data?.response?.games ?? [];
    if (games.length === 0) {
      return NextResponse.json(
        { error: "No games found — the profile may be private" },
        { status: 404 }
      );
    }

    const list: SteamGame[] = games
      .sort(
        (a, b) =>
          (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0) ||
          b.playtime_forever - a.playtime_forever
      )
      .slice(0, 12)
      .map((g) => ({
        appid: g.appid,
        name: g.name,
        playtimeHours: Math.round((g.playtime_forever / 60) * 10) / 10,
        recentHours: Math.round(((g.playtime_2weeks ?? 0) / 60) * 10) / 10,
        headerUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }));

    return NextResponse.json({ steamId, games: list });
  } catch (e) {
    return NextResponse.json(
      { error: `Steam API request failed: ${e instanceof Error ? e.message : e}` },
      { status: 502 }
    );
  }
}

async function resolveSteamId(input: string, key: string): Promise<string | null> {
  // full profile URLs
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) return profileMatch[1];
  const vanityMatch = input.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (vanityMatch) input = vanityMatch[1];

  if (/^\d{17}$/.test(input)) return input;

  const res = await fetch(
    `${API}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(input)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`ResolveVanityURL ${res.status}`);
  const data = await res.json();
  return data?.response?.success === 1 ? data.response.steamid : null;
}
