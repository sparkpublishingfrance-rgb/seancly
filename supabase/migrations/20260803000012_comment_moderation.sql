-- =============================================================================
-- Seancly, migration 12 : modération des commentaires
--
-- Principe directeur, encodé jusque dans le schéma : critiquer une œuvre est
-- toujours légitime, s'en prendre à une personne ne l'est pas. Le classement
-- vient d'une Edge Function ; la base se contente de garantir que personne ne
-- peut le contourner.
--
-- Deux garde-fous structurels :
--   * le client perd le droit d'insérer dans `list_comments`. Seule la fonction
--     de modération, en service_role, écrit des commentaires. Sans cela, il
--     suffirait d'appeler l'API directement pour publier sans être classé ;
--   * `comment_moderation` n'est lisible que des administrateurs et n'est
--     écrite par aucun rôle client.
--
-- Masquer n'est jamais réécrire : le texte reste intact, seul le statut change.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Rôle administrateur
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Accès à la file de modération. Jamais lisible par anon, jamais écrit par le client.';

-- La migration 6 limite déjà `anon` à une liste de colonnes : la nouvelle n'y
-- est pas, donc elle lui est inaccessible sans rien faire de plus.

create or replace function public.is_admin(viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = viewer),
    false
  );
$$;

revoke all on function public.is_admin(uuid) from public, anon, authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Statut de modération
-- -----------------------------------------------------------------------------
create type public.moderation_status as enum (
  -- Publié normalement.
  'visible',
  -- Publié, mais signalé pour relecture humaine.
  'flagged',
  -- Retiré de l'affichage, récupérable en cas de faux positif.
  'hidden',
  -- Jamais publié. Conservé pour la trace, invisible de tous sauf des admins.
  'blocked'
);

alter table public.list_comments
  add column moderation_status public.moderation_status not null default 'visible';

create index list_comments_moderation_idx
  on public.list_comments (moderation_status, created_at desc)
  where moderation_status <> 'visible';

-- -----------------------------------------------------------------------------
-- Lecture : `hidden` et `blocked` ne sont jamais servis au public
-- -----------------------------------------------------------------------------
drop policy if exists "list_comments_select_visible" on public.list_comments;
drop policy if exists "list_comments_select_visible_or_own" on public.list_comments;

create policy "list_comments_select_public"
  on public.list_comments for select
  to anon
  using (
    deleted_at is null
    and moderation_status in ('visible', 'flagged')
    and public.list_is_public(list_id)
  );

