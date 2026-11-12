create table public.cloud_drafts (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  revision uuid not null,
  snapshot jsonb not null check (
    (jsonb_typeof(snapshot) = 'object'
      and snapshot -> 'version' = '1'::jsonb
      and jsonb_typeof(snapshot -> 'portfolios') = 'array'
      and jsonb_typeof(snapshot -> 'assets') = 'array'
      and jsonb_typeof(snapshot -> 'activePortfolioId') = 'string') is true
  )
);

alter table public.cloud_drafts enable row level security;
revoke all on table public.cloud_drafts from public, anon, authenticated, service_role;
grant select, insert, update on table public.cloud_drafts to authenticated;

create policy "Owners can read cloud drafts"
  on public.cloud_drafts for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners can create cloud drafts"
  on public.cloud_drafts for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update cloud drafts"
  on public.cloud_drafts for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
