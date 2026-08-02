import type { ReactNode } from "react";

/** Attente sobre, sans animation quand le mouvement est refusé. */
export function Spinner({ label = "Chargement" }: { label?: string }) {
  return (
    <p className="loading" role="status">
      <span className="loading__dot" aria-hidden="true" />
      {label}
    </p>
  );
}

type NoticeProps = {
  tone?: "neutral" | "error";
  children: ReactNode;
};

/** Message court en ligne, pour une erreur ou une information de section. */
export function Notice({ tone = "neutral", children }: NoticeProps) {
  return (
    <p className={`notice notice--${tone}`} role={tone === "error" ? "alert" : undefined}>
      {children}
    </p>
  );
}
