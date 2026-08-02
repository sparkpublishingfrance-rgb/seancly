-- =============================================================================
-- Seancly, migration 8 : resserrement de la lecture du fil
--
-- La migration 7 rendait toute activité `public` lisible par n'importe qui, y
-- compris un visiteur anonyme. C'était une lecture littérale de la colonne
-- `visibility`, mais elle contredit la règle de qualité du lot : un membre ne
-- doit voir que son activité et celle des personnes qu'il suit.
--
-- Vérifié en conditions réelles avant correction : un appel anonyme sur
-- `activity` renvoyait bien les événements du compte de test.
--
-- On resserre donc à « moi, ou quelqu'un que je suis », et l'anonyme perd le
-- droit de lecture. La colonne `visibility` reste en place : elle servira le
-- jour où une page de profil publique voudra montrer une activité choisie.
-- =============================================================================

drop policy if exists "activity_select_public" on public.activity;
drop policy if exists "activity_select_visible" on public.activity;

revoke select on table public.activity from anon;

create policy "activity_select_followed"
  on public.activity for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or public.is_followed_by(actor_id, (select auth.uid()))
  );

comment on column public.activity.visibility is
  'Restriction prévue pour l''activité montrée sur une page publique. Sans effet tant que la lecture est déjà limitée aux abonnements.';
