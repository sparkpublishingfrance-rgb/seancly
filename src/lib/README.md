# src/lib

Accès bas niveau à Supabase.

- `supabase.ts` : client unique, construit à partir de `VITE_SUPABASE_URL` et
  `VITE_SUPABASE_ANON_KEY`. Il vaut `null` tant que ces variables manquent, ce
  qui laisse l'application consultable sans base. La clé `service_role` n'a
  jamais sa place ici : elle ne doit pas approcher le client.
- `database.types.ts` : types du schéma, écrits à la main et alignés sur
  `supabase/migrations/`. À régénérer avec la CLI quand elle sera branchée.

Les fonctions métier ne vivent pas ici mais dans `src/api/`, qui traduit les
lignes de la base vers les types de l'application.

Le projet Supabase est **dédié à Seancly**. Rien n'est partagé avec les bases
Librist ou Chapytre.
