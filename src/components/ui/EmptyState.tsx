import type { ReactNode } from 'react';

/** Liste vide : explique pourquoi et propose une action. */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-5" role="status">
      <p className="fw-semibold mb-1">{title}</p>
      {hint ? <p className="text-body-secondary small mb-3">{hint}</p> : null}
      {action}
    </div>
  );
}
