import { PUBLISH_THRESHOLD } from "./config";
import { llmAdjust } from "./llm";
import { extractCandidates } from "./score";
import type { IngestPayload } from "./store";

export type SourceItem = {
  itemId: string;
  gameSlug: string;
  url: string | null; // public link to the official post
  postedAt: string | null;
  title: string | null;
  text: string;
  official: boolean;
  autoPublish: boolean; // false for noisy sources (official websites): matches always go to review
  sourceKind: string;
  sourceName: string;
};

/** Regex candidates -> heuristic score -> optional LLM cross-check -> publish / review decision. */
export async function processItems(items: SourceItem[]) {
  const outItems: NonNullable<IngestPayload["items"]> = [];
  const outCands: NonNullable<IngestPayload["candidates"]> = [];
  let llmStatus = "off";
  for (const it of items) {
    const full = [it.title, it.text].filter(Boolean).join("\n");
    let cands = extractCandidates(full, { official: it.official });
    const adj = await llmAdjust(full, cands);
    cands = adj.cands;
    if (adj.status !== "off") llmStatus = adj.status;
    outItems.push({
      item_id: it.itemId,
      game_slug: it.gameSlug,
      url: it.url,
      posted_at: it.postedAt,
      title: it.title,
      excerpt: full.slice(0, 2000),
      candidates: cands.length,
    });
    for (const c of cands) {
      const publish = it.official && it.autoPublish && it.url !== null && c.confidence >= PUBLISH_THRESHOLD;
      outCands.push({
        game_slug: it.gameSlug,
        code: c.code,
        confidence: c.confidence,
        decision: publish ? "publish" : "review",
        reasons: c.reasons,
        source_kind: it.sourceKind,
        source_name: it.sourceName,
        source_url: it.url || "",
        source_item_id: it.itemId,
        source_posted_at: it.postedAt,
        context: c.context,
        expires_at: c.expiresAt,
      });
    }
  }
  return { items: outItems, candidates: outCands, llmStatus };
}
