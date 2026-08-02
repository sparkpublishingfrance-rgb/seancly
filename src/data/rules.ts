/**
 * Règles de la communauté.
 *
 * C'est du vrai contenu, pas un gabarit comme les pages légales : il est
 * publié tel quel. Toute modification de fond doit s'accompagner d'une mise à
 * jour de `RULES_UPDATED_AT`, sinon la date affichée ment.
 */

export type RulesItem = {
  /** Amorce en gras, quand la puce en a une. */
  lead?: string;
  text: string;
};

export type RulesBlock =
  | { type: "paragraph"; text: string }
  | { type: "lead"; lead: string; text: string }
  | { type: "list"; items: RulesItem[] };

export type RulesSection = {
  title: string;
  blocks: RulesBlock[];
};

/** Date de la dernière modification de fond, pas la date du jour. */
export const RULES_UPDATED_AT = "2026-08-03";

export const RULES_INTRO =
  "Seancly est un lieu pour aimer, discuter et partager le cinéma et les séries. Nous croyons au débat vif et aux avis tranchés : ici, on a le droit de détester un film que tout le monde adore, de démonter un chef-d'œuvre supposé, ou de défendre une œuvre méprisée. Le désaccord fait partie du plaisir.";

export const RULES_SECTIONS: RulesSection[] = [
  {
    title: "Notre esprit",
    blocks: [
      {
        type: "paragraph",
        text: "Ces règles existent pour une seule raison : que ce débat reste possible pour tout le monde. On protège la liberté de critiquer les œuvres, et on protège les personnes qui en parlent. Ce sont deux choses différentes, et c'est toute la logique de ce qui suit.",
      },
    ],
  },
  {
    title: "Le principe qui guide tout : l'œuvre, pas la personne",
    blocks: [
      { type: "paragraph", text: "La distinction la plus importante sur Seancly :" },
      {
        type: "lead",
        lead: "Critiquer une œuvre est toujours permis, même durement.",
        text: "Un film, une série, un scénario, une réalisation, une performance d'acteur en tant que travail professionnel : tu peux les trouver ratés, prétentieux, ennuyeux, et le dire franchement. « Ce film est une catastrophe », « ce réalisateur se répète depuis dix ans », « cette performance m'a paru fausse » : c'est de la critique, elle a sa place ici.",
      },
      {
        type: "lead",
        lead: "S'en prendre à une personne n'est pas permis.",
        text: "Insulter un autre membre, le harceler, l'humilier, ou viser quelqu'un pour ce qu'il est plutôt que pour ce qu'il dit : ça, non. La cible compte autant que le ton. La même virulence dirigée contre un film ou contre un membre n'a pas le même statut.",
      },
      {
        type: "paragraph",
        text: "Garde cette distinction en tête et tu seras presque toujours dans les clous.",
      },
    ],
  },
  {
    title: "Ce qui est bienvenu",
    blocks: [
      {
        type: "list",
        items: [
          { text: "Les avis sincères, même sévères, sur les œuvres." },
          {
            text: "Les critiques argumentées, les analyses, les coups de cœur comme les coups de gueule.",
          },
          {
            text: "Le désaccord respectueux entre membres : on peut ne pas être d'accord sans se manquer de respect.",
          },
          {
            text: "Les listes personnelles, les recommandations, le partage de découvertes.",
          },
          {
            text: "Parler franchement de films difficiles : la violence, les sujets durs ou tabous d'une œuvre peuvent être discutés crûment. Décrire ou débattre du contenu d'un film n'est pas en faire l'apologie.",
          },
        ],
      },
    ],
  },
  {
    title: "Ce qui n'a pas sa place",
    blocks: [
      {
        type: "list",
        items: [
          {
            lead: "Les attaques personnelles",
            text: "insultes, mépris ou hostilité visant un membre plutôt que ses idées.",
          },
          {
            lead: "Le harcèlement",
            text: "cibler quelqu'un de façon répétée, l'intimider, le suivre d'un fil à l'autre pour lui nuire.",
          },
          {
            lead: "Les propos haineux",
            text: "racisme, homophobie, transphobie, sexisme, antisémitisme, validisme, ou toute attaque visant une personne ou un groupe pour ce qu'il est.",
          },
          {
            lead: "Les menaces et l'incitation à la violence",
            text: "envers quiconque.",
          },
          {
            lead: "Le contenu sexuel non sollicité",
            text: "ou à caractère d'agression.",
          },
          {
            lead: "Le spam",
            text: "la publicité déguisée, les liens trompeurs, la manipulation de compteurs ou de classements.",
          },
          {
            lead: "Le contenu illégal",
            text: "ou qui porte atteinte aux droits d'autrui, voir notre politique de droit d'auteur.",
          },
          {
            lead: "L'usurpation d'identité",
            text: "et les faux comptes destinés à tromper ou nuire.",
          },
        ],
      },
    ],
  },
  {
    title: "Comment nous modérons",
    blocks: [
      {
        type: "paragraph",
        text: "Nous utilisons une combinaison d'outils automatiques et de relecture humaine. Selon la gravité, un contenu peut être :",
      },
      {
        type: "list",
        items: [
          {
            lead: "laissé en ligne",
            text: "lorsqu'il s'agit d'une critique légitime, même dure ;",
          },
          {
            lead: "relu par notre équipe",
            text: "lorsqu'il est limite, tout en restant visible ;",
          },
          {
            lead: "masqué",
            text: "lorsqu'il vise une personne ou enfreint clairement ces règles ;",
          },
          { lead: "refusé", text: "lorsqu'il est haineux, menaçant ou illégal." },
        ],
      },
      { type: "paragraph", text: "Quelques principes que nous nous imposons :" },
      {
        type: "list",
        items: [
          {
            text: "Dans le doute entre « dur mais légitime » et « problématique », nous penchons pour laisser s'exprimer, quitte à relire ensuite. Nous ne voulons pas censurer la critique.",
          },
          {
            text: "Masquer un commentaire ne le réécrit jamais : nous n'altérons pas les propos des membres.",
          },
          {
            text: "Les décisions automatiques peuvent se tromper. Si tu penses qu'un de tes contenus a été modéré à tort, écris-nous et nous le relirons.",
          },
        ],
      },
    ],
  },
  {
    title: "Signaler un contenu",
    blocks: [
      {
        type: "paragraph",
        // Le bouton de signalement n'existe pas encore : on donne le chemin qui
        // marche aujourd'hui plutôt que d'annoncer une fonction absente.
        text: "Si un contenu enfreint ces règles, écris-nous. Les signalements sont examinés par notre équipe. Signaler de façon abusive ou massive pour faire taire quelqu'un est en soi un manquement à ces règles.",
      },
    ],
  },
  {
    title: "En cas de manquement",
    blocks: [
      {
        type: "paragraph",
        text: "Selon la gravité et la répétition, nous pouvons masquer un contenu, avertir un membre, restreindre certaines fonctions, suspendre ou fermer un compte. Nous tenons compte du contexte et de l'intention autant que possible.",
      },
    ],
  },
  {
    title: "Ces règles évoluent",
    blocks: [
      {
        type: "paragraph",
        text: "Notre communauté grandit et ces règles s'ajusteront avec elle. Les changements importants seront signalés. En utilisant Seancly, tu acceptes de respecter ces règles.",
      },
    ],
  },
];
