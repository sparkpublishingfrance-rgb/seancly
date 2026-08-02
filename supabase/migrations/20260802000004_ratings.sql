-- =============================================================================
-- Seancly, migration 4 : notes et critiques
--
-- L'échelle est la demi-étoile, de 0,5 à 5. L'affichage sur dix de la fiche
-- film se fait côté application, en doublant la valeur : on stocke ce que
-- l'utilisateur a réellement saisi, pas une conversion.
-- =============================================================================

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title_ref text not null check (char_length(title_ref) between 1 and 64),
  rating numeric(2, 1) not null
    check (rating >= 0.5 and rating <= 5 and (rating * 2) = floor(rating * 2)),
  body text check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Une seule note par titre et par auteur : noter à nouveau met à jour.
  unique (author_id, title_ref)
);

create index ratings_title_ref_idx on public.ratings (title_ref);
create index ratings_author_id_idx on public.ratings (author_id);

comment on column public.ratings.rating is
  'De 0,5 à 5 par demi-étoile. Multiplier par deux pour l''affichage sur dix.';

alter table public.ratings enable row level security;

revoke all on table public.ratings from public, anon, authenticated;
grant select on table public.ratings to anon, authenticated;
grant insert, update, delete on table public.ratings to authenticated;

create policy "ratings_select_all"
  on public.ratings for select
  to anon, authenticated
  using (true);

create policy "ratings_insert_own"
  on public.ratings for insert
  to authenticated
  with check (author_id = (select auth.uid()));

create policy "ratings_update_own"
  on public.ratings for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "ratings_delete_own"
  on public.ratings for delete
  to authenticated
  using (author_id = (select auth.uid()));

create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();
