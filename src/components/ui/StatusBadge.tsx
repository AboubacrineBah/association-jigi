import type { ReactNode } from 'react';

export type Tone = 'success' | 'neutral' | 'danger';

/** L'information n'est jamais portée par la couleur seule : le texte du statut est toujours affiché. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`badge rounded-pill badge-tone-${tone}`}>{children}</span>;
}
