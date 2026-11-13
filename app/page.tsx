import type { Metadata } from "next";
import Link from "next/link";
import { NOINDEX, SITE_NAME } from "@/config/site";
import LastUpdated from "@/components/LastUpdated";
import QuickAnswer from "@/components/QuickAnswer";
import { JsonLd } from "@/components/JsonLd";
import { pageMeta, webPageLd } from "@/lib/seo";
import { formatDate } from "@/lib/games";
import { getLiveGames } from "@/lib/live";
import { PENDING_LABEL } from "@/components/CodeTable";

export const revalidate = 300;

const UPDATED = "2026-11-13";
const TITLE = `Official Game Redeem Codes | ${SITE_NAME}`;
const DESCRIPTION =
  "Recent Codes lists only verifiable official game redeem codes, with newest game launches first. An unofficial fan resource, not affiliated with any publisher.";

export const metadata: Metadata = pageMeta({
  path: "/",
  title: TITLE,
  description: DESCRIPTION,
  image: "/opengraph-image",
});

export default async function Home() {
  const games = await getLiveGames();
  return (
    <div className="prose">
      <JsonLd data={webPageLd({ path: "/", name: TITLE, description: DESCRIPTION, modified: UPDATED })} />
      {NOINDEX && (
        <p className="preview-banner" role="status">
          Preview site — not submitted to search engines and not intended for public indexing.
        </p>
      )}
      <h1>Official game redeem codes</h1>
      <QuickAnswer text="We list only verifiable official redeem codes, with newest game launches first. Codes circulating on unofficial sites are unverified and not listed." />
      <LastUpdated date={UPDATED} />
      <p className="lede">
        Recent Codes is an unofficial fan resource. Every code on this site has to be checked against a game&apos;s
        official channels. We do not list unverified codes, and we say so when a new game has no official codes yet.
      </p>
      <h2>Games</h2>
      {games.length === 0 ? (
        <p>No games listed yet.</p>
      ) : (
        <ul className="game-list">
          {games.map((g) => {
            const active = g.activeCodes.length;
            const status =
              active === 0
                ? PENDING_LABEL
                : `${active} official code${active === 1 ? "" : "s"}`;
            return (
              <li key={g.slug}>
                <Link href={`/codes/${g.slug}`} className="game-card">
                  <h2>{g.game}</h2>
                  <p>
                    {g.publisher}
                    {g.launchDate ? ` · Launched ${formatDate(g.launchDate)}` : ""}
                  </p>
                  <p className="game-meta">
                    <span className="status-pill">{status}</span>
                    <span>Last checked {formatDate(g.lastChecked, true)}</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
