import { Modal } from '../shared/Modal.jsx';
import { Button } from '../shared/Button.jsx';

export function UndoConfirmModal({ handNumber, onConfirm, onCancel, confirming }) {
  return (
    <Modal title={`Undo Hand #${handNumber}?`} onClose={onCancel}>
      <p>This will permanently remove the most recently saved hand.</p>
      <div className="play-actions">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Undoing...' : 'Undo Hand'}
        </Button>
      </div>
    </Modal>
  );
}
