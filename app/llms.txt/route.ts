import { DISCLAIMER, SITE_NAME, SITE_URL } from "@/config/site";
import { getAllGames } from "@/lib/games";

export const dynamic = "force-static";

export function GET() {
  const line = (path: string, title: string, desc: string) => `- [${title}](${SITE_URL}${path}): ${desc}`;
  const games = getAllGames();
  const gameLines = games
    .map((g) =>
      line(
        `/codes/${g.slug}`,
        `${g.game} redeem codes`,
        g.description || `Official redeem codes for ${g.game}.`,
      ),
    )
    .join("\n");
  const body = `# ${SITE_NAME}

> Unofficial fan site that lists only verifiable official game redeem codes, with newest game launches first. ${DISCLAIMER}

We do not list codes circulating on unofficial sites.

## Games
${gameLines}

## About this site
${line("/about", "About Recent Codes", "Unofficial fan resource: what we list, how we verify codes, and the publisher disclaimer.")}
${line("/contact", "Contact", "Email for corrections, business inquiries, or copyright and takedown requests.")}
${line("/privacy", "Privacy Policy", "What data the site collects.")}
- [Sitemap](${SITE_URL}/sitemap.xml)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
