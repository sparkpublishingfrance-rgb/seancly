import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { TopBar } from "./TopBar";

/** Chrome commun à toutes les pages : barre du haut, contenu, pied de page. */
export function Layout() {
  return (
    <>
      <TopBar />
      <Outlet />
      <Footer />
    </>
  );
}
