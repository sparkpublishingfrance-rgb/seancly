# src/api

Emplacement réservé au futur client TMDB. Vide en phase visuels.

Ce qui viendra ici :

- `tmdb.ts` : client HTTP (clé côté serveur, jamais dans le bundle), mapping des
  réponses vers `src/types/tmdb.ts`.
- `images.ts` : construction des URLs d'affiches
  (`https://image.tmdb.org/t/p/w500${poster_path}`).

Deux contraintes à ne pas perdre de vue :

- L'attribution TMDB (logo et mention) est obligatoire dès qu'on affiche leurs
  données. L'emplacement est déjà prévu dans le pied de page de l'accueil.
- TMDB exige un accord commercial dès la monétisation et interdit l'usage adossé
  à une application d'IA. La recommandation (horoscope ciné, matchbook) doit donc
  s'appuyer sur une couche de données séparée, pas sur ce client.
