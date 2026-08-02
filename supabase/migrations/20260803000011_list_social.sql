-- =============================================================================
-- Seancly, migration 11 : couche sociale des listes
--
-- Une liste reste l'œuvre d'une seule personne : son auteur en garde le
-- contenu. Ce qui devient collectif, c'est ce qu'on en fait autour, la suivre
-- et la commenter. Rien ici ne touche à `lists` ni à `list_items`.
--
-- Deux règles traversent tout le fichier :
--   * on ne suit et on ne commente qu'une liste publique, jamais une privée ;
--   * le propriétaire d'une liste peut masquer un commentaire sur sa liste,
--     mais jamais en réécrire le texte. D'où le passage par des fonctions
--     plutôt que par un droit d'écriture élargi.
--
-- Prérequis : la migration 10 doit être passée avant celle-ci.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- list_follows
-- -----------------------------------------------------------------------------
create table public.list_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, list_id)
);

create index list_follows_list_idx on public.list_follows (list_id, created_at desc);

comment on table public.list_follows is
  'Abonnements à des listes. Seules les listes publiques peuvent être suivies.';

alter table public.list_follows enable row level security;

revoke all on table public.list_follows from public, anon, authenticated;
grant select on table public.list_follows to anon, authenticated;
grant insert, delete on table public.list_follows to authenticated;
-- Pas d'update : un abonnement se crée ou se supprime.

create policy "list_follows_select_public"
  on public.list_follows for select
  to anon, authenticated
  using (public.list_is_public(list_id));

create policy "list_follows_insert_own"
  on public.list_follows for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and public.list_is_public(list_id)
  );

create policy "list_follows_delete_own"
  on public.list_follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- list_comments
--
-- Suppression douce : la ligne reste, `deleted_at` la retire de la vue de tous
-- sauf de son auteur. `deleted_by` dit qui l'a retirée, l'auteur ou le
-- propriétaire de la liste, ce que l'interface distingue.
-- -----------------------------------------------------------------------------
create table public.list_comments (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id),
  constraint deleted_needs_author check (
    (deleted_at is null and deleted_by is null)
    or (deleted_at is not null and deleted_by is not null)
  )
);

create index list_comments_list_idx on public.list_comments (list_id, created_at desc);
create index list_comments_author_idx on public.list_comments (author_id);

alter table public.list_comments enable row level security;

revoke all on table public.list_comments from public, anon, authenticated;
grant select on table public.list_comments to anon, authenticated;
grant insert on table public.list_comments to authenticated;
-- Seul le texte est modifiable directement. `deleted_at` et `deleted_by` ne
-- bougent que par les fonctions ci-dessous, jamais à la main.
grant update (body) on table public.list_comments to authenticated;

create policy "list_comments_select_visible"
  on public.list_comments for select
  to anon
  using (deleted_at is null and public.list_is_public(list_id));

-- Un auteur continue de voir son commentaire retiré, ce qui lui évite de le
-- réécrire sans comprendre.
create policy "list_comments_select_visible_or_own"
  on public.list_comments for select
  to authenticated
  using (
    (deleted_at is null and public.list_is_public(list_id))
    or author_id = (select auth.uid())
  );

create policy "list_comments_insert_own"
  on public.list_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and deleted_at is null
    and public.list_is_public(list_id)
  );

create policy "list_comments_update_own"
  on public.list_comments for update
  to authenticated
  using (author_id = (select auth.uid()) and deleted_at is null)
  with check (author_id = (select auth.uid()));

create trigger list_comments_set_updated_at
  before update on public.list_comments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Retrait d'un commentaire
