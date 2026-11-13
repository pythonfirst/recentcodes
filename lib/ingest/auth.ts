import { timingSafeEqual } from "node:crypto";

/** Bearer check for the scheduler (Supabase pg_cron + pg_net). */
export function authorized(req: Request) {
  const secret = process.env.RC_CRON_SECRET;
  if (!secret) return false;
  const got = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
