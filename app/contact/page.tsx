import type { Metadata } from "next";
import { DISCLAIMER } from "@/config/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactEmail from "@/components/ContactEmail";
import LastUpdated from "@/components/LastUpdated";
import QuickAnswer from "@/components/QuickAnswer";
import { JsonLd } from "@/components/JsonLd";
import { pageMeta, webPageLd } from "@/lib/seo";

const UPDATED = "2026-11-13";
const TITLE = "Contact Recent Codes";
const DESCRIPTION =
  "Contact Recent Codes to report a wrong or missing official code, ask about a business inquiry, or send a copyright or takedown request.";

export const metadata: Metadata = pageMeta({
  path: "/contact",
  title: TITLE,
  description: DESCRIPTION,
  image: "/opengraph-image",
});

export default function Contact() {
  return (
    <div className="prose">
      <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <JsonLd
        data={webPageLd({
          path: "/contact",
          name: TITLE,
          description: DESCRIPTION,
          modified: UPDATED,
          type: "ContactPage",
        })}
      />
      <h1>Contact</h1>
      <QuickAnswer text="Email us to report a wrong or missing official code, ask about a business inquiry, or send a copyright or takedown request. There is no contact form — one click opens your mail app." />
      <LastUpdated date={UPDATED} />
      <p>The best way to reach us is by email. Click the address below to open a message in your mail app:</p>
      <p>
        <ContactEmail />
      </p>
      <p>You can use this address to:</p>
      <ul>
        <li>Report a wrong, expired, or missing official redeem code</li>
        <li>Ask about a business or partnership inquiry</li>
        <li>Send a copyright or takedown request</li>
      </ul>
      <p>We read every message and will reply as soon as we can.</p>
      <h2>Disclaimer</h2>
      <p>{DISCLAIMER}</p>
    </div>
  );
}
