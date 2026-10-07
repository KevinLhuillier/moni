-- Moni : schéma initial
-- Catégories, transactions et budgets mensuels, isolés par utilisateur via RLS.

create type public.transaction_type as enum ('expense', 'income');

-- ---------------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  type public.transaction_type not null default 'expense',
  color text not null default '#64748b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text not null default 'tag',
  created_at timestamptz not null default now(),
  unique (user_id, type, name)
);

create index categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  description text check (char_length(description) <= 200),
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_id_idx on public.transactions (category_id);

-- ---------------------------------------------------------------------------
-- Budgets : un plafond mensuel récurrent par catégorie de dépense
-- ---------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create index budgets_category_id_idx on public.budgets (category_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "categories: own rows" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions: own rows" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid())
      )
    )
  );

create policy "budgets: own rows" on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Catégories par défaut à l'inscription
-- ---------------------------------------------------------------------------
create function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Alimentation', 'expense', '#22c55e', 'shopping-cart'),
    (new.id, 'Logement',     'expense', '#3b82f6', 'house'),
    (new.id, 'Transport',    'expense', '#f59e0b', 'car'),
    (new.id, 'Loisirs',      'expense', '#a855f7', 'gamepad-2'),
    (new.id, 'Santé',        'expense', '#ef4444', 'heart-pulse'),
    (new.id, 'Restaurants',  'expense', '#f97316', 'utensils'),
    (new.id, 'Abonnements',  'expense', '#06b6d4', 'repeat'),
    (new.id, 'Shopping',     'expense', '#ec4899', 'shopping-bag'),
    (new.id, 'Salaire',      'income',  '#10b981', 'briefcase'),
    (new.id, 'Autres revenus', 'income', '#14b8a6', 'piggy-bank');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
