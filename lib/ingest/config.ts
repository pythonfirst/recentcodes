/**
 * Official sources polled by the ingestion pipeline. Official sources only: never third-party code sites.
 * Every entry here was checked by hand; see README "Automated ingestion" for citations.
 */

/** Discord: #code-feed in our own "recentcodes" server receives official announcement channels via channel Follow. */
export const DISCORD = {
  guildId: "1570767887961030776", // recentcodes
  channelId: "1570768316987998348", // #code-feed
  /** Followed official channels -> game. Only crossposts whose message_reference points here count as official. */
  followed: {
    // KOF: Legend official server, #🎁｜gift-code-drops (added to #code-feed by channel Follow on 2026-11-13)
    "1534809566112514158": { gameSlug: "kof-legend", guildId: "1532667046511513671", name: "KOF: Legend official Discord #gift-code-drops" },
  } as Record<string, { gameSlug: string; guildId: string; name: string }>,
};

export type SteamSource = { kind: "steam"; key: string; gameSlug: string; appId: number; name: string };
export type SiteSource = { kind: "site"; key: string; gameSlug: string; url: string; name: string };
export type OfficialSource = SteamSource | SiteSource;

export const OFFICIAL_SOURCES: OfficialSource[] = [
  // Dawn's Wake: Steam app 4635160 (developer announcements feed only; press feeds are excluded).
  { kind: "steam", key: "steam:4635160", gameSlug: "dawns-wake", appId: 4635160, name: "Dawn's Wake official Steam announcements" },
  // Official websites. Both are mostly client-rendered marketing pages, so matches from them always go to review.
  { kind: "site", key: "site:sword.neptunegamez.com", gameSlug: "dawns-wake", url: "https://sword.neptunegamez.com/en", name: "Dawn's Wake official website" },
  { kind: "site", key: "site:transformerseternalwar.com", gameSlug: "transformers-eternal-war", url: "https://transformerseternalwar.com", name: "Transformers: Eternal War official website" },
  // Official X accounts (e.g. x.com/TFEternalWar) are not polled: X's API has no free read access and we do not scrape.
];

/** Games whose "last checked" time is refreshed by each poller when all of that poller's sources for the game succeed. */
export const DISCORD_GAMES = ["kof-legend"];

/** Auto-publish threshold. Anything below goes to the private review queue. */
export const PUBLISH_THRESHOLD = 0.85;
