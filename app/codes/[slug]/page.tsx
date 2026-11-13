import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CodeTable from "@/components/CodeTable";
import { FaqList } from "@/components/JsonLd";
import LastChecked from "@/components/LastChecked";
import QuickAnswer from "@/components/QuickAnswer";
import { JsonLd } from "@/components/JsonLd";
import { articleLd, faqPageLd, howToLd, pageMeta } from "@/lib/seo";
import { dateOnly, formatDate, getAllGames, getGame } from "@/lib/games";

type Params = { slug: string };

export function generateStaticParams() {
  return getAllGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};
  const title = `${game.game} Redeem Codes (Official)`;
  const description =
    game.description ||
    `Official ${game.game} redeem codes. We list only verifiable official codes from ${game.publisher}.`;
  return pageMeta({
    path: `/codes/${game.slug}`,
    title,
    description,
    type: "article",
    image: `/codes/${game.slug}/opengraph-image`,
  });
}

export default async function GameCodesPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const path = `/codes/${game.slug}`;
  const title = `${game.game} Redeem Codes (Official)`;
  const description =
    game.description ||
    `Official ${game.game} redeem codes. We list only verifiable official codes from ${game.publisher}.`;
  const published = game.datePublished || game.launchDate;
  const modified = dateOnly(game.lastChecked);
  const noOfficial = game.activeCodes.length === 0;
  const quick = noOfficial
    ? `There are no official ${game.game} redeem codes yet. The game launched on ${formatDate(game.launchDate)} and is published by ${game.publisher}. Codes circulating on unofficial sites are unverified and not listed.`
    : `${game.game} official redeem codes, verified against official channels. Last checked ${formatDate(game.lastChecked, true)}.`;
  const faq = game.faq || [];
  const steps = game.redeemSteps || [];
  const emptyActive = `There are no official ${game.game} redeem codes yet. We will list them here when they are published on official channels.`;
  const emptyExpired = `No expired official codes. Official codes have not been published yet.`;

  return (
    <div className="prose">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: game.game, path },
        ]}
      />
      <JsonLd
        data={articleLd({
          path,
          headline: title,
          description,
          published,
          modified,
          image: `${path}/opengraph-image`,
          aboutName: game.game,
        })}
      />
      {faq.length > 0 && <JsonLd data={faqPageLd(faq)} />}
      {steps.length > 0 && (
        <JsonLd
          data={howToLd({
            name: `How to redeem ${game.game} codes`,
            description: game.redeemNote || `How to redeem official ${game.game} codes.`,
            steps,
          })}
        />
      )}
      <h1>{game.game} redeem codes</h1>
      <QuickAnswer text={quick} />
      <LastChecked iso={game.lastChecked} />
      <p>
        {game.game} launched on {formatDate(game.launchDate)} and is published by {game.publisher}. This page lists
        only verifiable official redeem codes. Codes circulating on unofficial sites are unverified and not listed.
      </p>

      <h2 id="active-codes">Active codes</h2>
      <CodeTable codes={game.activeCodes} empty={emptyActive} />

      <h2 id="expired-codes">Expired codes</h2>
      <CodeTable codes={game.expiredCodes} empty={emptyExpired} />

      <h2 id="how-to-redeem">How to redeem</h2>
      {game.redeemNote && <p>{game.redeemNote}</p>}
      {steps.length > 0 && (
        <ol className="step-list">
          {steps.map((s) => (
            <li key={s.name}>
              <strong>{s.name}.</strong> {s.text}
            </li>
          ))}
        </ol>
      )}

      <FaqList faq={faq} />

      <h2 id="sources">Sources</h2>
      <p>We check these official channels when updating this page:</p>
      <ul className="channel-list">
        {(game.sources.length ? game.sources : game.officialChannels).map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener noreferrer">
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
