import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  FileText,
  Info,
  MessageSquare,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  Users,
  X
} from 'lucide-react';
import type { Observation } from '@/types';
import ConfirmationModal from './ConfirmationModal';

interface DocumentDetailPanelProps {
  show: boolean;
  onHide: () => void;
  document?: any;
  onUpdateDocument?: (documentId: number | string, updates: any) => void;
  inline?: boolean;
  observations?: Observation[];
  leaseholderRecords?: Array<{ id: string; name: string; unit: string; avatar: string; postalAddress?: string }>;
  onCreateObservation?: (
    document: any,
    form: {
      leaseholderId: string;
      channel: Observation['channel'];
      message: string;
      isObjection: boolean;
    }
  ) => void;
  onUpdateObservation?: (
    observationId: string,
    form: {
      leaseholderId: string;
      channel: Observation['channel'];
      message: string;
      isObjection: boolean;
    }
  ) => void;
  onDeleteObservation?: (observationId: string) => void;
  onObservationStatusChange?: (observationId: string, status: Observation['status']) => void;
}

export default function DocumentDetailPanel({
  show,
  onHide,
  document,
  onUpdateDocument,
  inline = false,
  observations = [],
  leaseholderRecords = [],
  onCreateObservation,
  onUpdateObservation,
  onDeleteObservation,
  onObservationStatusChange
}: DocumentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'observations'>('document');
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [responseFilter, setResponseFilter] = useState<'all' | 'objections' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [observationPage, setObservationPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'leaseholder' | 'property' | 'response' | 'channel' | 'received'>('received');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<null | { type: 'close' | 'delete'; observationId?: string }>(null);
  const [documentTemplateName, setDocumentTemplateName] = useState('');
  const [documentBody, setDocumentBody] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showPostalPackModal, setShowPostalPackModal] = useState(false);
  const [showMarkSentModal, setShowMarkSentModal] = useState(false);
  const [regenerationReason, setRegenerationReason] = useState('');
  const [observationForm, setObservationForm] = useState({
    leaseholderId: '',
    channel: 'email' as Observation['channel'],
    message: '',
    isObjection: false
  });

  useEffect(() => {
    setActiveTab('document');
    setShowObservationForm(false);
    setResponseFilter('all');
    setSearchQuery('');
    setObservationPage(1);
    setSortColumn('received');
    setSortDirection('desc');
    setEditingObservationId(null);
    setIsEditingTemplate(false);
    setShowPostalPackModal(false);
    setShowMarkSentModal(false);
    setRegenerationReason('');
    setDocumentTemplateName(document?.templateName || 'Standard consultation wording');
    setDocumentBody(
      document?.body ||
      `To: {{leaseholder_name}}
Property: {{leaseholder_property}}
Postal address: {{postal_address}}
And: [Recognised Tenants' Association, if applicable]

Section 20 Consultation Notice (Draft)
Stage: ${document?.stage || 'Consultation'}
Premises: [Building / block name]
Landlord or Manager: [Entity name]

1. This notice is issued as part of the statutory consultation process for qualifying works.

2. Summary of the proposed works:
[Insert scope summary]

3. Reasons for the works:
[Insert reasons]

4. Written observations should be sent to:
[Insert postal / email address]

5. Consultation deadline (30 days from service):
{{consultation_deadline}}

Signed: [Name]
For and on behalf of: [Landlord / Manager / Authorised Agent]
Date of notice: [Insert date]`
    );
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false
    });
  }, [document?.id, show]);

  useEffect(() => {
    setObservationForm(prev => {
      if (prev.leaseholderId || !leaseholderRecords[0]?.id) {
        return prev;
      }

      return {
        ...prev,
        leaseholderId: leaseholderRecords[0].id
      };
    });
  }, [leaseholderRecords]);

  useEffect(() => {
    setObservationPage(1);
  }, [responseFilter, searchQuery]);

  if (!show || !document) {
    return null;
  }

  const isProjectDocument = document.category === 'project';
  const isUploadedConsultationDocument = !isProjectDocument && document.contentSource === 'upload';
  const isTemplateConsultationDocument = !isProjectDocument && !isUploadedConsultationDocument;
  const hasGeneratedPostalPack = Boolean(document.postalPackGeneratedAt);
  const canGeneratePostalPack = isTemplateConsultationDocument && !isEditingTemplate && !document.sentDate;
  const canMarkSent =
    !isProjectDocument &&
    !document.sentDate &&
    (isUploadedConsultationDocument || hasGeneratedPostalPack);
  const isLeaseholderNotice = !isProjectDocument && document.recipients?.some((recipient: any) => recipient.label === 'Leaseholders');
  const leaseholderRecipientCount = document.recipients?.find((recipient: any) => recipient.label === 'Leaseholders')?.count || 0;
  const postalRecipients = leaseholderRecords.slice(0, leaseholderRecipientCount || leaseholderRecords.length);
  const recipientsWithAddress = postalRecipients.filter(recipient => Boolean(recipient.postalAddress?.trim()));
  const recipientsMissingAddress = postalRecipients.filter(recipient => !recipient.postalAddress?.trim());
  const documentObservations = observations.filter(observation => observation.documentId === document.id);
  const respondedCount = new Set(documentObservations.map(observation => observation.leaseholderId)).size;
  const generationSummary = document.postalPackGeneratedAt
    ? `${document.postalPackGeneratedAt} by ${document.postalPackGeneratedBy || 'Unknown user'}`
    : null;

  const observationRows = documentObservations.map(observation => {
    const leaseholder = leaseholderRecords.find(record => record.id === observation.leaseholderId);
    return {
      ...observation,
      unit: leaseholder?.unit || '',
      avatar: leaseholder?.avatar || ''
    };
  });

  const filteredObservationRows = observationRows.filter(row => {
    const query = searchQuery.trim().toLowerCase();
    if (query && !`${row.leaseholderName} ${row.unit} ${row.message}`.toLowerCase().includes(query)) {
      return false;
    }
    if (responseFilter === 'objections' && !row.isObjection) {
      return false;
    }
    if (responseFilter === 'general' && row.isObjection) {
      return false;
    }
    return true;
  });

  const sortedObservationRows = [...filteredObservationRows].sort((a, b) => {
    const getValue = (row: typeof observationRows[number]) => {
      switch (sortColumn) {
        case 'leaseholder':
          return row.leaseholderName.toLowerCase();
        case 'property':
          return row.unit.toLowerCase();
        case 'response':
          return row.message.toLowerCase();
        case 'channel':
          return getChannelLabel(row.channel).toLowerCase();
        case 'received':
          return new Date(row.receivedOn).getTime();
        default:
          return '';
      }
    };

    const aValue = getValue(a);
    const bValue = getValue(b);

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const observationRowsPerPage = 10;
  const totalObservationPages = Math.max(1, Math.ceil(sortedObservationRows.length / observationRowsPerPage));
  const paginatedObservationRows = sortedObservationRows.slice(
    (observationPage - 1) * observationRowsPerPage,
    observationPage * observationRowsPerPage
  );

  const formatObservationDate = (value: string) =>
    new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  const getChannelLabel = (channel: Observation['channel']) =>
    channel === 'internal-note' ? 'Internal note' : channel.charAt(0).toUpperCase() + channel.slice(1);

  const hasUnsavedObservationDraft =
    showObservationForm &&
    (observationForm.message.trim().length > 0 || observationForm.isObjection);

  const handleClose = () => {
    if (hasUnsavedObservationDraft) {
      setPendingConfirmation({ type: 'close' });
      return;
    }

    onHide();
  };

  const handleSaveObservation = () => {
    if (!observationForm.leaseholderId || !observationForm.message.trim()) {
      return;
    }

    if (editingObservationId) {
      onUpdateObservation?.(editingObservationId, observationForm);
    } else {
      onCreateObservation?.(document, observationForm);
    }

    setShowObservationForm(false);
    setEditingObservationId(null);
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false
    });
  };

  const handleSort = (column: typeof sortColumn) => {
    setObservationPage(1);
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'leaseholder' || column === 'property' || column === 'channel' ? 'asc' : 'desc');
  };

  const handleEditObservation = (observation: Observation) => {
    setEditingObservationId(observation.id);
    setShowObservationForm(true);
    setObservationForm({
      leaseholderId: observation.leaseholderId,
      channel: observation.channel,
      message: observation.message,
      isObjection: observation.isObjection
    });
  };

  const handleDeleteObservation = (observationId: string) => {
    setPendingConfirmation({ type: 'delete', observationId });
  };

  const confirmDeleteObservation = (observationId: string) => {
    if (editingObservationId === observationId) {
      setEditingObservationId(null);
      setShowObservationForm(false);
      setObservationForm({
        leaseholderId: leaseholderRecords[0]?.id || '',
        channel: 'email',
        message: '',
        isObjection: false
      });
    }

    onDeleteObservation?.(observationId);
  };

  const handleCancelObservationForm = () => {
    setShowObservationForm(false);
    setEditingObservationId(null);
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false
    });
  };

  const handleSaveDocumentContent = () => {
    if (!document?.id || !onUpdateDocument) {
      return;
    }

    onUpdateDocument(document.id, {
      templateName: documentTemplateName.trim() || 'Standard consultation wording',
      body: documentBody.trim(),
      lastUpdated: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      lastUpdatedBy: 'Ahsan Jalil'
    });
    setIsEditingTemplate(false);
  };

  const handleGeneratePostalPack = () => {
    if (!document?.id || !onUpdateDocument) {
      return;
    }

    const nextVersion = (document.postalPackVersion || 0) + 1;
    const generatedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    onUpdateDocument(document.id, {
      status: 'Postal pack generated',
      postalPackGeneratedAt: generatedAt,
      postalPackGeneratedBy: 'Ahsan Jalil',
      postalPackVersion: nextVersion,
      postalPackLeaseholderCount: recipientsWithAddress.length,
      postalPackReason: hasGeneratedPostalPack ? regenerationReason : null,
      lastUpdated: generatedAt,
      lastUpdatedBy: 'Ahsan Jalil'
    });

    setShowPostalPackModal(false);
    setRegenerationReason('');
  };

  const handleMarkAsSent = () => {
    if (!document?.id || !onUpdateDocument) {
      return;
    }

    const sentAt = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const updatedAt = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    onUpdateDocument(document.id, {
      status: 'Sent',
      sentDate: sentAt,
      isOverdue: false,
      isDueSoon: false,
      lastUpdated: updatedAt,
      lastUpdatedBy: 'Ahsan Jalil'
    });

    setShowMarkSentModal(false);
  };

  const aiObservations = (() => {
    const items: Array<{
      id: string;
      tone: 'warning' | 'info' | 'success';
      title: string;
      detail: string;
    }> = [];

    if (document.isOverdue && !document.sentDate) {
      items.push({
        id: 'overdue-send',
        tone: 'warning',
        title: 'Notice is overdue to send',
        detail: `This document is still unsent and has a due date of ${document.dueDate}.`
      });
    }

    if (document.status === 'Awaiting approval') {
      items.push({
        id: 'awaiting-approval',
        tone: 'warning',
        title: 'Approval is blocking issue',
        detail: 'This document cannot be served until the required approval is completed.'
      });
    }

    if (document.status === 'Draft') {
      items.push({
        id: 'draft',
        tone: 'info',
        title: 'Document is still in draft',
        detail: 'Content and recipients should be checked before this is moved to issue.'
      });
    }

    if (isLeaseholderNotice && document.sentDate && documentObservations.length === 0) {
      items.push({
        id: 'no-responses',
        tone: 'info',
        title: 'No leaseholder observations logged yet',
        detail: 'No responses have been captured against this issued notice so far.'
      });
    }

    if (isLeaseholderNotice && respondedCount > 0) {
      items.push({
        id: 'responses-logged',
        tone: 'success',
        title: 'Responses are being tracked',
        detail: `${respondedCount} leaseholder${respondedCount === 1 ? '' : 's'} have a logged response against this notice.`
      });
    }

    if (!items.length) {
      items.push({
        id: 'no-flags',
        tone: 'success',
        title: 'No immediate issues flagged',
        detail: 'This document currently has no obvious workflow or consultation issues.'
      });
    }

    return items;
  })();

  const getAiToneStyles = (tone: 'warning' | 'info' | 'success') => {
    if (tone === 'warning') {
      return {
        containerStyle: {
          backgroundColor: '#f2e8be',
          border: '2px solid #f0ab00',
          color: '#8a4b1f'
        },
        icon: <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
      };
    }

    if (tone === 'success') {
      return {
        containerStyle: {
          backgroundColor: '#d9e4f7',
          border: '2px solid #5b9bff',
          color: '#24428f'
        },
        icon: <CheckCircle2 size={22} style={{ color: '#2563eb' }} />
      };
    }

    return {
      containerStyle: {
        backgroundColor: '#d9e4f7',
        border: '2px solid #5b9bff',
        color: '#24428f'
      },
      icon: <Info size={22} style={{ color: '#2563eb' }} />
    };
  };

  const statusBadges = (
    <div className="d-flex gap-2 flex-wrap">
      {document.status && (
        <span className="badge text-bg-light">{document.status}</span>
      )}
      <span className="badge text-bg-secondary">{document.type}</span>
      {document.stage && <span className="badge text-bg-primary">{document.stage}</span>}
    </div>
  );

  const aiSuggestionsSection = (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-4">
          <Sparkles size={20} style={{ color: '#7c3aed' }} />
          <h5 className="mb-0">AI Suggestions</h5>
        </div>

        <div className="d-flex flex-column gap-3">
          {aiObservations.map(item => {
            const tone = getAiToneStyles(item.tone);
            return (
              <div
                key={item.id}
                className="px-3 py-3"
                style={{ ...tone.containerStyle, borderRadius: '18px' }}
              >
                <div className="d-flex align-items-start gap-3">
                  <div className="mt-1 flex-shrink-0">{tone.icon}</div>
                  <div style={{ fontSize: '15px', lineHeight: 1.5, fontWeight: 500 }}>
                    <span>{item.title}</span>
                    <span>{item.detail ? ` ${item.detail}` : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const body = (
    <div className={inline ? 'card border-0 shadow-sm' : 'bg-white'}>
      {inline ? (
        <div className="px-4 px-lg-5 pt-4 pt-lg-5">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div className="flex-grow-1">
              <h4 className="mb-2">{document.name}</h4>
              {statusBadges}
            </div>
            <button className="btn btn-link text-dark p-0" onClick={handleClose} aria-label="Close document">
              <X size={18} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="p-4 p-lg-5">

        {isLeaseholderNotice && (
          <div
            className="mb-4"
            style={{
              backgroundColor: '#3b82c4',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              paddingLeft: '1.5rem'
            }}
          >
            <ul className="nav mb-0" role="tablist" style={{ gap: '0' }}>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'document'}
                  className="nav-link border-0"
                  onClick={() => setActiveTab('document')}
                  style={{
                    backgroundColor: activeTab === 'document' ? '#ffffff' : '#3b82c4',
                    color: activeTab === 'document' ? '#000000' : '#ffffff',
                    borderRadius: '0',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '400',
                    borderLeft: activeTab === 'document' ? '3px solid #ffffff' : 'none'
                  }}
                >
                  Document
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'observations'}
                  className="nav-link border-0"
                  onClick={() => setActiveTab('observations')}
                  style={{
                    backgroundColor: activeTab === 'observations' ? '#ffffff' : '#3b82c4',
                    color: activeTab === 'observations' ? '#000000' : '#ffffff',
                    borderRadius: '0',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '400',
                    borderLeft: activeTab === 'observations' ? '3px solid #ffffff' : 'none'
                  }}
                >
                  Observations
                </button>
              </li>
            </ul>
          </div>
        )}

        {(activeTab === 'document' || !isLeaseholderNotice) && (
          <>
            {aiSuggestionsSection}

            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Type</div>
                  <div>{document.type}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Last updated</div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={16} className="text-muted" />
                    <span>{document.lastUpdated || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Sent on</div>
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={16} className="text-muted" />
                    <span>{document.sentDate || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Leaseholders</div>
                  <div className="d-flex align-items-center gap-2">
                    <Users size={16} className="text-muted" />
                    <span>
                      {leaseholderRecipientCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isTemplateConsultationDocument && (
              <div className="mb-4">
                {hasGeneratedPostalPack && (
                  <div className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8fafc', borderColor: '#dbe4f0' }}>
                    <div className="d-flex align-items-start gap-2">
                      <ClipboardList size={18} style={{ color: '#334155', marginTop: '2px' }} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ color: '#0f172a' }}>
                          Postal pack generated
                        </div>
                        <div className="small" style={{ color: '#475569' }}>
                          {generationSummary}
                        </div>
                        <div className="small mt-1" style={{ color: '#475569' }}>
                          Pack v{document.postalPackVersion || 1} for {document.postalPackLeaseholderCount || 0} leaseholder{(document.postalPackLeaseholderCount || 0) === 1 ? '' : 's'}.
                        </div>
                        {document.postalPackReason && (
                          <div className="small mt-1" style={{ color: '#475569' }}>
                            Regeneration reason: {document.postalPackReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-muted small">Document content</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge text-bg-light">{documentTemplateName || 'Standard consultation wording'}</span>
                  </div>
                </div>
                <textarea
                  className="form-control"
                  rows={8}
                  value={documentBody}
                  onChange={(event) => setDocumentBody(event.target.value)}
                  disabled={!isEditingTemplate}
                />
                <div className="d-flex justify-content-end mt-2">
                  {!isEditingTemplate ? (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      type="button"
                      onClick={() => setIsEditingTemplate(true)}
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={() => {
                          setDocumentBody(
                            document?.body ||
                              `To: {{leaseholder_name}}
Property: {{leaseholder_property}}
Postal address: {{postal_address}}
And: [Recognised Tenants' Association, if applicable]

Section 20 Consultation Notice (Draft)
Stage: ${document?.stage || 'Consultation'}
Premises: [Building / block name]
Landlord or Manager: [Entity name]

1. This notice is issued as part of the statutory consultation process for qualifying works.

2. Summary of the proposed works:
[Insert scope summary]

3. Reasons for the works:
[Insert reasons]

4. Written observations should be sent to:
[Insert postal / email address]

5. Consultation deadline (30 days from service):
{{consultation_deadline}}

Signed: [Name]
For and on behalf of: [Landlord / Manager / Authorised Agent]
Date of notice: [Insert date]`
                          );
                          setIsEditingTemplate(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" type="button" onClick={handleSaveDocumentContent}>
                        Save content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isUploadedConsultationDocument && (
              <div className="alert alert-secondary mb-4 d-flex align-items-start gap-2">
                <Info size={16} className="mt-1" />
                <div className="small">
                  Postal pack generation is available only for template-based documents. Uploaded documents can be downloaded and posted manually.
                </div>
              </div>
            )}

            {(isProjectDocument || isUploadedConsultationDocument) && (
              <div className="mb-4">
                <div className="text-muted small mb-2">Preview</div>
                <div className="border rounded p-4 bg-light-subtle" style={{ minHeight: '420px' }}>
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <div className="fw-semibold">Fixflo Property Management</div>
                      <div className="text-muted small">123 Management Street, London, SE1 9RY</div>
                    </div>
                    <div className="text-muted small">{document.sentDate || document.lastUpdated || '25/11/2025'}</div>
                  </div>

                  <h5 className="mb-3">{document.name}</h5>
                  {isUploadedConsultationDocument ? (
                    <div className="border rounded bg-white p-3">
                      <div className="fw-medium mb-1">{document.uploadedFileName || 'Uploaded document'}</div>
                      <div className="text-muted small">
                        This is an uploaded custom document. Use download to view the original file content.
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '780px', lineHeight: 1.7 }}>
                      {(documentBody || '').split(/\n{2,}/).filter(Boolean).map((paragraph, index, paragraphs) => (
                        <p key={`${paragraph}-${index}`} className={index === paragraphs.length - 1 ? 'mb-0' : undefined}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="d-flex gap-2">
              {isTemplateConsultationDocument && (
                <button
                  className="btn btn-outline-primary d-flex align-items-center gap-2"
                  type="button"
                  onClick={() => {
                    if (!canGeneratePostalPack) {
                      return;
                    }
                    setShowPostalPackModal(true);
                  }}
                  disabled={!canGeneratePostalPack}
                >
                  <Printer size={16} />
                  {hasGeneratedPostalPack ? 'Regenerate postal pack' : 'Generate postal pack'}
                </button>
              )}
              {!isProjectDocument && (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2"
                  type="button"
                  onClick={() => setShowMarkSentModal(true)}
                  disabled={!canMarkSent}
                >
                  <CheckCircle2 size={16} />
                  {document.sentDate ? 'Sent' : 'Mark sent'}
                </button>
              )}
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Download size={16} />
                Download
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                <Archive size={16} />
                Archive
              </button>
            </div>
          </>
        )}

        {activeTab === 'observations' && isLeaseholderNotice && (
          <>
            {aiSuggestionsSection}

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Leaseholders</div>
                  <div className="fs-4 fw-semibold">{leaseholderRecords.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Responses logged</div>
                  <div className="fs-4 fw-semibold">{documentObservations.length}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Awaiting response</div>
                  <div className="fs-4 fw-semibold">{Math.max(leaseholderRecords.length - respondedCount, 0)}</div>
                </div>
              </div>
            </div>

            {showObservationForm && (
              <div className="border rounded p-3 mb-4 bg-light">
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label">Leaseholder</label>
                    <select
                      className="form-select"
                      value={observationForm.leaseholderId}
                      onChange={(e) => setObservationForm(prev => ({ ...prev, leaseholderId: e.target.value }))}
                    >
                      {leaseholderRecords.map(leaseholder => (
                        <option key={leaseholder.id} value={leaseholder.id}>
                          {leaseholder.name} · {leaseholder.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Channel</label>
                    <select
                      className="form-select"
                      value={observationForm.channel}
                      onChange={(e) => setObservationForm(prev => ({ ...prev, channel: e.target.value as Observation['channel'] }))}
                    >
                      <option value="email">Email</option>
                      <option value="post">Post</option>
                      <option value="phone">Phone</option>
                      <option value="portal">Portal</option>
                      <option value="internal-note">Internal note</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check mb-2">
                      <input
                        id="objection-flag"
                        className="form-check-input"
                        type="checkbox"
                        checked={observationForm.isObjection}
                        onChange={(e) => setObservationForm(prev => ({ ...prev, isObjection: e.target.checked }))}
                      />
                      <label htmlFor="objection-flag" className="form-check-label">
                        Objection
                      </label>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Response</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={observationForm.message}
                      onChange={(e) => setObservationForm(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-outline-secondary" type="button" onClick={handleCancelObservationForm}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleSaveObservation}>
                    {editingObservationId ? 'Save changes' : 'Save response'}
                  </button>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                <select
                  className="form-select"
                  style={{ width: '170px' }}
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value as typeof responseFilter)}
                  aria-label="Filter responses"
                >
                  <option value="all">All responses</option>
                  <option value="general">General responses</option>
                  <option value="objections">Objections</option>
                </select>
                <div className="input-group" style={{ width: '320px', maxWidth: '100%' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search leaseholder or flat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button
                className={`btn ${showObservationForm ? 'btn-outline-secondary' : 'btn-primary'} d-flex align-items-center gap-2 ms-auto`}
                type="button"
                onClick={() => {
                  if (showObservationForm) {
                    handleCancelObservationForm();
                    return;
                  }
                  setEditingObservationId(null);
                  setObservationForm({
                    leaseholderId: leaseholderRecords[0]?.id || '',
                    channel: 'email',
                    message: '',
                    isObjection: false
                  });
                  setShowObservationForm(true);
                }}
              >
                <Plus size={16} />
                {showObservationForm ? 'Close' : 'Log response'}
              </button>
            </div>

            {sortedObservationRows.length === 0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <MessageSquare size={40} className="text-muted mb-3 opacity-50 d-block mx-auto" />
                  <h5 className="mb-2">
                    {documentObservations.length === 0 ? 'No responses logged yet' : 'No responses match this filter'}
                  </h5>
                  <p className="text-muted mb-0">
                    {documentObservations.length === 0
                      ? 'Responses for this notice will appear here once leaseholder observations are logged.'
                      : 'Try changing the filter or search term to see more responses.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('leaseholder')}>
                        <div className="d-flex align-items-center gap-1">
                          Leaseholder
                          {sortColumn === 'leaseholder' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('property')}>
                        <div className="d-flex align-items-center gap-1">
                          Property
                          {sortColumn === 'property' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('response')}>
                        <div className="d-flex align-items-center gap-1">
                          Response
                          {sortColumn === 'response' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </div>
                      </th>
                      <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('channel')}>
                        <div className="d-flex align-items-center gap-1">
                          Channel
                          {sortColumn === 'channel' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                        </div>
                      </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('received')}>
                      <div className="d-flex align-items-center gap-1">
                        Received
                        {sortColumn === 'received' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                      </div>
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedObservationRows.map(row => (
                      <tr key={row.id}>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>
                          <div className="fw-semibold">{row.leaseholderName}</div>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>
                          <div className="text-muted small">{row.unit || '—'}</div>
                        </td>
                        <td style={{ width: '420px', maxWidth: '420px', verticalAlign: 'middle', height: '72px' }}>
                          <div
                            style={{
                              height: '48px',
                              minHeight: '48px',
                              maxHeight: '48px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}
                          >
                            <div
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.35,
                                height: '2.7em',
                                maxHeight: '2.7em',
                                paddingRight: row.isObjection ? '88px' : '0'
                              }}
                              title={row.message}
                            >
                              {row.message}
                            </div>
                            {row.isObjection && (
                              <span
                                className="badge text-bg-danger"
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  bottom: 0
                                }}
                              >
                                Objection
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>{getChannelLabel(row.channel)}</td>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>{formatObservationDate(row.receivedOn)}</td>
                        <td style={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle', height: '72px' }}>
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEditObservation(row)}
                              aria-label={`Edit response for ${row.leaseholderName}`}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteObservation(row.id)}
                              aria-label={`Delete response for ${row.leaseholderName}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}

            {sortedObservationRows.length > observationRowsPerPage && (
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">
                <div className="text-muted small">
                  Showing {Math.min((observationPage - 1) * observationRowsPerPage + 1, sortedObservationRows.length)}-
                  {Math.min(observationPage * observationRowsPerPage, sortedObservationRows.length)} of {sortedObservationRows.length}
                </div>
                <nav aria-label="Observation pagination">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${observationPage === 1 ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setObservationPage(prev => Math.max(prev - 1, 1))}
                        disabled={observationPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalObservationPages }, (_, index) => index + 1).map(page => (
                      <li key={page} className={`page-item ${observationPage === page ? 'active' : ''}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setObservationPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${observationPage === totalObservationPages ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setObservationPage(prev => Math.min(prev + 1, totalObservationPages))}
                        disabled={observationPage === totalObservationPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (inline) {
    return body;
  }

  return (
    <>
      <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055, padding: '2rem 1rem' }}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xxl" style={{ maxWidth: '1500px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
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
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <div className="modal-body p-0" style={{ maxHeight: 'calc(100vh - 11rem)', overflowY: 'auto' }}>{body}</div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={pendingConfirmation !== null}
        title={pendingConfirmation?.type === 'delete' ? 'Delete response?' : 'Discard unsaved response?'}
        message={
          pendingConfirmation?.type === 'delete'
            ? 'This response will be removed from the observations log.'
            : 'You have an unsaved response in progress. Closing now will discard those changes.'
        }
        confirmLabel={pendingConfirmation?.type === 'delete' ? 'Delete response' : 'Discard changes'}
        variant={pendingConfirmation?.type === 'delete' ? 'danger' : 'warning'}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => {
          if (pendingConfirmation?.type === 'delete' && pendingConfirmation.observationId) {
            confirmDeleteObservation(pendingConfirmation.observationId);
          }
          if (pendingConfirmation?.type === 'close') {
            onHide();
          }
          setPendingConfirmation(null);
        }}
      />
      <ConfirmationModal
        show={showPostalPackModal}
        title={hasGeneratedPostalPack ? 'Regenerate postal pack?' : 'Generate postal pack?'}
        message={
          <div>
            <p className="mb-2">
              {recipientsMissingAddress.length > 0
                ? `${recipientsWithAddress.length} of ${postalRecipients.length} leaseholders have valid postal addresses. ${recipientsMissingAddress.length} leaseholder${recipientsMissingAddress.length === 1 ? '' : 's'} will be excluded until their address is added.`
                : `This will generate one print-ready pack from a single document for ${postalRecipients.length} leaseholders.`}
            </p>
            {hasGeneratedPostalPack && (
              <>
                <div className="small text-muted mb-2">
                  A postal pack has already been generated for this document. Regenerate only if the earlier pack should no longer be used.
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason for regeneration</label>
                  <select
                    className="form-select"
                    value={regenerationReason}
                    onChange={(event) => setRegenerationReason(event.target.value)}
                  >
                    <option value="">Select a reason</option>
                    <option value="Address correction">Address correction</option>
                    <option value="Content changed">Content changed</option>
                    <option value="Print failure">Print failure</option>
                    <option value="Mailing not completed">Mailing not completed</option>
                    <option value="Other operational reason">Other operational reason</option>
                  </select>
                </div>
              </>
            )}
            <div className="small text-muted">
              Auto-filled from system records:
            </div>
            <ul className="small mb-0 mt-1 ps-3">
              <li><code>{'{{leaseholder_name}}'}</code> from leaseholder name</li>
              <li><code>{'{{leaseholder_property}}'}</code> from flat/unit</li>
              <li><code>{'{{postal_address}}'}</code> from leaseholder postal address</li>
              <li><code>{'{{consultation_deadline}}'}</code> from document due-to-send date</li>
            </ul>
          </div>
        }
        variant={recipientsMissingAddress.length > 0 ? 'warning' : 'info'}
        confirmLabel={hasGeneratedPostalPack ? 'Regenerate pack' : 'Generate pack'}
        confirmDisabled={hasGeneratedPostalPack && !regenerationReason}
        cancelLabel="Cancel"
        onCancel={() => {
          setShowPostalPackModal(false);
          setRegenerationReason('');
        }}
        onConfirm={handleGeneratePostalPack}
      />
      <ConfirmationModal
        show={showMarkSentModal}
        title="Mark document sent?"
        message={
          isTemplateConsultationDocument
            ? 'Confirm that the generated postal pack has now been posted. This will mark the document as sent and record today as the sent date.'
            : 'Confirm that this document has now been posted manually. This will mark the document as sent and record today as the sent date.'
        }
        variant="info"
        confirmLabel="Mark sent"
        cancelLabel="Cancel"
        onCancel={() => setShowMarkSentModal(false)}
        onConfirm={handleMarkAsSent}
      />
    </>
  );
}
