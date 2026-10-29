import { Button } from 'react-bootstrap';

interface RowActionsProps {
  /** Désignation de la ligne, utilisée dans les libellés accessibles (ex. « le don du 24/10/2026 »). */
  target: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function RowActions({ target, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="d-flex gap-1 justify-content-end">
      <Button variant="outline-secondary" size="sm" className="icon-btn" aria-label={`Modifier ${target}`} onClick={onEdit}>
        <i className="bi bi-pencil" aria-hidden="true" />
      </Button>
      <Button variant="outline-secondary" size="sm" className="icon-btn" aria-label={`Supprimer ${target}`} onClick={onDelete}>
        <i className="bi bi-trash" aria-hidden="true" />
      </Button>
    </div>
  );
}
