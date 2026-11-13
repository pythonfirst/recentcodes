/**
 * Merges the static game files (data/games/*.json) with codes published by the ingestion pipeline (Supabase rc_codes).
 * Reads use the public publishable key, which RLS limits to SELECT on published data. Cached with ISR (5 minutes)
 * and revalidated on demand when the pipeline publishes, so new codes show without a redeploy.
 */
import { getAllGames, getGame, type GameData, type RedeemCode } from "./games";

export const REVALIDATE_SECONDS = 300;

type LiveCode = {
  game_slug: string;
  code: string;
  reward: string | null;
  expires_at: string | null;
  source_name: string;
  source_url: string;
  source_posted_at: string;
  published_at: string;
};
type LiveCheck = { game_slug: string; last_checked_at: string };

async function select<T>(path: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["rc-live"] },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

function merge(game: GameData, codes: LiveCode[], checks: LiveCheck[]): GameData {
  const now = Date.now();
  const mine = codes.filter((c) => c.game_slug === game.slug);
  const known = new Set([...game.activeCodes, ...game.expiredCodes].map((c) => c.code));
  const active: RedeemCode[] = [...game.activeCodes];
  const expired: RedeemCode[] = [...game.expiredCodes];
  for (const c of mine) {
    if (known.has(c.code)) continue;
    const rc: RedeemCode = {
      code: c.code,
      reward: c.reward || undefined,
      added: c.source_posted_at,
      expires: c.expires_at ? c.expires_at.slice(0, 10) : null,
      source: c.source_url,
      sourceName: c.source_name,
    };
    // An expiry date is stored as that calendar day; treat the code as expired only after the day has fully passed.
    if (c.expires_at && new Date(c.expires_at).getTime() + 36 * 3600 * 1000 < now) expired.push(rc);
    else active.push(rc);
  }
  const check = checks.find((c) => c.game_slug === game.slug);
  const lastChecked = check && check.last_checked_at > game.lastChecked ? check.last_checked_at : game.lastChecked;
  return { ...game, activeCodes: active, expiredCodes: expired, lastChecked };
}

async function liveData() {
  const [codes, checks] = await Promise.all([
    select<LiveCode>("rc_codes?select=game_slug,code,reward,expires_at,source_name,source_url,source_posted_at,published_at&order=source_posted_at.desc"),
    select<LiveCheck>("rc_game_checks?select=game_slug,last_checked_at"),
  ]);
  return { codes, checks };
}

export async function getLiveGames(): Promise<GameData[]> {
  const { codes, checks } = await liveData();
  return getAllGames().map((g) => merge(g, codes, checks));
}

export async function getLiveGame(slug: string): Promise<GameData | undefined> {
  const game = getGame(slug);
  if (!game) return undefined;
  const { codes, checks } = await liveData();
  return merge(game, codes, checks);
}
