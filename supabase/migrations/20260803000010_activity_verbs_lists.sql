-- =============================================================================
-- Seancly, migration 10 : deux verbes d'activité de plus
--
-- À exécuter SEULE, avant la migration 11.
--
-- PostgreSQL refuse d'utiliser une valeur d'énumération dans la transaction qui
-- vient de l'ajouter. En isolant ces deux lignes, on évite le piège quelle que
-- soit la façon dont l'éditeur SQL regroupe les instructions.
-- =============================================================================

alter type public.activity_verb add value if not exists 'followed_list';
alter type public.activity_verb add value if not exists 'commented_list';
