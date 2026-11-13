import fs from "node:fs";
import path from "node:path";

export type RedeemCode = {
  code: string;
  reward?: string;
  added?: string;
  expires?: string | null;
  source?: string;
  sourceName?: string;
};

export type NamedLink = {
  name: string;
  url: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type RedeemStep = {
  name: string;
  text: string;
};

/** Shape of each file in data/games/. Later automation can update codes by editing only that file. */
export type GameData = {
  game: string;
  slug: string;
  publisher: string;
  /** Only when confirmed from an official source. */
  launchDate?: string;
  /** Shown instead of a launch date when no official date is confirmed. */
  launchNote?: string;
  /** Used for ordering when launchDate is unknown. */
  datePublished?: string;
  lastChecked: string;
  description?: string;
  activeCodes: RedeemCode[];
  expiredCodes: RedeemCode[];
  sources: NamedLink[];
  officialChannels: NamedLink[];
  faq?: FaqItem[];
  redeemSteps?: RedeemStep[];
  redeemNote?: string;
};

const DIR = path.join(process.cwd(), "data/games");

export function getAllGames(): GameData[] {
  if (!fs.existsSync(DIR)) return [];
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const games = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as GameData);
  const key = (g: GameData) => g.launchDate || g.datePublished || "";
  return games.sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : a.game.localeCompare(b.game)));
}

export function getGame(slug: string): GameData | undefined {
  return getAllGames().find((g) => g.slug === slug);
}

export function formatDate(iso: string, withTime = false): string {
  const hasTime = /T\d/.test(iso);
  const instant = iso.includes("T") ? iso : `${iso}T00:00:00Z`;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime && hasTime
      ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
      : {}),
  }).format(new Date(instant));
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}
