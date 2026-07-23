-- Client history + admin pricing policies

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins_update_settings" on public.app_settings;
create policy "admins_update_settings" on public.app_settings
  for update using (public.is_admin());

drop policy if exists "admins_insert_settings" on public.app_settings;
create policy "admins_insert_settings" on public.app_settings
  for insert with check (public.is_admin());

-- Disable affiliate program by default (product no longer uses affiliates)
update public.app_settings
set value = jsonb_set(coalesce(value, '{}'::jsonb), '{enabled}', 'false'::jsonb),
    updated_at = now()
where key = 'affiliate';
