/**
 * Run one ingestion pass from a shell (manual check / backfill). Needs the same env as the deployment:
 * SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, RC_SUPABASE_FN_SECRET, and DISCORD_BOT_TOKEN for the Discord poll.
 * Usage: npx tsx scripts/ingest-once.ts discord|official
 * Prints only run summaries; never prints secrets.
 */
import { runDiscordPoll } from "../lib/ingest/discord";
import { runOfficialPoll } from "../lib/ingest/official";

const which = process.argv[2];
const run = which === "discord" ? runDiscordPoll() : which === "official" ? runOfficialPoll() : Promise.reject(new Error("usage: discord|official"));
run.then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
