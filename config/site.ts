const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recentcodes.vercel.app";

export const SITE_URL = rawUrl.replace(/\/$/, "");
export const SITE_NAME = "Recent Codes";
export const SITE_TAGLINE = "Verifiable official game redeem codes";

/** Preview mode: noindex the whole site until this env var is flipped to anything other than "true". */
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "true";

export const DISCLAIMER =
  "Recent Codes is an unofficial fan resource and is not affiliated with, endorsed by, or connected to any game publisher. All trademarks belong to their respective owners.";
