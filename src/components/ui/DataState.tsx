import type { ReactNode } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import type { ResourceState } from '../../hooks/useResource';

interface DataStateProps<T> {
  state: ResourceState<T>;
  onRetry: () => void;
  /** Libellé décrivant ce qui se charge (ex. « des dons »). */
  what: string;
  children: (data: T) => ReactNode;
}

/** États de chargement et d'erreur d'API communs à toutes les vues. */
export function DataState<T>({ state, onRetry, what, children }: DataStateProps<T>) {
  if (state.status === 'loading') {
    return (
      <div role="status" aria-live="polite" className="d-flex align-items-center gap-2 py-4">
        <Spinner animation="border" size="sm" aria-hidden="true" />
        <span>Chargement {what}…</span>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <Alert variant="danger" role="alert" className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <span>
          <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
          Impossible de charger {what}. {state.error.message}
        </span>
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      </Alert>
    );
  }
  return <>{children(state.data)}</>;
}
