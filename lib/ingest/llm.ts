/**
 * Optional LLM cross-check through Vercel AI Gateway. OFF by default.
 * It runs only when AI_GATEWAY_MODEL is set (pick a free-tier model) and the deployment can authenticate to the
 * gateway (Vercel OIDC on Vercel, or AI_GATEWAY_API_KEY elsewhere). Any failure falls back to the heuristic score.
 * The LLM can only lower or raise confidence of tokens that literally appear in the post; it can never add codes.
 */
import type { Candidate } from "./score";

export function llmEnabled() {
  return Boolean(process.env.AI_GATEWAY_MODEL);
}

async function gatewayToken(): Promise<string | null> {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    const { getVercelOidcToken } = await import("@vercel/oidc");
    return await getVercelOidcToken();
  } catch {
    return null;
  }
}

export async function llmAdjust(text: string, cands: Candidate[]): Promise<{ cands: Candidate[]; status: string }> {
  if (!llmEnabled() || cands.length === 0) return { cands, status: "off" };
  const token = await gatewayToken();
  if (!token) return { cands, status: "no_auth" };
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_GATEWAY_MODEL,
        temperature: 0,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              'You check game announcement posts. For each candidate token, say whether the post presents it as an in-game redeem/gift code. Reply with JSON only: {"results":[{"code":"...","is_code":true,"confidence":0.0}]}',
          },
          { role: "user", content: `Post:\n${text.slice(0, 4000)}\n\nCandidates: ${cands.map((c) => c.code).join(", ")}` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { cands, status: `http_${res.status}` };
    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    const json = JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1));
    const byCode = new Map<string, { is_code: boolean; confidence: number }>();
    for (const r of json.results || []) byCode.set(String(r.code), r);
    const out = cands.map((c) => {
      const r = byCode.get(c.code);
      if (!r) return c;
      const llm = r.is_code ? Math.max(0, Math.min(1, Number(r.confidence) || 0)) : 0;
      return { ...c, confidence: Math.round((0.6 * c.confidence + 0.4 * llm) * 1000) / 1000, reasons: [...c.reasons, `llm:${llm}`] };
    });
    return { cands: out, status: "ok" };
  } catch (e) {
    return { cands, status: "error" };
  }
}
