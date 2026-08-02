import { createBrowserRouter } from "react-router-dom";
import { EmptyState } from "./components/EmptyState";
import { FilmDetail } from "./components/FilmDetail";
import { Home } from "./components/Home";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/film/:id", element: <FilmDetail /> },
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
