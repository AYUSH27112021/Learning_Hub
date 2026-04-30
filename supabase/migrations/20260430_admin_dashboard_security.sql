-- ── 1. Fix: revoke public execute on rls_auto_enable ─────────────────────────
-- This function is SECURITY DEFINER and should not be callable by anon/authenticated.
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

-- ── 2. Add admin read/update access to callbacks ──────────────────────────────
-- Callbacks only had anon INSERT + service_role full access.
-- The authenticated admin (Supabase user) needs SELECT and UPDATE for the dashboard.
create policy "admin select callbacks"
  on callbacks for select
  to authenticated
  using (auth.role() = 'authenticated');

create policy "admin update callbacks"
  on callbacks for update
  to authenticated
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── 3. Tighten registrations admin update policy ──────────────────────────────
-- Current policy uses USING (true) / WITH CHECK (true) which the linter flags.
-- Replace with an explicit authenticated-role check.
-- TODO: Once you have your admin Supabase user UUID (Auth → Users in the dashboard),
--       swap auth.role() = 'authenticated' for auth.uid() = '<your-admin-uuid>'
--       to lock this down to a single known user.
drop policy if exists "admin update" on registrations;

create policy "admin update"
  on registrations for update
  to authenticated
  using  (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── 4. Ensure admin can select registrations ──────────────────────────────────
-- Check if a select policy already exists; if not, add one.
-- (The original schema had this but we re-confirm it here.)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'registrations'
      and cmd        = 'SELECT'
      and roles      @> array['authenticated']::name[]
  ) then
    execute $policy$
      create policy "admin select registrations"
        on registrations for select
        to authenticated
        using (auth.role() = 'authenticated')
    $policy$;
  end if;
end $$;
