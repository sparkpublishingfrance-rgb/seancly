-- =============================================================================
-- Seancly, migration 7 : flux d'activité
--
-- Le fil ne se reconstruit pas à chaque chargement en joignant dix tables : les
-- événements sont matérialisés ici au moment où l'action se produit, par des
-- triggers, et le fil se contente de les lire filtrés par le graphe `follows`.
--
-- Règle d'écriture : aucune insertion cliente. Le client n'a que le droit de
-- lecture ; toutes les lignes naissent d'un trigger en SECURITY DEFINER.
--
-- Choix à signaler : `verb`, `object_type` et `visibility` sont de vrais types
-- énumérés plutôt que du texte libre. L'ajout d'une valeur reste un
-- `alter type ... add value`, et l'intégrité est garantie d'ici là.
-- =============================================================================

create type public.activity_verb as enum (
  'rated',
  'reviewed',
  'created_list',
  'added_to_list',
  'followed',
  -- Prévu pour les guildes. Aucun trigger ne le produit encore.
  'joined_guild'
);

create type public.activity_object as enum ('title', 'list', 'profile', 'guild');

create type public.activity_visibility as enum ('public', 'followers');

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  verb public.activity_verb not null,
  object_type public.activity_object not null,
  -- Identifiant de l'objet. Pour un film, le `title_ref` provisoire qui pointe
  -- vers le jeu de données mocké tant que `films_catalog` n'existe pas.
  object_ref text not null check (char_length(object_ref) between 1 and 64),
  metadata jsonb,
  visibility public.activity_visibility not null default 'public',
  created_at timestamptz not null default now()
);

comment on table public.activity is
  'Événements d''activité. Alimentée par triggers uniquement, jamais par le client.';

create index activity_created_idx on public.activity (created_at desc);
create index activity_actor_created_idx on public.activity (actor_id, created_at desc);
create index activity_object_idx on public.activity (object_type, object_ref);

alter table public.activity enable row level security;

revoke all on table public.activity from public, anon, authenticated;
-- Lecture seule, et rien d'autre : pas d'insert, pas d'update, pas de delete.
grant select on table public.activity to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Lecture
-- -----------------------------------------------------------------------------
create or replace function public.is_followed_by(target uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.follows f
    where f.follower_id = viewer
      and f.following_id = target
  );
$$;

