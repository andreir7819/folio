-- Folio's initial hosted data model.
-- Run this in a new Supabase project's SQL Editor before connecting the app.
-- This script is intentionally local-first friendly: no existing browser data is
-- touched until the application adds an explicit migration flow.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  public_id uuid not null default gen_random_uuid() unique,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  color text not null default '#b8a1ff',
  show_portfolio_name boolean not null default true,
  home_page_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  layout text not null check (layout in ('canvas', 'scroll')),
  show_header boolean not null default true,
  show_in_nav boolean not null default true,
  transition text not null default 'fade' check (transition in ('fade', 'slide', 'lift')),
  background jsonb not null default '{}'::jsonb,
  canvas_height integer check (canvas_height between 700 and 2400),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_id, slug)
);

alter table public.portfolios
  drop constraint if exists portfolios_home_page_id_fkey;

alter table public.portfolios
  add constraint portfolios_home_page_id_fkey
  foreign key (home_page_id) references public.pages(id) on delete set null;

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null check (type in ('text', 'richtext', 'image', 'button', 'project', 'gallery', 'project-grid', 'links', 'quote', 'shape', 'audio', 'video', 'emitter')),
  properties jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 180),
  kind text not null check (kind in ('image', 'font')),
  mime_type text not null,
  size_bytes integer not null check (
    (kind = 'image' and size_bytes between 1 and 10485760)
    or (kind = 'font' and size_bytes between 1 and 5242880)
  ),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists portfolios_owner_id_idx on public.portfolios(owner_id);
create index if not exists portfolios_public_id_idx on public.portfolios(public_id);
create index if not exists pages_portfolio_id_idx on public.pages(portfolio_id, sort_order);
create index if not exists blocks_page_id_idx on public.blocks(page_id, sort_order);
create index if not exists assets_owner_id_idx on public.assets(owner_id, created_at desc);

-- Keep account display names in sync without storing credentials outside Auth.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Folio creator')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

-- RLS is the actual boundary. The browser receives only a publishable key.
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.pages enable row level security;
alter table public.blocks enable row level security;
alter table public.assets enable row level security;

create policy "Profiles are visible to their owner"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Profiles can be updated by their owner"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Portfolios are private until published"
  on public.portfolios for select
  using (owner_id = auth.uid() or published_at is not null);

create policy "Owners can create portfolios"
  on public.portfolios for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update portfolios"
  on public.portfolios for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Owners can delete portfolios"
  on public.portfolios for delete to authenticated
  using (owner_id = auth.uid());

create policy "Pages inherit portfolio visibility"
  on public.pages for select
  using (exists (
    select 1 from public.portfolios
    where portfolios.id = pages.portfolio_id
      and (portfolios.owner_id = auth.uid() or portfolios.published_at is not null)
  ));

create policy "Owners can create pages"
  on public.pages for insert to authenticated
  with check (exists (
    select 1 from public.portfolios
    where portfolios.id = pages.portfolio_id and portfolios.owner_id = auth.uid()
  ));

create policy "Owners can update pages"
  on public.pages for update to authenticated
  using (exists (
    select 1 from public.portfolios
    where portfolios.id = pages.portfolio_id and portfolios.owner_id = auth.uid()
  ));

create policy "Owners can delete pages"
  on public.pages for delete to authenticated
  using (exists (
    select 1 from public.portfolios
    where portfolios.id = pages.portfolio_id and portfolios.owner_id = auth.uid()
  ));

create policy "Blocks inherit page visibility"
  on public.blocks for select
  using (exists (
    select 1 from public.pages
    join public.portfolios on portfolios.id = pages.portfolio_id
    where pages.id = blocks.page_id
      and (portfolios.owner_id = auth.uid() or portfolios.published_at is not null)
  ));

create policy "Owners can create blocks"
  on public.blocks for insert to authenticated
  with check (exists (
    select 1 from public.pages
    join public.portfolios on portfolios.id = pages.portfolio_id
    where pages.id = blocks.page_id and portfolios.owner_id = auth.uid()
  ));

create policy "Owners can update blocks"
  on public.blocks for update to authenticated
  using (exists (
    select 1 from public.pages
    join public.portfolios on portfolios.id = pages.portfolio_id
    where pages.id = blocks.page_id and portfolios.owner_id = auth.uid()
  ));

create policy "Owners can delete blocks"
  on public.blocks for delete to authenticated
  using (exists (
    select 1 from public.pages
    join public.portfolios on portfolios.id = pages.portfolio_id
    where pages.id = blocks.page_id and portfolios.owner_id = auth.uid()
  ));

create policy "Assets are visible only to their owner"
  on public.assets for select to authenticated
  using (owner_id = auth.uid());

create policy "Owners can create assets"
  on public.assets for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can delete assets"
  on public.assets for delete to authenticated
  using (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'folio-assets',
  'folio-assets',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
    'font/woff2', 'font/woff', 'font/ttf', 'font/otf', 'application/font-sfnt', 'application/x-font-ttf'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can read their own Folio files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'folio-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can upload their own Folio files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'folio-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can update their own Folio files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'folio-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their own Folio files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'folio-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
