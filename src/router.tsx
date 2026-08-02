import { Navigate, createBrowserRouter } from "react-router-dom";
import { CreatorPublic } from "./components/CreatorPublic";
import { EmptyState } from "./components/EmptyState";
import { Feed } from "./components/Feed";
import { FilmDetail } from "./components/FilmDetail";
import { Home } from "./components/Home";
import { Layout } from "./components/Layout";
import { LegalPage } from "./components/LegalPage";
import { MySpace } from "./components/MySpace";
import { SignIn } from "./components/SignIn";
import { LEGAL_PAGES } from "./data/legal";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/film/:id", element: <FilmDetail /> },
      { path: "/fil", element: <Feed /> },
      { path: "/mon-espace", element: <MySpace /> },
      // « Studio » est devenu « Mon espace » au lot 6. On garde l'ancienne
      // adresse vivante, elle circule déjà dans des liens.
      { path: "/studio", element: <Navigate to="/mon-espace" replace /> },
      { path: "/connexion", element: <SignIn /> },

      // Pages légales et institutionnelles, gabarits mais routes réelles.
      ...LEGAL_PAGES.map((page) => ({
        path: `/${page.slug}`,
        element: <LegalPage page={page} />,
      })),

      // L'arobase reste dans l'URL, c'est la signature d'un lien en bio. Le
      // routeur n'accepte pas de paramètre partiel (`/@:slug`), donc l'arobase
      // fait partie du paramètre et `CreatorPublic` le retire lui-même.
      { path: "/:slug", element: <CreatorPublic /> },
      {
        path: "*",
        element: (
          <EmptyState
            title="Cette page n'existe pas"
            body="Le lien que tu as suivi ne mène nulle part."
          />
        ),
      },
    ],
  },
]);
