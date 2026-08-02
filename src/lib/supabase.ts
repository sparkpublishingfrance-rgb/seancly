import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Vrai quand les variables d'environnement sont renseignées.
 * Tant qu'elles ne le sont pas, l'application reste consultable : les pages
 * publiques s'affichent, seules les fonctions de compte se mettent en retrait.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export type SeanclyClient = SupabaseClient<Database>;

export const supabase: SeanclyClient | null = isSupabaseConfigured
  ? createClient<Database>(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Nécessaire au retour du lien magique, qui ramène le jeton dans l'URL.
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Client garanti, pour les appels qui n'ont aucun sens sans base.
 * L'appelant doit avoir vérifié `isSupabaseConfigured` en amont.
 */
export function requireSupabase(): SeanclyClient {
  if (!supabase) {
    throw new Error(
      "La base n'est pas configurée. Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}
