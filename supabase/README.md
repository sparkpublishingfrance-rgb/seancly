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
| 8 | `20260802000008_activity_read_scope.sql` | resserrement de la lecture d'`activity` |
| 9 | `20260802000009_activity_community_scope.sql` | lecture d'`activity` ouverte aux membres connectés, `anon` exclu |
| 10 | `20260803000010_activity_verbs_lists.sql` | deux verbes de plus, **à exécuter seule** |
| 11 | `20260803000011_list_social.sql` | `list_follows`, `list_comments`, `list_stats`, `popular_lists`, triggers |

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

## Vérification de la RLS

Le protocole se rejoue avec **deux comptes**, A et B, en passant par l'API
REST plutôt que par l'éditeur SQL : c'est le même chemin que l'application, donc
la même combinaison de droits de colonne, de policies et de fonctions. Un seul
compte ne suffit pas, la moitié des cas ci-dessous sont croisés.

Dernier passage : tous les cas au vert, y compris les cas croisés.

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
| B lit la liste privée de A, ses titres, ses commentaires | zéro ligne |
| B suit ou commente une liste privée de A | refus |
| B modifie le commentaire de A | zéro ligne affectée |
| B appelle `hide_list_comment` sur la liste de A | sans effet |
| B appelle `delete_my_list_comment` sur le commentaire de A | sans effet |
| A masque le commentaire de B sur sa liste | retiré pour tous, texte intact, `deleted_by` = A |
| B, auteur, voit encore son commentaire retiré | visible de lui seul |
| A lit l'activité publique de B sans le suivre | visible, c'est le périmètre communauté |
| Le fil des abonnements de A avant abonnement | B absent |
| A suit une liste privée de B | refus |
| A commente une liste privée de B | refus |
| A modifie le commentaire de B | zéro ligne affectée |
| B masque un commentaire sur sa liste | retiré, texte inchangé |
| A masque un commentaire sur la liste de B | sans effet |
| anon lit les commentaires d'une liste privée | zéro ligne |

Une remarque relevée en vérifiant : une fois qu'un propriétaire a masqué un
commentaire, il ne le voit plus lui-même, la policy de lecture ne couvrant que
le non supprimé ou ce dont on est l'auteur. C'est sans danger, mais cela
interdit tout retour en arrière. Ouvrir la lecture au propriétaire de la liste
serait le préalable à un « réafficher ».

Le résultat de chaque passage est à consigner dans le message de commit qui
touche à la base, conformément au standard.
