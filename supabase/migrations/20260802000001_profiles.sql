-- =============================================================================
-- Seancly, migration 1 : profils
--
-- Standard de sécurité appliqué à toute la couche SQL :
--   * REVOKE ALL d'abord, on ne rouvre que le nécessaire ;
--   * toute fonction en SECURITY DEFINER avec SET search_path = '' et des
--     schémas qualifiés en toutes lettres ;
--   * RLS activée sur chaque table, avec des policies explicites par rôle et
--     par opération.
--
-- Note de conception : `birth_date` vit dans une table séparée. Les profils
-- sont lisibles publiquement, or une date de naissance ne doit pas l'être. La
-- RLS filtre des lignes, pas des colonnes ; séparer les tables est le seul
-- moyen propre de tenir les deux exigences à la fois.
-- =============================================================================

-- Formules d'abonnement, alignées sur le type CreatorPlan côté application.
create type public.creator_plan as enum ('free', 'pro', 'cine_plus');

-- -----------------------------------------------------------------------------
-- profiles : miroir applicatif de auth.users, partie publique
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (char_length(bio) <= 400),
  -- Teinte du dégradé d'avatar, à défaut de photo.
  avatar_color text not null default '#C0386A' check (avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_creator boolean not null default false,
  plan public.creator_plan not null default 'free',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil public. Lisible par tous, modifiable par son seul propriétaire.';

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert (id, handle, display_name, bio, avatar_color) on table public.profiles to authenticated;
-- `is_creator`, `plan` et `verified` ne sont jamais écrits par le client : ils
-- relèvent de la facturation et de la modération, donc du service_role.
grant update (handle, display_name, bio, avatar_color) on table public.profiles to authenticated;

create policy "profiles_select_all"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Pas de policy de suppression : un profil disparaît avec son compte auth.

-- -----------------------------------------------------------------------------
-- profile_private : données personnelles, jamais publiques
-- -----------------------------------------------------------------------------
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  -- Sert l'horoscope ciné. Facultative, et seulement si elle est consentie.
  birth_date date,
  birth_date_consent_at timestamptz,
  constraint birth_date_needs_consent
    check (birth_date is null or birth_date_consent_at is not null)
);

comment on table public.profile_private is
  'Données personnelles du profil. Lisibles et modifiables par le seul propriétaire.';

alter table public.profile_private enable row level security;

revoke all on table public.profile_private from public, anon, authenticated;
grant select, insert, update, delete on table public.profile_private to authenticated;

create policy "profile_private_select_self"
  on public.profile_private for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profile_private_insert_self"
  on public.profile_private for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profile_private_update_self"
  on public.profile_private for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profile_private_delete_self"
  on public.profile_private for delete
  to authenticated
  using ((select auth.uid()) = id);

-- -----------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
  candidate text;
  suffix integer := 0;
begin
  -- On part de la partie locale de l'e-mail, nettoyée puis rendue unique.
  base_handle := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-zA-Z0-9_]', '', 'g'));

  if char_length(base_handle) < 3 then
    base_handle := 'membre';
  end if;

  base_handle := left(base_handle, 24);
  candidate := base_handle;

  while exists (select 1 from public.profiles p where p.handle = candidate) loop
    suffix := suffix + 1;
    candidate := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    candidate,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), candidate)
  );

  insert into public.profile_private (id) values (new.id);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Horodatage de modification, réutilisé par les migrations suivantes
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
