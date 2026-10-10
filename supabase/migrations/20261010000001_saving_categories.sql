-- Moni : épargne (2/2)
-- Catégories d'épargne par défaut, pour les nouveaux comptes et les comptes existants.

create or replace function public.seed_default_categories()
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
    (new.id, 'Autres revenus', 'income', '#14b8a6', 'piggy-bank'),
    (new.id, 'Livret',       'saving',  '#3b82f6', 'piggy-bank'),
    (new.id, 'Investissements', 'saving', '#6366f1', 'trending-up');
  return new;
end;
$$;

insert into public.categories (user_id, name, type, color, icon)
select u.id, c.name, 'saving', c.color, c.icon
from auth.users u
cross join (values
  ('Livret', '#3b82f6', 'piggy-bank'),
  ('Investissements', '#6366f1', 'trending-up')
) as c (name, color, icon)
on conflict (user_id, type, name) do nothing;
