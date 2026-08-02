-- =============================================================================
-- Seancly, migration 9 : ouverture du fil à toute la communauté
--
-- Le fil gagne deux onglets : « la communauté », qui montre les notes et les
-- critiques de tous les membres, et « mes abonnements », qui garde le
-- périmètre restreint. Le premier ne peut pas fonctionner avec la policy de la
-- migration 8, qui limitait la lecture aux seuls abonnements.
--
-- On retient l'état intermédiaire, meilleur que les deux précédents :
--   * `anon` reste sans aucun droit de lecture, la page exige un compte ;
--   * un membre connecté lit l'activité `public` de tout le monde, la sienne,
--     et celle des personnes qu'il suit même si elle est restreinte.
--
-- `visibility = 'followers'` retrouve ainsi son utilité : un événement marqué
-- ainsi n'apparaît qu'aux abonnés de son auteur, jamais dans le fil communauté.
-- =============================================================================

drop policy if exists "activity_select_followed" on public.activity;

create policy "activity_select_member"
  on public.activity for select
  to authenticated
  using (
    visibility = 'public'
    or actor_id = (select auth.uid())
    or public.is_followed_by(actor_id, (select auth.uid()))
  );

-- `anon` reste sans droit de lecture : rien à refaire ici, la migration 8 le
-- lui a retiré et le fil n'est pas une page publique.

comment on column public.activity.visibility is
  'public : visible de tout membre connecté. followers : visible des seuls abonnés de l''auteur.';
