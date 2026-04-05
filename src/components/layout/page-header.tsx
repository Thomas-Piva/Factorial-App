import React from "react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  backHref,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-4">
      {backHref && (
        <Link
          href={backHref}
          className="shrink-0 text-on-surface-variant"
          aria-label="Torna indietro"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </Link>
      )}
      <h1 className="flex-1 text-xl font-bold text-on-surface">{title}</h1>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
