import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { dateOnly, getAllGames } from "@/lib/games";

export default function sitemap(): MetadataRoute.Sitemap {
  const games = getAllGames();
  return [
    { url: `${SITE_URL}/`, lastModified: "2026-11-13" },
    ...games.map((g) => ({
      url: `${SITE_URL}/codes/${g.slug}`,
      lastModified: dateOnly(g.lastChecked),
    })),
    { url: `${SITE_URL}/about`, lastModified: "2026-11-13" },
    { url: `${SITE_URL}/contact`, lastModified: "2026-11-13" },
    { url: `${SITE_URL}/privacy`, lastModified: "2026-11-13" },
  ];
}
