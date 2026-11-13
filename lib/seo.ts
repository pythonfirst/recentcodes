import type { Metadata } from "next";
import { NOINDEX, SITE_NAME, SITE_URL } from "@/config/site";

/** Per-page metadata: canonical, og:url, og/twitter title+description all consistent. */
export function pageMeta(opts: {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  image?: string;
}): Metadata {
  const { path, title, description, type = "website", absoluteTitle = true, image } = opts;
  const ogTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: NOINDEX ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      url: path,
      title: ogTitle,
      description,
      siteName: SITE_NAME,
      locale: "en_US",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export const abs = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

export const ORG = {
  "@type": "Organization",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icon`, width: 512, height: 512 },
};

export type Crumb = { name: string; path: string };

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

export function articleLd(opts: {
  path: string;
  headline: string;
  description: string;
  published?: string;
  modified?: string;
  image?: string;
  aboutName?: string;
}) {
  const url = abs(opts.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    image: [abs(opts.image || `${opts.path}/opengraph-image`)],
    ...(opts.published ? { datePublished: opts.published } : {}),
    ...(opts.modified || opts.published ? { dateModified: opts.modified || opts.published } : {}),
    author: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/` },
    publisher: ORG,
    ...(opts.aboutName ? { about: { "@type": "VideoGame", name: opts.aboutName } } : {}),
    inLanguage: "en",
  };
}

export function faqPageLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function howToLd(opts: { name: string; description: string; steps: { name: string; text: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    ...ORG,
    "@id": `${SITE_URL}/#organization`,
    description:
      "Unofficial fan site that lists only verifiable official game redeem codes. Not affiliated with any game publisher.",
  };
}

export function webPageLd(opts: {
  path: string;
  name: string;
  description: string;
  modified?: string;
  type?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  return {
    "@context": "https://schema.org",
    "@type": opts.type || "WebPage",
    "@id": abs(opts.path),
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(opts.modified ? { dateModified: opts.modified } : {}),
    inLanguage: "en",
  };
}
