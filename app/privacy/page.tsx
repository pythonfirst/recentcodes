import type { Metadata } from "next";
import { DISCLAIMER } from "@/config/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactEmail from "@/components/ContactEmail";
import LastUpdated from "@/components/LastUpdated";
import QuickAnswer from "@/components/QuickAnswer";
import { JsonLd } from "@/components/JsonLd";
import { pageMeta, webPageLd } from "@/lib/seo";

const UPDATED = "2026-11-13";
const TITLE = "Privacy Policy";
const DESCRIPTION =
  "Privacy policy for Recent Codes: what data we collect, how contact email is used, and hosting logs.";

export const metadata: Metadata = pageMeta({
  path: "/privacy",
  title: TITLE,
  description: DESCRIPTION,
  absoluteTitle: false,
  image: "/opengraph-image",
});

export default function Privacy() {
  return (
    <div className="prose">
      <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy" }]} />
      <JsonLd
        data={webPageLd({
          path: "/privacy",
          name: TITLE,
          description: DESCRIPTION,
          modified: UPDATED,
        })}
      />
      <h1>Privacy Policy</h1>
      <QuickAnswer text="Recent Codes does not use tracking cookies or analytics today. If you email us, we use your address only to reply. Our host may keep standard request logs for security and reliability." />
      <LastUpdated date={UPDATED} />
      <p>This policy explains how Recent Codes (&quot;we&quot;, &quot;the site&quot;) handles information when you visit.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Contact email:</strong> If you email us, we receive whatever you send (your address, the message, and
          any attachments) and use it only to reply. We do not add you to a mailing list.
        </li>
        <li>
          <strong>Server logs:</strong> Our hosting provider (Vercel) may process standard request logs for security
          and reliability.
        </li>
      </ul>
      <h2>Cookies and analytics</h2>
      <p>The site does not set tracking cookies and does not use an analytics product at this time.</p>
      <h2>Your choices</h2>
      <p>
        Contact us at <ContactEmail /> to request deletion of any data related to you.
      </p>
      <h2>Children</h2>
      <p>The site is not directed at children under 13 and we do not knowingly collect their personal information.</p>
      <h2>Disclaimer</h2>
      <p>{DISCLAIMER}</p>
    </div>
  );
}
