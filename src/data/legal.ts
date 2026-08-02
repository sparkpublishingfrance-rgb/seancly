/**
 * Gabarits des pages légales et institutionnelles.
 *
 * Le contenu reste à rédiger, et devra l'être avec un juriste : ces pages
 * engagent l'éditeur. On pose ici des routes réelles et le plan de chaque page,
 * pour qu'aucun lien du pied de page ne soit mort et que la conformité ne se
 * découvre pas au dernier moment.
 */
export type LegalPage = {
  slug: string;
  title: string;
  intro: string;
  /** Ce que la page devra couvrir, dans l'ordre. */
  outline: string[];
};

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "mentions-legales",
    title: "Mentions légales",
    intro:
      "Identité de l'éditeur, de l'hébergeur et du directeur de la publication, comme l'exige la loi pour la confiance dans l'économie numérique.",
    outline: [
      "Éditeur du site, forme juridique, capital, immatriculation et adresse",
      "Directeur de la publication",
      "Hébergeur et ses coordonnées",
      "Contact et médiation de la consommation",
      "Propriété intellectuelle et crédits des contenus tiers",
    ],
  },
  {
    slug: "cgu",
    title: "Conditions générales d'utilisation",
    intro:
      "Les règles du jeu entre nous et les membres : ce que le service propose, ce que nous attendons, et ce qui se passe en cas de manquement.",
    outline: [
      "Objet du service et accès au compte",
      "Engagements du membre et modération des contenus publiés",
      "Statut créateur, page publique et partenariats",
      "Formules payantes, facturation et résiliation",
      "Responsabilité, suspension et suppression de compte",
      "Droit applicable et règlement des litiges",
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    intro:
      "Quelles données nous collectons, pourquoi, combien de temps nous les gardons, et comment exercer tes droits.",
    outline: [
      "Responsable de traitement et coordonnées",
      "Données collectées, de l'adresse e-mail à la date de naissance de l'horoscope",
      "Finalités et bases légales de chaque traitement",
      "Sous-traitants, dont l'hébergement de la base et l'envoi des e-mails",
      "Durées de conservation",
      "Droits d'accès, de rectification, d'effacement et de portabilité",
      "Réclamation auprès de la CNIL",
    ],
  },
  {
    slug: "cookies",
    title: "Gestion des cookies",
    intro:
      "Ce que nous déposons sur ton appareil, et comment revenir sur ton choix à tout moment.",
    outline: [
      "Cookies strictement nécessaires, dont la session de connexion",
      "Mesure d'audience et conditions de son exemption de consentement",
      "Absence de cookies publicitaires",
      "Modification du consentement et durée de validité",
    ],
  },
  {
    slug: "tarifs",
    title: "Tarifs",
    intro:
      "Le détail des formules Gratuit, Pro et Ciné+, ce que chacune ouvre et à quel prix.",
    outline: [
      "Comparatif des trois formules",
      "Ce qui reste gratuit quoi qu'il arrive",
      "Facturation, essai et résiliation",
      "Conditions propres aux comptes créateur",
    ],
  },
];

export function legalPageBySlug(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}
