-- Review only. Do not apply from the AliaSpaces mobile client or CI.
-- Content reports are distinct from report_client_error telemetry.

begin;

create table if not exists public.aliaspaces_content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_account_id uuid not null,
  target_type text not null check (target_type in ('post', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'impersonation', 'illegal', 'other')),
  notes text,
  status text not null default 'open' check (status in ('open', 'needs_review', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.aliaspaces_content_reports enable row level security;

drop policy if exists aliaspaces_content_reports_reporter_insert on public.aliaspaces_content_reports;
create policy aliaspaces_content_reports_reporter_insert
  on public.aliaspaces_content_reports
  for insert
  to authenticated
  with check (reporter_account_id = auth.uid());

drop policy if exists aliaspaces_content_reports_reporter_select on public.aliaspaces_content_reports;
create policy aliaspaces_content_reports_reporter_select
  on public.aliaspaces_content_reports
  for select
  to authenticated
  using (reporter_account_id = auth.uid());

-- Staff queue reads belong on a separate authorized role, not the reporter
-- and not the reported party. Do not grant update/delete to authenticated.

create or replace function public.report_aliaspaces_content(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  report_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unsigned';
  end if;
  insert into public.aliaspaces_content_reports (
    reporter_account_id, target_type, target_id, reason, notes
  ) values (
    auth.uid(), p_target_type, p_target_id, p_reason, coalesce(p_notes, '')
  ) returning id into report_id;
  return report_id;
end;
$$;

revoke all on function public.report_aliaspaces_content(text, uuid, text, text) from public;
grant execute on function public.report_aliaspaces_content(text, uuid, text, text) to authenticated;

comment on function public.report_aliaspaces_content(text, uuid, text, text) is
  'AliaSpaces content report. Creates an open staff-visible row. Not error telemetry.';

commit;
