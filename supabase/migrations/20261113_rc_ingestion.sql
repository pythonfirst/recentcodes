-- recentcodes: automated official-code ingestion.
-- RLS on every table. anon/authenticated get SELECT only on published data (rc_codes, rc_game_checks).
-- All writes go through SECURITY DEFINER functions guarded by the Vault secret 'recentcodes_fn_secret'.
-- rc_review_queue, rc_source_items, rc_poll_state, rc_runs have no policies: not readable by anon.

create table if not exists public.rc_codes (
  id bigint generated always as identity primary key,
  game_slug text not null check (game_slug ~ '^[a-z0-9-]{1,64}$'),
  code text not null check (length(code) between 3 and 40),
  reward text,
  expires_at timestamptz,
  confidence numeric(4,3) not null,
  source_kind text not null,
  source_name text not null,
  source_url text not null,
  source_item_id text not null,
  source_posted_at timestamptz not null,
  published_at timestamptz not null default now(),
  unique (game_slug, code)
);
alter table public.rc_codes enable row level security;
revoke all on public.rc_codes from anon, authenticated;
grant select on public.rc_codes to anon, authenticated;
drop policy if exists rc_codes_public_read on public.rc_codes;
create policy rc_codes_public_read on public.rc_codes for select to anon, authenticated using (true);

create table if not exists public.rc_game_checks (
  game_slug text primary key,
  last_checked_at timestamptz not null
);
alter table public.rc_game_checks enable row level security;
revoke all on public.rc_game_checks from anon, authenticated;
grant select on public.rc_game_checks to anon, authenticated;
drop policy if exists rc_game_checks_public_read on public.rc_game_checks;
create policy rc_game_checks_public_read on public.rc_game_checks for select to anon, authenticated using (true);

create table if not exists public.rc_review_queue (
  id bigint generated always as identity primary key,
  game_slug text not null,
  code text not null,
  confidence numeric(4,3) not null,
  reasons jsonb not null default '[]'::jsonb,
  source_kind text not null,
  source_name text not null,
  source_url text,
  source_item_id text not null,
  source_posted_at timestamptz,
  context text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (game_slug, code, source_item_id)
);
alter table public.rc_review_queue enable row level security;
revoke all on public.rc_review_queue from anon, authenticated;

create table if not exists public.rc_source_items (
  source_key text not null,
  item_id text not null,
  game_slug text not null,
  url text,
  posted_at timestamptz,
  title text,
  excerpt text,
  candidates int not null default 0,
  seen_at timestamptz not null default now(),
  primary key (source_key, item_id)
);
alter table public.rc_source_items enable row level security;
revoke all on public.rc_source_items from anon, authenticated;

create table if not exists public.rc_poll_state (
  source_key text primary key,
  cursor text,
  last_item_at timestamptz,
  last_run_at timestamptz,
  last_ok_at timestamptz,
  last_status text,
  last_error text
);
alter table public.rc_poll_state enable row level security;
revoke all on public.rc_poll_state from anon, authenticated;

create table if not exists public.rc_runs (
  id bigint generated always as identity primary key,
  kind text not null,
  source_key text,
  ran_at timestamptz not null default now(),
  status text,
  stats jsonb
);
alter table public.rc_runs enable row level security;
revoke all on public.rc_runs from anon, authenticated;

create or replace function public._rc_check_secret(p_secret text)
returns void language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select decrypted_secret into v from vault.decrypted_secrets where name = 'recentcodes_fn_secret' limit 1;
  if v is null or p_secret is null or p_secret <> v then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end; $$;
revoke all on function public._rc_check_secret(text) from public, anon, authenticated;

create or replace function public.rc_poll_state_get(p_secret text, p_source_key text)
returns json language plpgsql security definer set search_path = public as $$
declare r public.rc_poll_state;
begin
  perform public._rc_check_secret(p_secret);
  select * into r from public.rc_poll_state where source_key = p_source_key;
  return to_json(r);
end; $$;