--
-- Deux chemins, deux droits. L'auteur retire le sien ; le propriétaire de la
-- liste masque celui d'un autre, sans jamais pouvoir en changer le texte.
-- -----------------------------------------------------------------------------
create or replace function public.delete_my_list_comment(comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.list_comments c
     set deleted_at = now(),
         deleted_by = (select auth.uid())
   where c.id = comment_id
     and c.author_id = (select auth.uid())
     and c.deleted_at is null;
end;
$$;

revoke all on function public.delete_my_list_comment(uuid) from public, anon, authenticated;
grant execute on function public.delete_my_list_comment(uuid) to authenticated;

create or replace function public.hide_list_comment(comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.list_comments c
     set deleted_at = now(),
         deleted_by = (select auth.uid())
   where c.id = comment_id
     and c.deleted_at is null
     and exists (
       select 1
       from public.lists l
       where l.id = c.list_id
         and l.owner_id = (select auth.uid())
     );
end;
$$;

comment on function public.hide_list_comment(uuid) is
  'Masque un commentaire sur sa propre liste. Ne touche jamais au texte.';

revoke all on function public.hide_list_comment(uuid) from public, anon, authenticated;
grant execute on function public.hide_list_comment(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Compteurs
--
-- security_invoker laisse la RLS des tables sous-jacentes s'appliquer au
-- lecteur : un visiteur ne compte que ce qu'il a le droit de voir.
-- -----------------------------------------------------------------------------
create view public.list_stats
with (security_invoker = on)
as
  select
    l.id as list_id,
    (select count(*) from public.list_items i where i.list_id = l.id) as items,
    (select count(*) from public.list_follows f where f.list_id = l.id) as followers,
    (
      select count(*)
      from public.list_comments c
      where c.list_id = l.id
        and c.deleted_at is null
    ) as comments
  from public.lists l;

revoke all on public.list_stats from public, anon, authenticated;
grant select on public.list_stats to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Listes en vogue
--
-- Score volontairement lisible : sur la période, un abonnement vaut deux points
-- et un commentaire un point. À égalité, la plus récente passe devant, ce qui
-- laisse une chance aux nouvelles listes.
-- -----------------------------------------------------------------------------
create or replace function public.popular_lists(
  window_days integer default 30,
  max_rows integer default 12
)
returns table (
  list_id uuid,
  title text,
  owner_id uuid,
  items bigint,
  followers bigint,
  comments bigint,
  score bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with scored as (
    select
      l.id,
      l.title,
      l.owner_id,
      l.created_at,
      (select count(*) from public.list_items i where i.list_id = l.id) as items,
      (select count(*) from public.list_follows f where f.list_id = l.id) as followers,
      (
        select count(*)
        from public.list_comments c
        where c.list_id = l.id and c.deleted_at is null
      ) as comments,
      (
        (
          select count(*) * 2
          from public.list_follows f
          where f.list_id = l.id
            and f.created_at > now() - make_interval(days => greatest(window_days, 1))
        )
        + (
          select count(*)
          from public.list_comments c
          where c.list_id = l.id
            and c.deleted_at is null
            and c.created_at > now() - make_interval(days => greatest(window_days, 1))
        )
      ) as score
    from public.lists l
    -- La fonction contourne la RLS : ce filtre est le seul rempart, il ne doit
    -- jamais disparaître.
    where l.is_public
  )
  select id, title, owner_id, items, followers, comments, score
  from scored
  order by score desc, created_at desc
  limit least(greatest(max_rows, 1), 50);
$$;

revoke all on function public.popular_lists(integer, integer) from public, anon, authenticated;
grant execute on function public.popular_lists(integer, integer) to anon, authenticated;

-- =============================================================================
-- Alimentation du fil
-- =============================================================================

create or replace function public.log_list_follow_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.lists%rowtype;
begin
  select * into parent from public.lists l where l.id = new.list_id;
  if not found or not parent.is_public then
    return null;
  end if;

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (
    new.follower_id,
    'followed_list',
    'list',
    new.list_id::text,
    jsonb_build_object('title', parent.title)
  );

  return null;
end;
$$;

revoke all on function public.log_list_follow_activity() from public, anon, authenticated;

create trigger list_follows_activity
  after insert on public.list_follows
  for each row execute function public.log_list_follow_activity();

create or replace function public.unlog_list_follow_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity a
   where a.actor_id = old.follower_id
     and a.verb = 'followed_list'
     and a.object_type = 'list'
     and a.object_ref = old.list_id::text;
  return null;
end;
$$;

revoke all on function public.unlog_list_follow_activity() from public, anon, authenticated;

create trigger list_follows_activity_removed
  after delete on public.list_follows
  for each row execute function public.unlog_list_follow_activity();

-- -----------------------------------------------------------------------------
-- Commentaires
--
-- Comme pour les ajouts en liste, plusieurs commentaires d'une même personne
-- sur une même liste dans l'heure se rassemblent en un seul événement.
-- -----------------------------------------------------------------------------
create or replace function public.log_list_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.lists%rowtype;
  payload jsonb;
  touched integer;
begin
  select * into parent from public.lists l where l.id = new.list_id;
  if not found or not parent.is_public then
    return null;
  end if;

  payload := jsonb_build_object(
    'title', parent.title,
    'excerpt', left(btrim(new.body), 140)
  );

  update public.activity a
     set created_at = now(),
         metadata = payload
   where a.actor_id = new.author_id
     and a.verb = 'commented_list'
     and a.object_type = 'list'
     and a.object_ref = new.list_id::text
     and a.created_at > now() - interval '1 hour';

  get diagnostics touched = row_count;
  if touched > 0 then
    return null;
  end if;

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (new.author_id, 'commented_list', 'list', new.list_id::text, payload);

  return null;
end;
$$;

revoke all on function public.log_list_comment_activity() from public, anon, authenticated;

create trigger list_comments_activity
  after insert on public.list_comments
  for each row execute function public.log_list_comment_activity();

/**
 * Un commentaire retiré ne doit plus se voir dans le fil. L'événement ne
 * disparaît que si son auteur n'a plus aucun commentaire visible sur la liste.
 */
create or replace function public.unlog_list_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.deleted_at is not null or new.deleted_at is null then
    return null;
  end if;

  if exists (
    select 1
    from public.list_comments c
    where c.list_id = new.list_id
      and c.author_id = new.author_id
      and c.deleted_at is null
  ) then
    return null;
  end if;

  delete from public.activity a
   where a.actor_id = new.author_id
     and a.verb = 'commented_list'
     and a.object_type = 'list'
     and a.object_ref = new.list_id::text;

  return null;
end;
$$;

revoke all on function public.unlog_list_comment_activity() from public, anon, authenticated;

create trigger list_comments_activity_removed
  after update of deleted_at on public.list_comments
  for each row execute function public.unlog_list_comment_activity();
