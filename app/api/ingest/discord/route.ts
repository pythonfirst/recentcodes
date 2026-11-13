import { revalidatePath } from "next/cache";
import { authorized } from "@/lib/ingest/auth";
import { runDiscordPoll } from "@/lib/ingest/discord";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const r = await runDiscordPoll();
    if ("published" in r && r.published.length) {
      for (const slug of new Set(r.published.map((p) => p.game_slug))) revalidatePath(`/codes/${slug}`);
      revalidatePath("/");
    }
    return Response.json(r, { status: r.status === "ok" ? 200 : 503 });
  } catch (e) {
    return Response.json({ status: "error", error: String((e as Error).message) }, { status: 500 });
  }
}
