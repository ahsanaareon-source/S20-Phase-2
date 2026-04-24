import { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Download, FileText } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface DocumentDetailPanelProps {
  show: boolean;
  onHide: () => void;
  document?: any;
  onUpdateDocument?: (documentId: number | string, updates: any) => void;
  inline?: boolean;
}

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileExtension = (document: any) => {
  const fileName = document?.uploadedFileName || document?.name || '';
  const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
  return ext ? String(ext).toUpperCase() : null;
};

export default function DocumentDetailPanel({
  show,
  onHide,
  document,
  onUpdateDocument,
  inline = false
}: DocumentDetailPanelProps) {
  const [showMarkSentModal, setShowMarkSentModal] = useState(false);

  useEffect(() => {
    setShowMarkSentModal(false);
  }, [document?.id, show]);

  const isProjectDocument = document?.category === 'project';
  const canMarkSent = !isProjectDocument;
  const hasPreview = Boolean(document?.previewUrl);
  const fileExtension = getFileExtension(document);
  const fileTypeLabel = fileExtension || document?.type || 'Document';
  const uploadedLabel = document?.uploadedOn || document?.lastUpdated || '—';
  const fileSizeLabel = formatFileSize(document?.fileSizeBytes);

  const statusBadges = useMemo(() => {
    if (!document) {
      return null;
    }

    return (
      <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
        {document.status && (
          <span className="badge text-bg-light" style={{ fontSize: '12px', fontWeight: 600 }}>
            {document.status}
          </span>
        )}
        {document.stage && (
          <span className="badge text-bg-light" style={{ fontSize: '12px', fontWeight: 600 }}>
            {document.stage}
          </span>
        )}
        {document.type && (
          <span className="badge text-bg-light" style={{ fontSize: '12px', fontWeight: 600 }}>
            {document.type}
          </span>
        )}
      </div>
    );
  }, [document]);

  if (!show || !document) {
    return null;
  }

  const handleMarkSent = () => {
    if (!onUpdateDocument) {
      setShowMarkSentModal(false);
      return;
    }

    if (document.sentDate) {
      onUpdateDocument(document.id, {
        status: 'Ready to send',
        sentDate: null
      });
    } else {
      onUpdateDocument(document.id, {
        status: 'Sent',
        sentDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      });
    }

    setShowMarkSentModal(false);
  };

  const body = (
    <div className={inline ? 'card border-0 shadow-sm' : 'bg-white'}>
      <div className="p-4 p-lg-5">
        <div className="mb-4">
          <div className="border rounded-3 bg-white p-3 mb-3">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="text-muted small">Document</div>
                <div className="fw-medium">{document.uploadedFileName || document.name || '—'}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Type</div>
                <div>{fileTypeLabel}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small">Size</div>
                <div>{fileSizeLabel}</div>
              </div>
              <div className="col-md-6">
                <div className="text-muted small">Uploaded on</div>
                <div>{uploadedLabel}</div>
              </div>
              <div className="col-md-6">
                <div className="text-muted small">Uploaded by</div>
                <div>{document.lastUpdatedBy || '—'}</div>
              </div>
            </div>
          </div>

          <div className="text-muted small mb-2">Document preview</div>
          <div
            className="border rounded p-4 bg-light-subtle"
            style={{ minHeight: '420px' }}
          >
            {hasPreview ? (
              <div className="border rounded-3 bg-white overflow-hidden" style={{ minHeight: '340px', width: '100%' }}>
                <iframe
                  src={document.previewUrl}
                  title={document.name || 'Document preview'}
                  style={{ border: 0, width: '100%', height: '340px' }}
                />
              </div>
            ) : (
              <div
                className="border rounded-3 bg-white d-flex flex-column align-items-center justify-content-center text-center"
                style={{ minHeight: '240px', width: '100%' }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 mb-3"
                  style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', color: '#475569' }}
                >
                  <FileText size={18} />
                </div>
                <div className="fw-medium">{document.uploadedFileName || document.name || 'Uploaded document'}</div>
                <div className="text-muted small mt-1">Preview not available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return body;
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 1055,
          padding: '1.5rem',
          position: 'fixed',
          inset: 0,
          overflow: 'hidden'
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xxl" style={{ maxWidth: '1500px' }}>
          <div
            className="modal-content border-0 shadow-lg"
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              height: 'calc(100vh - 5rem)',
              maxHeight: 'calc(100vh - 5rem)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              className="modal-header bg-white"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                padding: '0.875rem 1.25rem',
                borderBottom: '1px solid rgba(15, 23, 42, 0.08)'
              }}
            >
              <div className="flex-grow-1 pe-3 d-flex flex-column justify-content-center">
                <h5 className="modal-title mb-0" style={{ transform: 'translateY(2px)' }}>{document.name}</h5>
                {statusBadges}
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={onHide} />
            </div>
            <div className="modal-body p-0" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {body}
            </div>
            <div
              className="modal-footer bg-white"
              style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 2,
                borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                padding: '1rem 1.5rem'
              }}
            >
              <div className="d-flex gap-2 w-100 justify-content-start">
                {canMarkSent && (
                  <button
                    className={`btn d-flex align-items-center gap-2 ${document.sentDate ? 'btn-success' : 'btn-primary'}`}
                    type="button"
                    onClick={() => setShowMarkSentModal(true)}
                  >
                    <CheckCircle2 size={16} />
                    {document.sentDate ? 'Marked sent' : 'Mark sent'}
                  </button>
                )}
                <button className="btn btn-outline-secondary d-flex align-items-center gap-2" type="button">
                  <Download size={16} />
                  Download
                </button>
                <button className="btn btn-outline-secondary d-flex align-items-center gap-2" type="button">
                  <Archive size={16} />
                  Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showMarkSentModal}
        title={document.sentDate ? 'Unmark document as sent?' : 'Mark document as sent?'}
        message={
          document.sentDate
            ? 'This will return the document to Ready to send.'
            : 'This will mark the document as sent and record today as the sent date.'
        }
        variant="info"
        confirmLabel={document.sentDate ? 'Remove sent mark' : 'Mark sent'}
        cancelLabel="Cancel"
        onCancel={() => setShowMarkSentModal(false)}
        onConfirm={handleMarkSent}
      />
    </>
  );
}
