/**
 * Classement et publication d'un commentaire.
 *
 * Le client n'a plus le droit d'écrire dans `list_comments` : cette fonction
 * est le seul chemin. Elle vérifie qui appelle, fait classer le texte par
 * Claude Haiku, puis publie au statut correspondant.
 *
 * La clé d'API vit dans les secrets de la fonction, jamais dans le bundle
 * client.
 *
 * En cas d'échec technique, on publie en niveau 1 : un humain relira. Ni
 * blocage silencieux, ni laisser-passer.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.68.0";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import { DECISION_SCHEMA, SYSTEM_PROMPT } from "./prompt.ts";

/** Haiku 4.5 : le moins cher des modèles récents, et il suffit à classer. */
const MODEL = "claude-haiku-4-5";

/** Un classement tient en quelques dizaines de jetons. */
const MAX_TOKENS = 256;

const MAX_BODY = 2000;

type Decision = {
  level: 0 | 1 | 2 | 3;
  category: string;
  reason: string;
};

/** Repli quand le classement échoue : publié, mais signalé pour relecture. */
const FALLBACK: Decision = {
  level: 1,
  category: "hostilite",
  reason: "Classement automatique indisponible, relecture humaine demandée.",
};

/**
 * En-têtes du contrôle préalable.
 *
 * `x-client-info` et `x-supabase-api-version` sont envoyés par supabase-js sans
 * qu'on les demande : les omettre fait échouer la requête dans le navigateur,
 * avant même d'atteindre la fonction, alors qu'un appel direct passe très bien.
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-api-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Vrai si la valeur a bien la forme attendue, quoi qu'ait renvoyé le modèle. */
function isDecision(value: unknown): value is Decision {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.level === 0 ||
      candidate.level === 1 ||
      candidate.level === 2 ||
      candidate.level === 3) &&
    typeof candidate.category === "string" &&
    typeof candidate.reason === "string"
  );
}

async function classify(body: string): Promise<Decision> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("moderation: ANTHROPIC_API_KEY absente");
    return FALLBACK;
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      // Sortie structurée : la réponse est garantie conforme au schéma, ce qui
      // évite d'aller repêcher du JSON dans de la prose.
      output_config: {
        format: { type: "json_schema", schema: DECISION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Commentaire à classer :\n\n<commentaire>\n${body}\n</commentaire>`,
        },
      ],
    });

    // Un refus de sécurité laisse une réponse sans contenu exploitable.
    if (response.stop_reason === "refusal") {
      console.warn("moderation: refus du classifieur");
      return FALLBACK;
    }
    if (response.stop_reason === "max_tokens") {
      console.warn("moderation: réponse tronquée");
      return FALLBACK;
    }

    const text = response.content.find((block) => block.type === "text");
    if (!text || text.type !== "text") return FALLBACK;

    const parsed: unknown = JSON.parse(text.text);
    if (!isDecision(parsed)) {
      console.warn("moderation: format inattendu", text.text.slice(0, 200));
      return FALLBACK;
    }

    return parsed;
  } catch (cause) {
    // Quota, panne, réseau : on ne bloque pas le membre pour autant.
    console.error("moderation: échec de l'appel", cause);
    return FALLBACK;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "méthode non permise" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "authentification requise" }, 401);

  // Identité réelle de l'appelant, vérifiée par Supabase et non déclarée par lui.
  const asCaller = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: auth, error: authError } = await asCaller.auth.getUser();
  if (authError || !auth.user) return json({ error: "authentification requise" }, 401);

  let payload: { listId?: unknown; body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "corps de requête illisible" }, 400);
  }

  const listId = typeof payload.listId === "string" ? payload.listId : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";

  if (!listId || !body) return json({ error: "liste et texte requis" }, 400);
  if (body.length > MAX_BODY) return json({ error: "commentaire trop long" }, 400);

  const decision = await classify(body);

  // service_role : seul rôle autorisé à publier, puisque le client ne l'est plus.
  const asService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: created, error: writeError } = await asService.rpc(
    "publish_moderated_comment",
    {
      target_list: listId,
      target_author: auth.user.id,
      comment_body: body,
      decision_level: decision.level,
      decision_category: decision.category,
      decision_reason: decision.reason,
    },
  );

  if (writeError) {
    console.error("moderation: publication refusée", writeError);
    return json({ error: "Nous n'avons pas réussi à publier ton commentaire." }, 400);
  }

  if (decision.level === 3) {
    // On dit ce qui est en cause, sans détailler le fonctionnement du
    // classifieur : le décrire reviendrait à expliquer comment le contourner.
    return json({
      status: "blocked",
      message:
        "Ton commentaire n'a pas pu être publié : il enfreint nos règles sur le respect des personnes.",
    });
  }

  if (decision.level === 2) {
    return json({
      status: "hidden",
      message:
        "Ton commentaire est en cours de vérification. Il n'est pas encore visible des autres membres.",
    });
  }

  return json({ status: decision.level === 1 ? "flagged" : "visible", comment: created });
});
