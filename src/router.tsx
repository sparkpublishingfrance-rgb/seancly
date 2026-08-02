import { createBrowserRouter } from "react-router-dom";
import { CreatorPublic } from "./components/CreatorPublic";
import { CreatorStudio } from "./components/CreatorStudio";
import { EmptyState } from "./components/EmptyState";
import { FilmDetail } from "./components/FilmDetail";
import { Home } from "./components/Home";
import { Layout } from "./components/Layout";
import { SignIn } from "./components/SignIn";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/film/:id", element: <FilmDetail /> },
      { path: "/studio", element: <CreatorStudio /> },
      { path: "/connexion", element: <SignIn /> },
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
