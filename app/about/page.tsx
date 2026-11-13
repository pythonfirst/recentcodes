import type { Metadata } from "next";
import Link from "next/link";
import { DISCLAIMER } from "@/config/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import LastUpdated from "@/components/LastUpdated";
import QuickAnswer from "@/components/QuickAnswer";
import { JsonLd } from "@/components/JsonLd";
import { pageMeta, webPageLd } from "@/lib/seo";

const UPDATED = "2026-11-13";
const TITLE = "About Recent Codes – Unofficial Fan Resource";
const DESCRIPTION =
  "Recent Codes is an unofficial fan resource that lists only verifiable official game redeem codes. It is not affiliated with any game publisher.";

export const metadata: Metadata = pageMeta({
  path: "/about",
  title: TITLE,
  description: DESCRIPTION,
  image: "/opengraph-image",
});

export default function About() {
  return (
    <div className="prose">
      <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <JsonLd
        data={webPageLd({
          path: "/about",
          name: TITLE,
          description: DESCRIPTION,
          modified: UPDATED,
          type: "AboutPage",
        })}
      />
      <h1>About Recent Codes</h1>
      <QuickAnswer text="Recent Codes is an unofficial fan resource. We list only verifiable official game redeem codes, with newest launches first. We are not affiliated with, endorsed by, or connected to any game publisher." />
      <LastUpdated date={UPDATED} />
      <p>
        Recent Codes exists so players can find redeem codes that have actually been published by a game&apos;s official
        channels — the official website and official social accounts — rather than copies circulating on unofficial
        sites. Codes circulating on unofficial sites are unverified and not listed.
      </p>
      <h2>What we list</h2>
      <ul>
        <li>
          Active and expired official codes for each game, on a clean URL at{" "}
          <code>/codes/&lt;game-slug&gt;</code>.
        </li>
        <li>When we last checked official channels, shown on every codes page.</li>
        <li>Honest empty states: if a newly launched game has no official codes yet, we say so.</li>
        <li>Links to each game&apos;s official website and official social accounts.</li>
      </ul>
      <p>
        See the current list on the <Link href="/">home page</Link>.
      </p>
      <h2>Disclaimer</h2>
      <p>{DISCLAIMER}</p>
    </div>
  );
}
