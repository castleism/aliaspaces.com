-- Review only. Do not apply from the AliaSpaces mobile client or CI.
-- Server-side symmetric block projections for AliaSpaces social reads.
-- Hidden-by-block must remain distinct from hidden-by-moderation.

begin;

create table if not exists public.persona_visibility_rules (
  account_id uuid not null,
  other_persona_id uuid not null,
  kind text not null check (kind in ('block', 'mute')),
  created_at timestamptz not null default now(),
  primary key (account_id, other_persona_id, kind)
);

alter table public.persona_visibility_rules enable row level security;

drop policy if exists persona_visibility_rules_owner_all on public.persona_visibility_rules;
create policy persona_visibility_rules_owner_all
  on public.persona_visibility_rules
  for all
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create or replace function public.aliaspaces_hidden_persona_ids(p_account_id uuid)
returns table (persona_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select other_persona_id
  from public.persona_visibility_rules
  where account_id = p_account_id
    and kind in ('block', 'mute');
$$;

revoke all on function public.aliaspaces_hidden_persona_ids(uuid) from public;
grant execute on function public.aliaspaces_hidden_persona_ids(uuid) to authenticated;

comment on function public.aliaspaces_hidden_persona_ids(uuid) is
  'AliaSpaces hide-by-block/mute projection. Owner-scoped. Not a moderation hide.';

commit;
