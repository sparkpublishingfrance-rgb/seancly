-- =============================================================================
-- Seancly, migration 3 : graphe social
--
-- Les abonnements sont publics, comme sur toute plateforme sociale : c'est ce
-- qui permet d'afficher « untel te suit » et les compteurs. En revanche on
-- n'écrit que pour soi, jamais pour un autre compte.
-- =============================================================================

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

revoke all on table public.follows from public, anon, authenticated;
grant select on table public.follows to anon, authenticated;
grant insert, delete on table public.follows to authenticated;
-- Pas d'update : un abonnement se crée ou se supprime, il ne se modifie pas.

create policy "follows_select_all"
  on public.follows for select
  to anon, authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (follower_id = (select auth.uid()));

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Compteurs agrégés
--
-- security_invoker laisse la RLS de `follows` s'appliquer au lecteur de la vue,
-- au lieu de la contourner avec les droits du propriétaire.
-- -----------------------------------------------------------------------------
create view public.follow_counts
with (security_invoker = on)
as
  select
    p.id as profile_id,
    (select count(*) from public.follows f where f.following_id = p.id) as followers,
    (select count(*) from public.follows f where f.follower_id = p.id) as following
  from public.profiles p;

revoke all on public.follow_counts from public, anon, authenticated;
grant select on public.follow_counts to anon, authenticated;
