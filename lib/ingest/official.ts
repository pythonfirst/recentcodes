import { createHash } from "node:crypto";
import { OFFICIAL_SOURCES, type SiteSource, type SteamSource } from "./config";
import { processItems, type SourceItem } from "./pipeline";
import { getPollState, ingest } from "./store";

const UA = "Mozilla/5.0 (compatible; recentcodes-ingest/1.0; +https://recentcodes.vercel.app)";

type SteamNewsItem = { gid: string; title: string; url: string; contents: string; date: number; feedname: string; feed_type: number };

async function pollSteam(src: SteamSource) {
  const state = await getPollState(src.key);
  const since = state?.cursor ? Number(state.cursor) : 0;
  // feeds=steam_community_announcements keeps only the developer's own posts (no press/third-party feeds).
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${src.appId}&count=20&maxlength=0&feeds=steam_community_announcements&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`steam ${res.status}`);
  const data = await res.json();
  const news: SteamNewsItem[] = (data?.appnews?.newsitems || []).filter((n: SteamNewsItem) => n.feedname === "steam_community_announcements");
  const fresh = news.filter((n) => n.date > since);
  const items: SourceItem[] = fresh.map((n) => ({
    itemId: n.gid,
    gameSlug: src.gameSlug,
    url: `https://store.steampowered.com/news/app/${src.appId}/view/${n.gid}`,
    postedAt: new Date(n.date * 1000).toISOString(),
    title: n.title,
    text: n.contents,
    official: true,
    autoPublish: true,
    sourceKind: "steam_announcement",
    sourceName: src.name,
  }));
  const newest = news.reduce((mx, n) => Math.max(mx, n.date), since);
  return { items, cursor: String(newest), lastItemAt: newest ? new Date(newest * 1000).toISOString() : null, seen: news.length };
}

function visibleText(html: string) {
  return html
    .replace(/<(script|style|noscript|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function pollSite(src: SiteSource) {
  const state = await getPollState(src.key);
  const res = await fetch(src.url, { headers: { "User-Agent": UA }, cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error(`site ${res.status}`);
  const text = visibleText(await res.text()).slice(0, 20000);
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);
  if (state?.cursor === hash) return { items: [] as SourceItem[], cursor: hash, lastItemAt: null, seen: 1 };
  const items: SourceItem[] = [
    {
      itemId: `${src.key}#${hash}`,
      gameSlug: src.gameSlug,
      url: src.url,
      postedAt: new Date().toISOString(),
      title: null,
      text,
      official: true,
      autoPublish: false, // marketing pages: always human review
      sourceKind: "official_site",
      sourceName: src.name,
    },
  ];
  return { items, cursor: hash, lastItemAt: null, seen: 1 };
}

export async function runOfficialPoll() {
  const results: Record<string, unknown>[] = [];
  const failedGames = new Set<string>();
  const okBySource: Array<{ src: (typeof OFFICIAL_SOURCES)[number]; r: Awaited<ReturnType<typeof pollSteam>> }> = [];
  for (const src of OFFICIAL_SOURCES) {
    try {
      const r = src.kind === "steam" ? await pollSteam(src) : await pollSite(src);
      okBySource.push({ src, r });
    } catch (e) {
      failedGames.add(src.gameSlug);
      await ingest({ source_key: src.key, kind: "official", status: "error", error: String((e as Error).message) });
      results.push({ source: src.key, status: "error", error: String((e as Error).message) });
    }
  }
  for (const { src, r } of okBySource) {
    const processed = await processItems(r.items);
    const allOk = !failedGames.has(src.gameSlug);
    const res = await ingest({
      source_key: src.key,
      kind: "official",
      status: "ok",
      cursor: r.cursor,
      last_item_at: r.lastItemAt,
      games_checked: allOk ? [src.gameSlug] : [],
      items: processed.items,
      candidates: processed.candidates,
    });
    results.push({
      source: src.key,
      status: "ok",
      seen: r.seen,
      newItems: r.items.length,
      latestItemAt: r.lastItemAt,
      candidates: processed.candidates.length,
      llm: processed.llmStatus,
      ...res,
    });
  }
  return results;
}
