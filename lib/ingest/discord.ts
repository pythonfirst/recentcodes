import { DISCORD, DISCORD_GAMES } from "./config";
import { processItems, type SourceItem } from "./pipeline";
import { getPollState, ingest, type IngestPayload } from "./store";

const API = "https://discord.com/api/v10";
const SOURCE_KEY = `discord:${DISCORD.channelId}`;
const IS_CROSSPOST = 1 << 1;

type DiscordMessage = {
  id: string;
  type: number;
  timestamp: string;
  flags?: number;
  content: string;
  author?: { username?: string };
  message_reference?: { message_id?: string; channel_id?: string; guild_id?: string };
  embeds?: Array<{ title?: string; description?: string; fields?: Array<{ name: string; value: string }> }>;
};

function messageText(m: DiscordMessage) {
  const parts = [m.content || ""];
  for (const e of m.embeds || []) {
    parts.push(e.title || "", e.description || "");
    for (const f of e.fields || []) parts.push(`${f.name}: ${f.value}`);
  }
  return parts.filter(Boolean).join("\n");
}

async function fetchMessages(token: string, after: string | null): Promise<DiscordMessage[]> {
  const all: DiscordMessage[] = [];
  let cursor = after;
  for (let page = 0; page < 5; page++) {
    const qs = cursor ? `after=${cursor}&limit=100` : `limit=50`;
    const res = await fetch(`${API}/channels/${DISCORD.channelId}/messages?${qs}`, {
      headers: { Authorization: `Bot ${token}`, "User-Agent": "recentcodes-ingest (https://recentcodes.vercel.app, 1.0)" },
      cache: "no-store",
    });
    if (res.status === 429) break;
    if (!res.ok) throw new Error(`discord messages ${res.status}`);
    const batch = (await res.json()) as DiscordMessage[];
    all.push(...batch);
    if (!cursor || batch.length < 100) break; // first run: just the latest 50
    cursor = batch.reduce((mx, m) => (BigInt(m.id) > BigInt(mx) ? m.id : mx), cursor);
  }
  return all;
}

export async function runDiscordPoll() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    const payload: IngestPayload = { source_key: SOURCE_KEY, kind: "discord", status: "not_configured", error: "DISCORD_BOT_TOKEN not configured" };
    await ingest(payload);
    return { status: "not_configured" as const };
  }
  const state = await getPollState(SOURCE_KEY);
  let messages: DiscordMessage[];
  try {
    messages = await fetchMessages(token, state?.cursor ?? null);
  } catch (e) {
    await ingest({ source_key: SOURCE_KEY, kind: "discord", status: "error", error: String((e as Error).message) });
    return { status: "error" as const, error: String((e as Error).message) };
  }
  messages.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  const newest = messages[messages.length - 1];

  const items: SourceItem[] = [];
  let skipped = 0;
  for (const m of messages) {
    if (m.type !== 0 && m.type !== 19) { skipped++; continue; } // 12 = channel-follow notice, etc.
    const ref = m.message_reference;
    const followed = ref?.channel_id ? DISCORD.followed[ref.channel_id] : undefined;
    const official = Boolean(((m.flags || 0) & IS_CROSSPOST) && followed && ref?.guild_id === followed.guildId);
    const officialUrl = official && ref?.message_id ? `https://discord.com/channels/${ref.guild_id}/${ref.channel_id}/${ref.message_id}` : null;
    items.push({
      itemId: m.id,
      gameSlug: followed?.gameSlug || "unknown",
      url: officialUrl ?? `https://discord.com/channels/${DISCORD.guildId}/${DISCORD.channelId}/${m.id}`,
      postedAt: m.timestamp,
      title: null,
      text: messageText(m),
      official,
      autoPublish: official,
      sourceKind: official ? "discord_official" : "discord_unverified",
      sourceName: official && followed ? followed.name : "#code-feed (not an official crosspost)",
    });
  }
  const processed = await processItems(items);
  const result = await ingest({
    source_key: SOURCE_KEY,
    kind: "discord",
    status: "ok",
    cursor: newest?.id ?? state?.cursor ?? null,
    last_item_at: newest?.timestamp ?? null,
    games_checked: DISCORD_GAMES,
    items: processed.items,
    candidates: processed.candidates,
  });
  return {
    status: "ok" as const,
    fetched: messages.length,
    skippedNonPosts: skipped,
    officialPosts: items.filter((i) => i.official).length,
    latestMessageAt: newest?.timestamp ?? state?.last_item_at ?? null,
    candidates: processed.candidates.length,
    llm: processed.llmStatus,
    ...result,
  };
}
