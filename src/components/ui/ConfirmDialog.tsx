import { Button, Modal } from 'react-bootstrap';

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation avant suppression (le focus est piégé puis restitué par la fenêtre modale). */
export function ConfirmDialog({ show, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal show={show} onHide={onCancel} centered aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <Modal.Header closeButton closeLabel="Fermer">
        <Modal.Title as="h2" id="confirm-title" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body id="confirm-message">{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="outline-primary" onClick={onCancel}>
          Annuler
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
