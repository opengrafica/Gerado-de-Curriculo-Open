-- Admin sales delete + client traffic attribution

alter table public.users
  add column if not exists phone text,
  add column if not exists traffic_source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists landing_path text,
  add column if not exists first_seen_at timestamptz;

drop policy if exists "admins_delete_payments" on public.payments;
create policy "admins_delete_payments" on public.payments
  for delete using (public.is_admin());

-- Keep attribution from signup metadata when profile is created by trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id, email, full_name, affiliate_code, phone,
    traffic_source, utm_source, utm_medium, utm_campaign, utm_content, utm_term, landing_path, first_seen_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    nullif(new.raw_user_meta_data->>'phone', ''),
    coalesce(nullif(new.raw_user_meta_data->>'traffic_source', ''), 'direto'),
    nullif(new.raw_user_meta_data->>'utm_source', ''),
    nullif(new.raw_user_meta_data->>'utm_medium', ''),
    nullif(new.raw_user_meta_data->>'utm_campaign', ''),
    nullif(new.raw_user_meta_data->>'utm_content', ''),
    nullif(new.raw_user_meta_data->>'utm_term', ''),
    nullif(new.raw_user_meta_data->>'landing_path', ''),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name),
    traffic_source = coalesce(public.users.traffic_source, excluded.traffic_source),
    utm_source = coalesce(public.users.utm_source, excluded.utm_source),
    utm_medium = coalesce(public.users.utm_medium, excluded.utm_medium),
    utm_campaign = coalesce(public.users.utm_campaign, excluded.utm_campaign),
    utm_content = coalesce(public.users.utm_content, excluded.utm_content),
    utm_term = coalesce(public.users.utm_term, excluded.utm_term),
    landing_path = coalesce(public.users.landing_path, excluded.landing_path),
    first_seen_at = coalesce(public.users.first_seen_at, excluded.first_seen_at);
  return new;
end;
$$;
