-- Moni : dépenses récurrentes
-- Une transaction marquée « récurrente » est recopiée au mois suivant par une
-- tâche pg_cron qui tourne le dernier jour du mois. La copie est elle-même
-- récurrente : pour arrêter la série, on décoche la dernière occurrence.

alter table public.transactions
  add column recurring boolean not null default false,
  -- Occurrence dont cette ligne est la copie ; unique pour qu'une relance du
  -- batch ne crée pas de doublon.
  add column recurring_source_id uuid unique
    references public.transactions (id) on delete set null;

create index transactions_recurring_date_idx on public.transactions (date) where recurring;

-- ---------------------------------------------------------------------------
-- Copie des transactions récurrentes du mois de `source_month` vers le mois
-- suivant, au même jour (ramené au dernier jour si le mois est plus court).
-- Idempotente. Retourne le nombre de transactions créées.
-- ---------------------------------------------------------------------------
create function public.copy_recurring_transactions(source_month date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start date := date_trunc('month', source_month)::date;
  next_start date := (month_start + interval '1 month')::date;
  next_days integer := extract(day from next_start + interval '1 month - 1 day')::integer;
  created integer;
begin
  insert into public.transactions
    (user_id, category_id, type, amount, date, description, recurring, recurring_source_id)
  select
    t.user_id,
    t.category_id,
    t.type,
    t.amount,
    next_start + (least(extract(day from t.date)::integer, next_days) - 1),
    t.description,
    true,
    t.id
  from public.transactions t
  where t.recurring
    and t.date >= month_start
    and t.date < next_start
  on conflict (recurring_source_id) do nothing;

  get diagnostics created = row_count;
  return created;
end;
$$;

-- Traite toutes les données utilisateurs : réservé au batch.
revoke execute on function public.copy_recurring_transactions(date) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Planification : chaque soir du 28 au 31 à 21h UTC (23h à Paris en été, 22h en
-- hiver, donc toujours avant minuit), mais n'agit que le dernier jour du mois.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'copy-recurring-transactions',
  '0 21 28-31 * *',
  $$
    select public.copy_recurring_transactions()
    where current_date = (date_trunc('month', current_date) + interval '1 month - 1 day')::date
  $$
);