revoke all on function public.is_followed_by(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_followed_by(uuid, uuid) to authenticated;

create policy "activity_select_public"
  on public.activity for select
  to anon
  using (visibility = 'public');

-- Un événement restreint aux abonnés n'apparaît qu'à ceux qui suivent l'auteur,
-- et à l'auteur lui-même.
create policy "activity_select_visible"
  on public.activity for select
  to authenticated
  using (
    visibility = 'public'
    or actor_id = (select auth.uid())
    or public.is_followed_by(actor_id, (select auth.uid()))
  );

-- Aucune policy d'écriture : les triggers passent outre la RLS, le client non.

-- =============================================================================
-- Triggers d'alimentation
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Notes et critiques
--
-- Une note remplace la précédente plutôt que d'empiler les événements : un
-- membre qui ajuste sa note ne doit pas inonder le fil.
-- -----------------------------------------------------------------------------
create or replace function public.log_rating_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.rating is not distinct from old.rating
     and new.body is not distinct from old.body then
    return null;
  end if;

  delete from public.activity a
   where a.actor_id = new.author_id
     and a.object_type = 'title'
     and a.object_ref = new.title_ref
     and a.verb in ('rated', 'reviewed');

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (
    new.author_id,
    case
      when coalesce(btrim(new.body), '') <> '' then 'reviewed'::public.activity_verb
      else 'rated'::public.activity_verb
    end,
    'title',
    new.title_ref,
    jsonb_build_object('rating', new.rating)
  );

  return null;
end;
$$;

revoke all on function public.log_rating_activity() from public, anon, authenticated;

create trigger ratings_activity
  after insert or update on public.ratings
  for each row execute function public.log_rating_activity();

create or replace function public.unlog_rating_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity a
   where a.actor_id = old.author_id
     and a.object_type = 'title'
     and a.object_ref = old.title_ref
     and a.verb in ('rated', 'reviewed');
  return null;
end;
$$;

revoke all on function public.unlog_rating_activity() from public, anon, authenticated;

create trigger ratings_activity_removed
  after delete on public.ratings
  for each row execute function public.unlog_rating_activity();

-- -----------------------------------------------------------------------------
-- Listes
--
-- Rien ne sort d'une liste privée. Si elle devient publique plus tard,
-- l'événement naît à ce moment ; si elle redevient privée, il disparaît.
-- -----------------------------------------------------------------------------
create or replace function public.log_list_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_public then
    delete from public.activity a
     where a.object_type = 'list'
       and a.object_ref = new.id::text;
    return null;
  end if;

  if tg_op = 'UPDATE' and old.is_public then
    return null;
  end if;

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (
    new.owner_id,
    'created_list',
    'list',
    new.id::text,
    jsonb_build_object('title', new.title)
  );

  return null;
end;
$$;

revoke all on function public.log_list_activity() from public, anon, authenticated;

create trigger lists_activity
  after insert or update of is_public on public.lists
  for each row execute function public.log_list_activity();

create or replace function public.unlog_list_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity a
   where a.object_type = 'list'
     and a.object_ref = old.id::text;
  return null;
end;
$$;

revoke all on function public.unlog_list_activity() from public, anon, authenticated;

create trigger lists_activity_removed
  after delete on public.lists
  for each row execute function public.unlog_list_activity();

-- -----------------------------------------------------------------------------
-- Ajouts dans une liste
--
-- Un ajout massif ne doit pas produire un événement par titre : dans l'heure,
-- on rafraîchit l'événement existant au lieu d'en créer un autre.
-- -----------------------------------------------------------------------------
create or replace function public.log_list_item_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.lists%rowtype;
  touched integer;
begin
  select * into parent from public.lists l where l.id = new.list_id;

  if not found or not parent.is_public then
    return null;
  end if;

  update public.activity a
     set created_at = now(),
         metadata = jsonb_build_object('title', parent.title)
   where a.actor_id = parent.owner_id
     and a.verb = 'added_to_list'
     and a.object_type = 'list'
     and a.object_ref = parent.id::text
     and a.created_at > now() - interval '1 hour';

  get diagnostics touched = row_count;
  if touched > 0 then
    return null;
  end if;

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (
    parent.owner_id,
    'added_to_list',
    'list',
    parent.id::text,
    jsonb_build_object('title', parent.title)
  );

  return null;
end;
$$;

revoke all on function public.log_list_item_activity() from public, anon, authenticated;

create trigger list_items_activity
  after insert on public.list_items
  for each row execute function public.log_list_item_activity();

-- -----------------------------------------------------------------------------
-- Abonnements
--
-- Se désabonner retire l'événement : le fil ne doit pas garder la trace d'un
-- lien qui n'existe plus.
-- -----------------------------------------------------------------------------
create or replace function public.log_follow_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity (actor_id, verb, object_type, object_ref)
  values (new.follower_id, 'followed', 'profile', new.following_id::text);
  return null;
end;
$$;

revoke all on function public.log_follow_activity() from public, anon, authenticated;

create trigger follows_activity
  after insert on public.follows
  for each row execute function public.log_follow_activity();

create or replace function public.unlog_follow_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity a
   where a.actor_id = old.follower_id
     and a.verb = 'followed'
     and a.object_type = 'profile'
     and a.object_ref = old.following_id::text;
  return null;
end;
$$;

revoke all on function public.unlog_follow_activity() from public, anon, authenticated;

create trigger follows_activity_removed
  after delete on public.follows
  for each row execute function public.unlog_follow_activity();

-- Emplacement réservé : `joined_guild` attend que les guildes existent.
