import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Erreur remontée à l'interface. Le message est déjà rédigé dans la voix de
 * l'application : les composants l'affichent tel quel.
 */
export class DataError extends Error {
  readonly cause?: PostgrestError;

  constructor(message: string, cause?: PostgrestError) {
    super(message);
    this.name = "DataError";
    this.cause = cause;
  }
}

type Result<T> = { data: T | null; error: PostgrestError | null };

/** Déballe une réponse PostgREST, ou lève une erreur lisible. */
export function unwrap<T>(result: Result<T>, whatFailed: string): T {
  if (result.error) {
    throw new DataError(`Nous n'avons pas réussi à ${whatFailed}.`, result.error);
  }
  if (result.data === null) {
    throw new DataError(`Nous n'avons pas réussi à ${whatFailed}.`);
  }
  return result.data;
}

/** Même chose pour les appels sans donnée en retour. */
export function unwrapVoid(result: { error: PostgrestError | null }, whatFailed: string): void {
  if (result.error) {
    throw new DataError(`Nous n'avons pas réussi à ${whatFailed}.`, result.error);
  }
}

/** Message affichable pour n'importe quelle erreur remontée d'un appel. */
export function messageOf(error: unknown): string {
  if (error instanceof DataError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Une erreur est survenue.";
}