-- Un auteur voit toujours son propre commentaire, y compris retiré ou masqué :
-- lui cacher son texte le pousserait à le réécrire sans comprendre.
create policy "list_comments_select_member"
  on public.list_comments for select
  to authenticated
  using (
    (
      deleted_at is null
      and moderation_status in ('visible', 'flagged')
      and public.list_is_public(list_id)
    )
    or author_id = (select auth.uid())
    or public.is_admin((select auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- Écriture : plus aucune insertion cliente
-- -----------------------------------------------------------------------------
revoke insert on table public.list_comments from authenticated;
drop policy if exists "list_comments_insert_own" on public.list_comments;

-- L'édition de son propre texte reste possible, mais seulement sur un
-- commentaire effectivement publié.
drop policy if exists "list_comments_update_own" on public.list_comments;

create policy "list_comments_update_own"
  on public.list_comments for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and deleted_at is null
    and moderation_status in ('visible', 'flagged')
  )
  with check (author_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Journal des décisions
-- -----------------------------------------------------------------------------
create table public.comment_moderation (
  id uuid primary key default gen_random_uuid(),
  -- Nul si le commentaire a disparu avec sa liste : la décision, elle, reste.
  comment_id uuid references public.list_comments (id) on delete set null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  level smallint not null check (level between 0 and 3),
  category text not null check (char_length(category) between 1 and 64),
  reason text check (char_length(reason) <= 500),
  source text not null check (source in ('auto', 'human')),
  -- Renseigné pour une décision humaine.
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index comment_moderation_comment_idx on public.comment_moderation (comment_id);
create index comment_moderation_created_idx on public.comment_moderation (created_at desc);

comment on table public.comment_moderation is
  'Trace de chaque décision de modération. Lisible des seuls administrateurs, écrite par aucun rôle client.';

alter table public.comment_moderation enable row level security;

revoke all on table public.comment_moderation from public, anon, authenticated;
grant select on table public.comment_moderation to authenticated;

create policy "comment_moderation_select_admin"
  on public.comment_moderation for select
  to authenticated
  using (public.is_admin((select auth.uid())));

-- Aucune policy d'écriture : les décisions passent par les fonctions ci-dessous.

-- =============================================================================
-- Publication d'un commentaire, après classement
--
-- Appelée par l'Edge Function en service_role. Elle est le seul chemin
-- d'insertion, et elle écrit la décision dans le même mouvement.
-- =============================================================================
create or replace function public.publish_moderated_comment(
  target_list uuid,
  target_author uuid,
  comment_body text,
  decision_level smallint,
  decision_category text,
  decision_reason text
)
returns public.list_comments
language plpgsql
security definer
set search_path = ''
as $$
declare
  status public.moderation_status;
  created public.list_comments;
begin
  status := case decision_level
    when 0 then 'visible'::public.moderation_status
    when 1 then 'flagged'::public.moderation_status
    when 2 then 'hidden'::public.moderation_status
    else 'blocked'::public.moderation_status
  end;

  if not exists (
    select 1 from public.lists l where l.id = target_list and l.is_public
  ) then
    raise exception 'liste introuvable ou privée';
  end if;

  insert into public.list_comments (list_id, author_id, body, moderation_status)
  values (target_list, target_author, comment_body, status)
  returning * into created;

  insert into public.comment_moderation
    (comment_id, author_id, level, category, reason, source)
  values
    (created.id, target_author, decision_level, decision_category, decision_reason, 'auto');

  return created;
end;
$$;

revoke all on function public.publish_moderated_comment(uuid, uuid, text, smallint, text, text)
  from public, anon, authenticated;
-- Aucun grant : seul le service_role, qui contourne les droits, peut l'appeler.

-- =============================================================================
-- Décision humaine
-- =============================================================================
create or replace function public.review_comment(
  target_comment uuid,
  new_status public.moderation_status,
  review_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewer uuid := (select auth.uid());
  target public.list_comments;
begin
  if not public.is_admin(reviewer) then
    raise exception 'réservé à la modération';
  end if;

  select * into target from public.list_comments c where c.id = target_comment;
  if not found then
    return;
  end if;

  -- Le texte n'est jamais touché, seulement le statut.
  update public.list_comments c
     set moderation_status = new_status
   where c.id = target_comment;

  insert into public.comment_moderation
    (comment_id, author_id, level, category, reason, source, decided_by)
  values (
    target_comment,
    target.author_id,
    case new_status
      when 'visible' then 0
      when 'flagged' then 1
      when 'hidden' then 2
      else 3
    end,
    'revue_humaine',
    review_reason,
    'human',
    reviewer
  );
end;
$$;

revoke all on function public.review_comment(uuid, public.moderation_status, text)
  from public, anon, authenticated;
grant execute on function public.review_comment(uuid, public.moderation_status, text) to authenticated;

-- =============================================================================
-- File de modération
--
-- Une seule requête pour l'écran d'administration : commentaire, auteur, liste
-- et dernière décision. Renvoie zéro ligne à qui n'est pas administrateur.
-- =============================================================================
create or replace function public.moderation_queue(max_rows integer default 50)
returns table (
  comment_id uuid,
  list_id uuid,
  list_title text,
  author_id uuid,
  author_handle text,
  author_name text,
  body text,
  status public.moderation_status,
  level smallint,
  category text,
  reason text,
  source text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.list_id,
    l.title,
    c.author_id,
    p.handle,
    p.display_name,
    c.body,
    c.moderation_status,
    m.level,
    m.category,
    m.reason,
    m.source,
    c.created_at
  from public.list_comments c
  join public.lists l on l.id = c.list_id
  join public.profiles p on p.id = c.author_id
  -- Dernière décision connue pour ce commentaire.
  left join lateral (
    select cm.level, cm.category, cm.reason, cm.source
    from public.comment_moderation cm
    where cm.comment_id = c.id
    order by cm.created_at desc
    limit 1
  ) m on true
  where public.is_admin((select auth.uid()))
    and c.deleted_at is null
    and c.moderation_status in ('flagged', 'hidden', 'blocked')
  order by c.created_at desc
  limit least(greatest(max_rows, 1), 200);
$$;

revoke all on function public.moderation_queue(integer) from public, anon, authenticated;
grant execute on function public.moderation_queue(integer) to authenticated;

-- =============================================================================
-- Fil d'activité : seul le visible compte
--
-- La logique vit dans une fonction ordinaire, appelée par les deux triggers :
-- PostgreSQL interdit d'appeler une fonction de trigger autrement que par un
-- trigger.
-- =============================================================================
create or replace function public.record_comment_activity(comment public.list_comments)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent public.lists%rowtype;
  payload jsonb;
  touched integer;
begin
  -- Un commentaire masqué ou bloqué ne produit aucun événement.
  if comment.moderation_status not in ('visible', 'flagged') or comment.deleted_at is not null then
    return;
  end if;

  select * into parent from public.lists l where l.id = comment.list_id;
  if not found or not parent.is_public then
    return;
  end if;

  payload := jsonb_build_object(
    'title', parent.title,
    'excerpt', left(btrim(comment.body), 140)
  );

  -- Plusieurs commentaires d'une même personne dans l'heure se rassemblent.
  update public.activity a
     set created_at = now(),
         metadata = payload
   where a.actor_id = comment.author_id
     and a.verb = 'commented_list'
     and a.object_type = 'list'
     and a.object_ref = comment.list_id::text
     and a.created_at > now() - interval '1 hour';

  get diagnostics touched = row_count;
  if touched > 0 then
    return;
  end if;

  insert into public.activity (actor_id, verb, object_type, object_ref, metadata)
  values (comment.author_id, 'commented_list', 'list', comment.list_id::text, payload);
end;
$$;

revoke all on function public.record_comment_activity(public.list_comments)
  from public, anon, authenticated;

create or replace function public.log_list_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_comment_activity(new);
  return null;
end;
$$;

revoke all on function public.log_list_comment_activity() from public, anon, authenticated;

/**
 * Un changement de statut fait apparaître ou disparaître l'événement : approuver
 * un faux positif remet le commentaire dans le fil, le masquer l'en retire.
 */
create or replace function public.sync_list_comment_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.moderation_status in ('visible', 'flagged') then
    perform public.record_comment_activity(new);
    return null;
  end if;

  -- L'événement ne part que s'il ne reste plus rien de visible de cet auteur
  -- sur cette liste.
  if exists (
    select 1
    from public.list_comments c
    where c.list_id = new.list_id
      and c.author_id = new.author_id
      and c.deleted_at is null
      and c.moderation_status in ('visible', 'flagged')
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

revoke all on function public.sync_list_comment_activity() from public, anon, authenticated;

create trigger list_comments_activity_moderated
  after update of moderation_status on public.list_comments
  for each row execute function public.sync_list_comment_activity();
