-- =============================================================================
-- Seancly, migration 2 : listes et contenu des listes
--
-- `title_ref` désigne pour l'instant un titre du jeu de données mocké. Il
-- deviendra une clé étrangère vers `films_catalog` quand cette table existera,
-- une fois l'accord commercial TMDB signé. On garde donc du texte, pas un
-- entier, pour ne pas préjuger de la forme de l'identifiant final.
-- =============================================================================

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index lists_owner_id_idx on public.lists (owner_id);
create index lists_public_idx on public.lists (is_public) where is_public;

comment on table public.lists is
  'Listes de l''utilisateur. Publiques si is_public, sinon visibles du seul propriétaire.';

alter table public.lists enable row level security;

revoke all on table public.lists from public, anon, authenticated;
grant select on table public.lists to anon, authenticated;
grant insert, update, delete on table public.lists to authenticated;

create policy "lists_select_public"
  on public.lists for select
  to anon
  using (is_public);

create policy "lists_select_public_or_own"
  on public.lists for select
  to authenticated
  using (is_public or owner_id = (select auth.uid()));

create policy "lists_insert_own"
  on public.lists for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "lists_update_own"
  on public.lists for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "lists_delete_own"
  on public.lists for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Aides de policy pour list_items
--
-- Ces fonctions lisent `public.lists` en contournant sa RLS, ce qui est
-- exactement ce qu'on veut dans une policy : sans elles, la politique de
-- list_items dépendrait de la politique de lists et deviendrait illisible.
-- -----------------------------------------------------------------------------
create or replace function public.owns_list(target_list uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists l
    where l.id = target_list
      and l.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_list(uuid) from public, anon, authenticated;
grant execute on function public.owns_list(uuid) to authenticated;

create or replace function public.list_is_public(target_list uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists l
    where l.id = target_list
      and l.is_public
  );
$$;

revoke all on function public.list_is_public(uuid) from public, anon, authenticated;
grant execute on function public.list_is_public(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- list_items
-- -----------------------------------------------------------------------------
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  -- Identifiant du titre. Deviendra une FK vers films_catalog au lot suivant.
  title_ref text not null check (char_length(title_ref) between 1 and 64),
  position integer not null default 0 check (position >= 0),
  added_at timestamptz not null default now(),
  unique (list_id, title_ref)
);

create index list_items_list_id_idx on public.list_items (list_id, position);

comment on column public.list_items.title_ref is
  'Identifiant de titre. Texte tant que films_catalog n''existe pas, FK ensuite.';

alter table public.list_items enable row level security;

revoke all on table public.list_items from public, anon, authenticated;
grant select on table public.list_items to anon, authenticated;
grant insert, update, delete on table public.list_items to authenticated;

create policy "list_items_select_public"
  on public.list_items for select
  to anon
  using (public.list_is_public(list_id));

create policy "list_items_select_public_or_own"
  on public.list_items for select
  to authenticated
  using (public.list_is_public(list_id) or public.owns_list(list_id));

create policy "list_items_insert_own"
  on public.list_items for insert
  to authenticated
  with check (public.owns_list(list_id));

create policy "list_items_update_own"
  on public.list_items for update
  to authenticated
  using (public.owns_list(list_id))
  with check (public.owns_list(list_id));

create policy "list_items_delete_own"
  on public.list_items for delete
  to authenticated
  using (public.owns_list(list_id));
