# Recent Codes

Unofficial fan site that lists only verifiable official game redeem codes, with newest game launches first.

This deployment is a **preview**: `NEXT_PUBLIC_NOINDEX=true` adds a `noindex,nofollow` robots meta tag, an `X-Robots-Tag` header, and a `Disallow: /` robots.txt. Do not submit the preview to search engines. For the formal launch, set `NEXT_PUBLIC_NOINDEX=false` and point `NEXT_PUBLIC_SITE_URL` at the public origin, then redeploy.

Code data lives in `data/games/<slug>.json`. Pages under `/codes/<slug>` are generated from those files.

This site is not affiliated with any game publisher.

## Automated ingestion

Official sources only. Never third-party code sites.

| Game | Source | How | Schedule (Supabase pg_cron, UTC) |
| --- | --- | --- | --- |
| KOF: Legend | Official Discord `#🎁｜gift-code-drops` (guild 1532667046511513671, channel 1534809566112514158), followed into our server's `#code-feed` (1570768316987998348) | Discord REST `GET /channels/{id}/messages?after=` with the bot token | `*/5 * * * *` → `POST /api/ingest/discord` |
| Dawn's Wake | Steam app 4635160, developer announcements only (`ISteamNews/GetNewsForApp`, `feeds=steam_community_announcements`) | free public API | hourly, every 20 min 18:00–03:00 Beijing |
| Dawn's Wake | https://sword.neptunegamez.com/en | page text diff | same as above |
| Transformers: Eternal War | https://transformerseternalwar.com | page text diff | same as above |

Not polled: official X accounts (X has no free read API; we do not scrape), Facebook/Instagram/TikTok (no free API),
Discord announcement channels of Dawn's Wake / Transformers (cannot be followed). The Transformers game is not on Steam.

Pipeline (`lib/ingest/`): regex candidates → deterministic confidence score (`score.ts`, signals documented there) →
optional LLM cross-check (`llm.ts`, off unless `AI_GATEWAY_MODEL` is set) → decision.
Confidence ≥ 0.85 from an auto-publish official source (followed official Discord crosspost, Steam announcement) is
published to `rc_codes` with the official post link and time; everything else goes to `rc_review_queue`
(no public route, no anon access). Official-website matches always go to review.

Pages read `rc_codes` through the publishable key (RLS: SELECT only) with ISR (`revalidate = 300`) and on-demand
`revalidatePath` after a publish, so codes appear without a redeploy.

Secrets: Vercel env `DISCORD_BOT_TOKEN`, `RC_CRON_SECRET`, `RC_SUPABASE_FN_SECRET` (sensitive); Supabase Vault
`recentcodes_cron_secret`, `recentcodes_fn_secret`. Schema: `supabase/migrations/20261113_rc_ingestion.sql`.

Manual run: `npx tsx scripts/ingest-once.ts discord|official` with the same env.
Approve a reviewed code: insert it into `rc_codes` (SQL editor) and mark the queue row `approved`.
