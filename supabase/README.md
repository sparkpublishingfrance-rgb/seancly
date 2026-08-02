# Base Seancly

Projet Supabase **dédié**. Rien n'est partagé avec les bases Librist ou
Chapytre, ni schéma, ni données, ni clés.

## Application des migrations

Les migrations s'appliquent **à la main**, via l'éditeur SQL du dashboard, dans
l'ordre des noms de fichiers. Chaque fichier est relu avant exécution.

| Ordre | Fichier | Contenu |
| --- | --- | --- |
| 1 | `20260802000001_profiles.sql` | type `creator_plan`, `profiles`, `profile_private`, trigger d'inscription, `set_updated_at` |
| 2 | `20260802000002_lists.sql` | `lists`, `list_items`, aides de policy |
| 3 | `20260802000003_follows.sql` | `follows`, vue `follow_counts` |
| 4 | `20260802000004_ratings.sql` | `ratings` |
| 5 | `20260802000005_link_in_bio.sql` | `link_in_bio_items`, `register_link_click` |
| 6 | `20260802000006_public_profile_columns.sql` | lecture d'`anon` limitée aux colonnes publiques de `profiles` |
| 7 | `20260802000007_activity.sql` | `activity`, ses policies de lecture, et les triggers qui l'alimentent |

`films_catalog` et tout ce qui dépend de TMDB arrivent dans un lot ultérieur,
une fois l'accord commercial signé. En attendant, `title_ref` reste du texte
pointant vers le jeu de données mocké.

## Standard de sécurité

Chaque migration applique les mêmes règles, sans exception :

- `revoke all` sur chaque objet créé, puis des `grant` limités au strict
  nécessaire, y compris au niveau colonne quand c'est utile (`profiles.plan`,
  `link_in_bio_items.clicks`).
- Toute fonction est `security definer` avec `set search_path = ''` et des noms
  qualifiés en toutes lettres.
- RLS activée sur toutes les tables, avec des policies séparées par rôle
  (`anon`, `authenticated`) et par opération.
- Aucune table n'est laissée sans policy.

Trois choix méritent d'être signalés :

- **`birth_date` n'est pas dans `profiles`.** Les profils sont lisibles
  publiquement et la RLS filtre des lignes, pas des colonnes. La date de
  naissance vit donc dans `profile_private`, accessible au seul propriétaire, et
  n'existe qu'accompagnée de son horodatage de consentement.
- **Les clics de liens passent par une fonction.** `register_link_click` est le
  seul chemin d'écriture sur `clicks` ; personne n'a le droit `update` sur cette
  colonne, pas même le propriétaire du lien.
- **`activity` est en lecture seule pour tout le monde.** Aucun rôle client n'a
  `insert`, `update` ni `delete` dessus. Les lignes naissent et meurent avec les
  triggers posés sur `ratings`, `lists`, `list_items` et `follows`, ce qui rend
  impossible la fabrication d'un faux événement.

## Vérification manuelle de la RLS

À faire après application, avec deux comptes de test A et B créés par lien
magique. Dans l'éditeur SQL, `set role authenticated` et
`set request.jwt.claims` permettent de rejouer chaque cas sans passer par le
client.

| Cas | Attendu |
| --- | --- |
| A lit `profiles` | voit A et B |
| A lit `profile_private` de B | zéro ligne |
| A crée une liste avec `owner_id` = B | refus (violation de policy) |
| A lit une liste privée de B | zéro ligne |
| A lit une liste publique de B | visible |
| A supprime une liste de B | zéro ligne affectée |
| A insère un `follow` avec `follower_id` = B | refus |
| A modifie la note de B | zéro ligne affectée |
| A met `is_creator` à vrai sur son profil | refus, colonne non accordée |
| anon lit `link_in_bio_items` désactivés | zéro ligne |
| anon appelle `register_link_click` | compteur incrémenté |
| A insère une ligne dans `activity` | refus |
| A note un titre | un événement `rated` apparaît |
| A renote le même titre | toujours un seul événement |
| A crée une liste privée | aucun événement |
| A rend cette liste publique | un événement `created_list` apparaît |
| A se désabonne de B | l'événement `followed` disparaît |

Le résultat de ce passage est à consigner dans le message de commit qui active
la base, conformément au standard.
