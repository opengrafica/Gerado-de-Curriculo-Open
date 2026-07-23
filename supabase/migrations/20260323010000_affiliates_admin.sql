-- Affiliates + admin management extensions
alter table public.users add column if not exists commission_percent numeric(5,2) not null default 30;
alter table public.users add column if not exists pix_key text;
alter table public.users add column if not exists total_earned numeric(12,2) not null default 0;
alter table public.users add column if not exists total_paid numeric(12,2) not null default 0;

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid references public.users(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  referred_email text,
  sale_amount numeric(10,2) not null,
  commission_percent numeric(5,2) not null default 30,
  commission_amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('affiliate', '{"commission_percent": 30, "min_payout": 20, "enabled": true}'::jsonb),
  ('pricing', '{"resume": 4.9, "cover_letter": 4.9, "linkedin": 9.9, "complete_pack": 19.9}'::jsonb),
  ('mercadopago', '{"enabled": true, "currency": "BRL"}'::jsonb)
on conflict (key) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.users where id = auth.uid()), false);
$$;

alter table public.affiliate_commissions enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "affiliates_select_own" on public.affiliate_commissions;
create policy "affiliates_select_own" on public.affiliate_commissions
  for select using (auth.uid() = affiliate_user_id);

drop policy if exists "admins_select_commissions" on public.affiliate_commissions;
create policy "admins_select_commissions" on public.affiliate_commissions
  for select using (auth.uid() = affiliate_user_id or public.is_admin());

drop policy if exists "admins_update_commissions" on public.affiliate_commissions;
create policy "admins_update_commissions" on public.affiliate_commissions
  for update using (public.is_admin());

drop policy if exists "settings_public_read" on public.app_settings;
create policy "settings_public_read" on public.app_settings for select using (true);

drop policy if exists "admins_select_users" on public.users;
create policy "admins_select_users" on public.users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "admins_select_payments" on public.payments;
create policy "admins_select_payments" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "admins_select_resumes" on public.resumes;
create policy "admins_select_resumes" on public.resumes
  for select using (auth.uid() = user_id or public.is_admin());

create or replace function public.register_affiliate_commission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affiliate record;
  percent numeric(5,2);
  commission numeric(10,2);
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') and new.affiliate_code is not null then
    select * into affiliate from public.users where upper(affiliate_code) = upper(new.affiliate_code) limit 1;
    if found then
      percent := coalesce(affiliate.commission_percent, 30);
      commission := round((new.amount * percent / 100.0)::numeric, 2);
      insert into public.affiliate_commissions (
        affiliate_user_id, payment_id, referred_email, sale_amount, commission_percent, commission_amount, status
      ) values (
        affiliate.id, new.id, null, new.amount, percent, commission, 'approved'
      );
      update public.users
        set total_earned = coalesce(total_earned, 0) + commission
        where id = affiliate.id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_register_affiliate_commission on public.payments;
create trigger trg_register_affiliate_commission
  after update of status on public.payments
  for each row execute function public.register_affiliate_commission();
