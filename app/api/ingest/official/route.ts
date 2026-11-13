import { revalidatePath } from "next/cache";
import { authorized } from "@/lib/ingest/auth";
import { runOfficialPoll } from "@/lib/ingest/official";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const results = await runOfficialPoll();
    const slugs = new Set<string>();
    for (const r of results) for (const p of (r.published as Array<{ game_slug: string }>) || []) slugs.add(p.game_slug);
    for (const slug of slugs) revalidatePath(`/codes/${slug}`);
    if (slugs.size) revalidatePath("/");
    return Response.json({ results });
  } catch (e) {
    return Response.json({ status: "error", error: String((e as Error).message) }, { status: 500 });
  }
}
