import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'warning' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  show,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!show) {
    return null;
  }

  const confirmClassName = variant === 'danger' ? 'btn-danger' : 'btn-warning';
  const iconColor = variant === 'danger' ? '#dc3545' : '#f59e0b';

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1080 }}
      onClick={onCancel}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={18} style={{ color: iconColor }} />
              <h5 className="modal-title mb-0">{title}</h5>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className={`btn ${confirmClassName}`} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
