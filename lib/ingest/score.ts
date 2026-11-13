/**
 * Deterministic code-candidate extraction and confidence scoring.
 *
 * Confidence is a sum of documented signals, capped to [0, 1]:
 *   +0.45  source is an official channel (followed official Discord crosspost, official Steam announcements)
 *   +0.10  source is not verified official (e.g. a normal message typed in #code-feed)
 *   +0.30  a redeem-code marker ("code", "redeem", "gift code", "兌換碼", "兑换码", "序號", ...) sits right before the token
 *   +0.10  the post as a whole talks about codes / redeeming
 *   +0.10  the token is set apart: `backticks`, **bold**, or alone on its line / after a colon
 *   +0.10  the token mixes letters and digits; +0.05 if it is 6+ capital letters
 * Hard rejects: tokens with no code context at all (no marker, no digits, post never mentions codes), stop-words, dates/times, version numbers, URLs, mentions, tokens shorter than 4 or longer than 24.
 * A candidate auto-publishes only when confidence >= PUBLISH_THRESHOLD (0.85) AND the source allows auto-publish.
 * In practice that means: an official post that literally says "code: XXXX". Everything else goes to review.
 */

export type Candidate = { code: string; confidence: number; reasons: string[]; context: string; expiresAt: string | null };

const MARKER = /(gift\s*codes?|redeem(?:ption)?\s*codes?|redeem|coupon\s*codes?|promo\s*codes?|codes?|cd-?keys?|cdk|兌換碼|兑换码|禮包碼|礼包码|序號|序号|激活碼|激活码|兌換|兑换|코드|쿠폰)/i;
const MARKER_BEFORE = new RegExp(MARKER.source + "[^\\n]{0,24}$", "i");
const STOP = new Set(
  (
    "CODE CODES GIFT GIFTS REDEEM FREE EVENT EVENTS NEW NOTICE UPDATE UPDATES PATCH NOTES SERVER SERVERS MAINTENANCE " +
    "GLOBAL LEGEND LEGENDS KOF SNK DISCORD STEAM ANDROID IOS APPLE GOOGLE PLAY STORE HTTPS HTTP WWW COM UTC GMT PST PDT " +
    "EST EDT CEST CET SGT JST KST HKT PHT ICT WIB LIVE TODAY HERE WITH FROM THIS THAT YOUR WILL HAVE THANK THANKS " +
    "EVERYONE HELLO DEAR PLAYERS PLAYER REWARD REWARDS ITEM ITEMS LIMITED TIME EXPIRE EXPIRES EXPIRED VALID UNTIL DATE " +
    "COMMUNITY ANNOUNCEMENT ANNOUNCEMENTS OFFICIAL GAME GAMES MOBILE VERSION RELEASE LAUNCH PRE-REGISTER PREREGISTER " +
    "TRANSFORMERS ETERNAL WAR DAWN WAKE AUTOBOTS DECEPTICONS OPTIMUS PRIME MEGATRON FAQ NOTE IMPORTANT NOW DOWNLOAD FOLLOW MAIN BOTS FEATURES NEWS HOME MENU LOGIN SIGN"
  ).split(/\s+/),
);

function cleanText(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<a?:\w+:\d+>/g, " ") // custom emoji
    .replace(/<[@#][!&]?\d+>/g, " ") // mentions
    .replace(/\[\/?[a-z0-9*]+(=[^\]]*)?\]/gi, " ") // BBCode (Steam)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;/g, " ")
    .replace(/[ \t]+/g, " ");
}

const EXPIRY = /(?:valid\s+(?:until|through|till)|expires?(?:\s+on)?|until|有效期(?:至|到)?|截止(?:日期)?|至)\s*[:：]?\s*(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/i;

export function extractCandidates(raw: string, opts: { official: boolean }): Candidate[] {
  const text = cleanText(raw);
  const postHasKeyword = MARKER.test(text);
  const out = new Map<string, Candidate>();
  const tokenRe = /[A-Za-z0-9][A-Za-z0-9-]{2,22}[A-Za-z0-9]/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(text))) {
    const tok = m[0];
    const start = m.index;
    const end = start + tok.length;
    const prevCh = text[start - 1] || " ";
    const nextCh = text[end] || " ";
    if (/[A-Za-z0-9_\-/.@#]/.test(prevCh) || /[A-Za-z0-9_\-/@]/.test(nextCh)) continue;
    if (nextCh === "." && /[A-Za-z0-9]/.test(text[end + 1] || "")) continue; // domain / version
    if (!/[A-Za-z]/.test(tok)) continue; // pure numbers
    if (tok !== tok.toUpperCase()) continue; // official codes are upper-case; mixed/lower words are prose
    if (STOP.has(tok.toUpperCase())) continue;
    if (/^\d{1,2}(AM|PM)$/.test(tok) || /^V?\d+(-\d+)+$/.test(tok) || /^\d+(ST|ND|RD|TH|K|M|X|PCS)$/.test(tok)) continue;
    if (/^(?:[A-Z]+-)+[A-Z]+$/.test(tok) && !/\d/.test(tok)) continue; // HYPHENATED-WORDS
    if (tok.length < 4) continue;

    const reasons: string[] = [];
    let s = 0;
    if (opts.official) {
      s += 0.45;
      reasons.push("official_source");
    } else {
      s += 0.1;
      reasons.push("unverified_source");
    }
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const before = text.slice(lineStart, start).replace(/[`*_~|>]/g, "");
    if (MARKER_BEFORE.test(before)) {
      s += 0.3;
      reasons.push("marker_before");
    }
    if (postHasKeyword) {
      s += 0.1;
      reasons.push("post_mentions_codes");
    }
    const lineEndIdx = text.indexOf("\n", end);
    const after = text.slice(end, lineEndIdx === -1 ? undefined : lineEndIdx);
    const isolated =
      prevCh === "`" ||
      (text.slice(start - 2, start) === "**" && text.slice(end, end + 2) === "**") ||
      (/^[\s*`\-•:：]*$/.test(before) && /^[\s*`]*$/.test(after)) ||
      /[:：]\s*[*`]*$/.test(before);
    if (isolated) {
      s += 0.1;
      reasons.push("set_apart");
    }
    if (/\d/.test(tok) && /[A-Z]/.test(tok)) {
      s += 0.1;
      reasons.push("mixed_alnum");
    } else if (/^[A-Z]{6,}$/.test(tok)) {
      s += 0.05;
      reasons.push("long_caps");
    }
    // Minimum evidence: plain capitalised words (menus, headings) without any code context are dropped outright.
    if (!reasons.includes("marker_before") && !reasons.includes("mixed_alnum") && !postHasKeyword) continue;
    const conf = Math.min(1, Math.round(s * 1000) / 1000);
    const ctxStart = Math.max(0, start - 160);
    const context = text.slice(ctxStart, Math.min(text.length, end + 160)).trim();
    const exp = EXPIRY.exec(text.slice(start, Math.min(text.length, end + 200)));
    const expiresAt = exp ? `${exp[1]}-${exp[2].padStart(2, "0")}-${exp[3].padStart(2, "0")}T12:00:00Z` : null;
    const prev = out.get(tok);
    if (!prev || prev.confidence < conf) out.set(tok, { code: tok, confidence: conf, reasons, context, expiresAt });
  }
  // A post that yields many candidates is probably prose in caps, not a code drop: damp it.
  const list = [...out.values()];
  if (list.length > 8) for (const c of list) { c.confidence = Math.round(c.confidence * 0.7 * 1000) / 1000; c.reasons.push("many_tokens_damped"); }
  return list;
}
