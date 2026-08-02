-- =============================================================================
-- Seancly, migration 6 : colonnes publiques du profil
--
-- La vitrine créateur est consultable sans compte. Or la RLS filtre des lignes,
-- pas des colonnes : jusqu'ici, un visiteur anonyme pouvait lire `plan` et
-- `is_creator` en interrogeant la base directement, même si l'application ne les
-- affichait pas.
--
-- On restreint donc le droit de lecture d'`anon` aux seules colonnes publiques.
-- « Ne jamais exposer » devient une garantie de la base, plus une convention de
-- l'application.
--
-- Conséquence à connaître : `anon` ne peut plus faire `select *` sur
-- `public.profiles`. Les requêtes de la vitrine listent leurs colonnes en
-- toutes lettres, c'est voulu.
-- =============================================================================

revoke select on table public.profiles from anon;

grant select (id, handle, display_name, bio, avatar_color, verified, created_at)
  on table public.profiles to anon;

comment on column public.profiles.plan is
  'Formule d''abonnement. Jamais lisible par anon : facturation.';

comment on column public.profiles.is_creator is
  'Statut créateur. Jamais lisible par anon, et jamais écrit par le client.';
