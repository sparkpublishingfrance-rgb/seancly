# src/api

Couche d'accès aux données. Chaque fonction renvoie les **types de
l'application** (`CreatorProfile`, `CreatorList`, `LinkInBioItem`...), jamais des
lignes brutes : les composants ne savent pas d'où viennent leurs données.

| Fichier | Rôle |
| --- | --- |
| `client.ts` | `DataError` et déballage des réponses PostgREST, avec des messages déjà rédigés |
| `profiles.ts` | profil du compte et profils publics |
| `lists.ts` | listes et contenu des listes |
| `links.ts` | liens de la page créateur, et comptage des clics |
| `ratings.ts` | notes en demi-étoiles |
| `follows.ts` | abonnements et compteurs |

Le client Supabase lui-même vit dans `src/lib/`.

## Ce qui reste à venir ici

Le client TMDB, quand l'accord commercial sera signé : `tmdb.ts` pour les
appels, et le mapping vers `src/types/tmdb.ts`. Deux contraintes à ne pas perdre
de vue à ce moment-là :

- L'attribution TMDB, logo compris, est obligatoire dès qu'on affiche leurs
  données. L'emplacement est déjà prévu dans le pied de page.
- TMDB interdit l'usage adossé à une application d'IA. La recommandation
  (horoscope ciné, matchbook) devra s'appuyer sur une couche séparée, jamais sur
  ce client.

En attendant, les films restent lus depuis `src/data/titles.ts`, et `title_ref`
désigne ces identifiants mockés.
