-- The auth.users trigger continues to run as its definer.
revoke execute on function public.create_profile_for_new_user()
  from public, anon, authenticated, service_role;

-- These legacy tables have no API CRUD grants. Remove unused privileges
-- outside row-level security without granting API access or changing policies.
revoke truncate, references, trigger, maintain
  on table public.profiles, public.portfolios, public.pages, public.blocks, public.assets
  from public, anon, authenticated, service_role;
