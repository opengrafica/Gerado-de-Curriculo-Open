-- CurrículoJá — schema inicial
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  is_admin boolean not null default false,
  affiliate_code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id text primary key,
  name text not null,
  description text,
  preview_color text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  template_id text references public.templates(id) default 'moderno',
  pdf_url text,
  status text not null default 'draft' check (status in ('draft', 'paid', 'generated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  product text not null check (product in ('resume', 'cover_letter', 'linkedin', 'complete_pack')),
  coupon_code text,
  affiliate_code text,
  mercado_pago_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.upsells (
  id text primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  product text not null,
  active boolean not null default true
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  active boolean not null default true,
  max_uses integer,
  used_count integer not null default 0
);

-- Seed templates
insert into public.templates (id, name, description, preview_color) values
  ('moderno', 'Moderno', 'Layout limpo com destaque em teal.', '#0d9476'),
  ('classico', 'Clássico', 'Tipografia tradicional.', '#3a4251'),
  ('executivo', 'Executivo', 'Sofisticado para liderança.', '#1e3a5f'),
  ('minimalista', 'Minimalista', 'Espaço e tipografia leve.', '#525252'),
  ('azul', 'Azul', 'Paleta azul corporativa.', '#2563eb'),
  ('preto', 'Preto', 'Alto contraste.', '#171717'),
  ('criativo', 'Criativo', 'Toques de cor dinâmicos.', '#ea580c'),
  ('jovem-aprendiz', 'Jovem Aprendiz', 'Foco em potencial.', '#0891b2'),
  ('primeiro-emprego', 'Primeiro Emprego', 'Valoriza cursos e skills.', '#059669'),
  ('corporativo', 'Corporativo', 'ATS-friendly.', '#0f7661')
on conflict (id) do nothing;

insert into public.upsells (id, name, description, price, product) values
  ('cover', 'Carta de apresentação', 'Texto persuasivo personalizado.', 4.90, 'cover_letter'),
  ('linkedin', 'Perfil para LinkedIn', 'Headline e resumo otimizados.', 9.90, 'linkedin'),
  ('complete', 'Pacote Completo', 'Carta + LinkedIn + versões extras.', 19.90, 'complete_pack')
on conflict (id) do nothing;

insert into public.coupons (code, discount_percent, active, max_uses, used_count) values
  ('BEMVINDO10', 10, true, 1000, 0),
  ('CURRICULO20', 20, true, 100, 0),
  ('AFILIADO15', 15, true, null, 0)
on conflict (code) do nothing;

-- RLS
alter table public.users enable row level security;
alter table public.resumes enable row level security;
alter table public.payments enable row level security;
alter table public.templates enable row level security;
alter table public.upsells enable row level security;
alter table public.analytics enable row level security;
alter table public.coupons enable row level security;

create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = id);

create policy "resumes_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes for update using (auth.uid() = user_id);

create policy "payments_select_own" on public.payments for select using (auth.uid() = user_id);

create policy "templates_public_read" on public.templates for select using (active = true);
create policy "upsells_public_read" on public.upsells for select using (active = true);
create policy "coupons_public_read" on public.coupons for select using (active = true);

create policy "analytics_insert_auth" on public.analytics for insert with check (auth.uid() = user_id or user_id is null);

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, affiliate_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
