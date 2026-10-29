import type { ReactNode } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';

interface PageHeaderProps {
  /** Titre unique (H1) de la vue ; il met aussi à jour `document.title`. */
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  usePageTitle(title);
  return (
    <header className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
      <div>
        <h1 className="h3 mb-1">{title}</h1>
        {subtitle ? <p className="text-body-secondary mb-0 small">{subtitle}</p> : null}
      </div>
      {actions ? <div className="d-flex gap-2 flex-wrap">{actions}</div> : null}
    </header>
  );
}
