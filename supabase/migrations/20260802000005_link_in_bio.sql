-- =============================================================================
-- Seancly, migration 5 : liens de la page créateur
--
-- Les visiteurs doivent pouvoir incrémenter un compteur de clics sans avoir le
-- moindre droit d'écriture sur la table. D'où une fonction SECURITY DEFINER
-- dédiée, qui ne touche que la colonne `clicks` d'un lien activé.
-- =============================================================================

create table public.link_in_bio_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  url text not null check (url ~ '^(https?://|mailto:)' and char_length(url) <= 2048),
  position integer not null default 0 check (position >= 0),
  enabled boolean not null default true,
  clicks integer not null default 0 check (clicks >= 0),
  created_at timestamptz not null default now()
);

create index link_in_bio_items_owner_idx on public.link_in_bio_items (owner_id, position);

alter table public.link_in_bio_items enable row level security;

revoke all on table public.link_in_bio_items from public, anon, authenticated;
grant select on table public.link_in_bio_items to anon, authenticated;
-- `clicks` est absent des colonnes écrivables : il ne bouge que par la fonction
-- d'incrément ci-dessous.
grant insert (owner_id, label, url, position, enabled) on table public.link_in_bio_items to authenticated;
grant update (label, url, position, enabled) on table public.link_in_bio_items to authenticated;
grant delete on table public.link_in_bio_items to authenticated;

create policy "link_in_bio_select_enabled"
  on public.link_in_bio_items for select
  to anon
  using (enabled);

create policy "link_in_bio_select_enabled_or_own"
  on public.link_in_bio_items for select
  to authenticated
  using (enabled or owner_id = (select auth.uid()));

create policy "link_in_bio_insert_own"
  on public.link_in_bio_items for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "link_in_bio_update_own"
  on public.link_in_bio_items for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "link_in_bio_delete_own"
  on public.link_in_bio_items for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Comptage des clics
-- -----------------------------------------------------------------------------
create or replace function public.register_link_click(target_link uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.link_in_bio_items
     set clicks = clicks + 1
   where id = target_link
     and enabled;
end;
$$;

comment on function public.register_link_click(uuid) is
  'Incrémente le compteur d''un lien activé. Seul chemin d''écriture sur clicks.';

revoke all on function public.register_link_click(uuid) from public, anon, authenticated;
grant execute on function public.register_link_click(uuid) to anon, authenticated;
