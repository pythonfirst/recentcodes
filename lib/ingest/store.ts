/** Server-only writes to Supabase through SECURITY DEFINER RPCs guarded by RC_SUPABASE_FN_SECRET. */
export type IngestPayload = {
  source_key: string;
  kind: string;
  status: "ok" | "error" | "not_configured";
  error?: string;
  cursor?: string | null;
  last_item_at?: string | null;
  games_checked?: string[];
  items?: Array<{ item_id: string; game_slug: string; url: string | null; posted_at: string | null; title?: string | null; excerpt?: string | null; candidates: number }>;
  candidates?: Array<{
    game_slug: string;
    code: string;
    confidence: number;
    decision: "publish" | "review";
    reasons: string[];
    source_kind: string;
    source_name: string;
    source_url: string;
    source_item_id: string;
    source_posted_at: string | null;
    context: string;
    expires_at: string | null;
  }>;
};

export type IngestResult = { published: Array<{ game_slug: string; code: string }>; queued: number; new_items: number };

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.RC_SUPABASE_FN_SECRET;
  if (!url || !key || !secret) throw new Error("Supabase ingestion env not configured");
  return { url, key, secret };
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { url, key, secret } = env();
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_secret: secret, ...args }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${fn} ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export type PollState = { source_key: string; cursor: string | null; last_item_at: string | null } | null;
export const getPollState = (sourceKey: string) => rpc<PollState>("rc_poll_state_get", { p_source_key: sourceKey });
export const ingest = (payload: IngestPayload) => rpc<IngestResult>("rc_ingest", { p_payload: payload });