-- One call per source per run. Payload:
-- {source_key, kind, status, error, cursor, last_item_at, games_checked:[slug],
--  items:[{item_id, game_slug, url, posted_at, title, excerpt, candidates}],
--  candidates:[{game_slug, code, confidence, decision:'publish'|'review', reasons, source_kind, source_name,
--               source_url, source_item_id, source_posted_at, context, expires_at}]}
create or replace function public.rc_ingest(p_secret text, p_payload jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_key text := p_payload->>'source_key';
  v_ok boolean := coalesce(p_payload->>'status','ok') = 'ok';
  c jsonb; i jsonb; g text;
  v_published jsonb := '[]'::jsonb; v_queued int := 0; v_new_items int := 0; n int;
begin
  perform public._rc_check_secret(p_secret);
  if v_key is null then raise exception 'source_key required'; end if;

  insert into public.rc_poll_state as s (source_key, cursor, last_item_at, last_run_at, last_ok_at, last_status, last_error)
  values (v_key, p_payload->>'cursor', (p_payload->>'last_item_at')::timestamptz, now(),
          case when v_ok then now() end, coalesce(p_payload->>'status','ok'), left(p_payload->>'error', 500))
  on conflict (source_key) do update set
    cursor = coalesce(excluded.cursor, s.cursor),
    last_item_at = greatest(coalesce(excluded.last_item_at, s.last_item_at), s.last_item_at),
    last_run_at = now(),
    last_ok_at = coalesce(excluded.last_ok_at, s.last_ok_at),
    last_status = excluded.last_status,
    last_error = excluded.last_error;

  if v_ok then
    for g in select jsonb_array_elements_text(coalesce(p_payload->'games_checked','[]'::jsonb)) loop
      insert into public.rc_game_checks (game_slug, last_checked_at) values (g, now())
      on conflict (game_slug) do update set last_checked_at = now();
    end loop;
  end if;

  for i in select * from jsonb_array_elements(coalesce(p_payload->'items','[]'::jsonb)) loop
    insert into public.rc_source_items (source_key, item_id, game_slug, url, posted_at, title, excerpt, candidates)
    values (v_key, i->>'item_id', i->>'game_slug', i->>'url', (i->>'posted_at')::timestamptz,
            left(i->>'title', 300), left(i->>'excerpt', 2000), coalesce((i->>'candidates')::int, 0))
    on conflict (source_key, item_id) do nothing;
    get diagnostics n = row_count; v_new_items := v_new_items + n;
  end loop;

  for c in select * from jsonb_array_elements(coalesce(p_payload->'candidates','[]'::jsonb)) loop
    if c->>'decision' = 'publish' then
      insert into public.rc_codes (game_slug, code, expires_at, confidence, source_kind, source_name, source_url,
                                   source_item_id, source_posted_at)
      values (c->>'game_slug', c->>'code', (c->>'expires_at')::timestamptz, (c->>'confidence')::numeric,
              c->>'source_kind', c->>'source_name', c->>'source_url', c->>'source_item_id',
              (c->>'source_posted_at')::timestamptz)
      on conflict (game_slug, code) do nothing;
      get diagnostics n = row_count;
      if n > 0 then v_published := v_published || jsonb_build_object('game_slug', c->>'game_slug', 'code', c->>'code'); end if;
    else
      if not exists (select 1 from public.rc_codes where game_slug = c->>'game_slug' and code = c->>'code') then
        insert into public.rc_review_queue (game_slug, code, confidence, reasons, source_kind, source_name, source_url,
                                            source_item_id, source_posted_at, context)
        values (c->>'game_slug', c->>'code', (c->>'confidence')::numeric, coalesce(c->'reasons','[]'::jsonb),
                c->>'source_kind', c->>'source_name', c->>'source_url', c->>'source_item_id',
                (c->>'source_posted_at')::timestamptz, left(c->>'context', 2000))
        on conflict (game_slug, code, source_item_id) do nothing;
        get diagnostics n = row_count; v_queued := v_queued + n;
      end if;
    end if;
  end loop;

  insert into public.rc_runs (kind, source_key, status, stats)
  values (coalesce(p_payload->>'kind','poll'), v_key, coalesce(p_payload->>'status','ok'),
          jsonb_build_object('new_items', v_new_items, 'published', jsonb_array_length(v_published), 'queued', v_queued,
                             'error', left(p_payload->>'error', 300)));
  delete from public.rc_runs where ran_at < now() - interval '30 days';

  return json_build_object('published', v_published, 'queued', v_queued, 'new_items', v_new_items);
end; $$;

revoke all on function public.rc_poll_state_get(text, text) from public;
revoke all on function public.rc_ingest(text, jsonb) from public;
grant execute on function public.rc_poll_state_get(text, text) to anon, authenticated;
grant execute on function public.rc_ingest(text, jsonb) to anon, authenticated;
