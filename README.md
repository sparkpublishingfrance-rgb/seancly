# Seancly

Application cinéma et séries : un catalogue à parcourir, une communauté tissée
dedans, et un espace créateur pour celles et ceux qui font vivre le tout.

Le projet est en construction. Rien n'est en ligne, et la marque n'est pas
encore déposée : la recherche d'antériorité INPI reste à faire.

## Ce qui existe

| Écran | Adresse | Contenu |
| --- | --- | --- |
| Accueil | `/` | Vitrine de catalogue, consultable sans compte |
| Fiche titre | `/film/:id` | Synopsis, où regarder, avertissements, casting, similaires |
| Actualité | `/actualite` | Notes et critiques de la communauté, et fil des abonnements |
| Mon espace | `/mon-espace` | Horoscope, quêtes, listes, et pour un créateur ses statistiques, sa page publique et ses partenariats |
| Vitrine créateur | `/@slug` | Page « lien en bio » publique, avec abonnement |
| Connexion | `/connexion` | Lien magique par e-mail |
| Pages légales | `/mentions-legales`, `/cgu`, `/confidentialite`, `/cookies`, `/tarifs` | Gabarits, contenu à rédiger |

## Pile technique

Vite, React et TypeScript en mode strict, React Router, et Supabase pour
l'authentification et les données. Aucune dépendance d'interface : la direction
artistique tient dans une feuille de style unique et des composants maison, y
compris les graphes.

## Démarrer

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs du projet Supabase
npm run dev
```

L'application reste consultable sans base configurée : les pages publiques
s'affichent, et seules les fonctions de compte se mettent en retrait.

```bash
npm run build   # vérification des types puis construction
npm run lint
```

## Base de données

Le schéma vit dans [`supabase/migrations/`](supabase/migrations/), appliqué à la
main via l'éditeur SQL du dashboard. Chaque migration suit le même standard :
`revoke all` puis des droits ciblés jusqu'au niveau colonne, RLS activée sur
chaque table avec des policies séparées par rôle et par opération, et toute
fonction en `security definer` avec `search_path` vide.

Le détail, les choix de conception et le protocole de vérification sont dans
[`supabase/README.md`](supabase/README.md).

## Données de films

Les affiches sont des dégradés générés et les fiches viennent d'un jeu de
données local. Le branchement de TMDB attend l'accord commercial ; d'ici là,
`title_ref` désigne ces identifiants provisoires. L'attribution TMDB a déjà sa
place réservée dans le pied de page, et la couche de recommandation restera
séparée du contenu TMDB, comme leurs conditions l'exigent.

## Conventions

Français partout, pas de tirets cadratins dans l'interface, et la voix « nous »
pour la copie produit. Le nom de la marque et le domaine ne vivent qu'à un seul
endroit, [`src/config/brand.ts`](src/config/brand.ts).
