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
  Mail,
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
  leaseholderRecords?: Array<{ id: string; name: string; unit: string; avatar: string; postalAddress?: string; email?: string }>;
  onCreateObservation?: (
    document: any,
    form: {
      leaseholderId: string;
      channel: Observation['channel'];
      message: string;
      isObjection: boolean;
      status: Observation['status'];
    }
  ) => void;
  onUpdateObservation?: (
    observationId: string,
    form: {
      leaseholderId: string;
      channel: Observation['channel'];
      message: string;
      isObjection: boolean;
      status: Observation['status'];
    }
  ) => void;
  onDeleteObservation?: (observationId: string) => void;
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
  onDeleteObservation
}: DocumentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'delivery' | 'observations'>('document');
  const [showNewObservationForm, setShowNewObservationForm] = useState(false);
  const [responseFilter, setResponseFilter] = useState<'all' | 'needs-attention' | 'no-action' | 'reviewing' | 'addressed' | 'objections' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [observationPage, setObservationPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'leaseholder' | 'property' | 'response' | 'status' | 'received'>('received');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<null | { type: 'close' | 'delete'; observationId?: string }>(null);
  const [documentTemplateName, setDocumentTemplateName] = useState('');
  const [documentBody, setDocumentBody] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showPostalPackModal, setShowPostalPackModal] = useState(false);
  const [showEmailSendModal, setShowEmailSendModal] = useState(false);
  const [showEmailDeliveryDetails, setShowEmailDeliveryDetails] = useState(false);
  const [showMarkSentModal, setShowMarkSentModal] = useState(false);
  const [emailSortColumn, setEmailSortColumn] = useState<'leaseholder' | 'property' | 'status' | 'latestUpdate'>('latestUpdate');
  const [emailSortDirection, setEmailSortDirection] = useState<'asc' | 'desc'>('desc');
  const [regenerationReason, setRegenerationReason] = useState('');
  const [observationForm, setObservationForm] = useState({
    leaseholderId: '',
    channel: 'email' as Observation['channel'],
    message: '',
    isObjection: false,
    status: 'no-action' as Observation['status']
  });
  const getDefaultObservationStatus = (isObjection = false): Observation['status'] =>
    isObjection ? 'reviewing' : 'no-action';
  const normalizeDocumentKey = (value: unknown) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  useEffect(() => {
    setActiveTab('document');
    setShowNewObservationForm(false);
    setResponseFilter('all');
    setSearchQuery('');
    setObservationPage(1);
    setSortColumn('received');
    setSortDirection('desc');
    setEditingObservationId(null);
    setIsEditingTemplate(false);
    setShowPostalPackModal(false);
    setShowEmailSendModal(false);
    setShowEmailDeliveryDetails(false);
    setShowMarkSentModal(false);
    setEmailSortColumn('latestUpdate');
    setEmailSortDirection('desc');
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

5. Consultation deadline:
{{consultation_deadline}}

Signed: [Name]
For and on behalf of: [Landlord / Manager / Authorised Agent]
Date of notice: [Insert date]`
    );
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false,
      status: getDefaultObservationStatus()
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
  const hasEmailDelivery = Boolean(document.emailSentAt);
  const canGeneratePostalPack = isTemplateConsultationDocument && !isEditingTemplate;
  const canMarkSent = !isProjectDocument && !document.sentDate;
  const isConsultationDocument = !isProjectDocument;
  const isNoticeDocumentType = normalizeDocumentKey(document.type) === 'notice';
  const isObservationDocument = isConsultationDocument && isNoticeDocumentType;
  const isLeaseholderNotice =
    isObservationDocument &&
    document.recipients?.some((recipient: any) => recipient.label === 'Leaseholders');
  const leaseholderRecipientCount = document.recipients?.find((recipient: any) => recipient.label === 'Leaseholders')?.count || 0;
  const postalRecipients = leaseholderRecords.slice(0, leaseholderRecipientCount || leaseholderRecords.length);
  const validEmailRecipients = postalRecipients.filter(recipient => Boolean(recipient.email?.trim()));
  const missingEmailRecipients = postalRecipients.filter(recipient => !recipient.email?.trim());
  const previouslyNotEmailedLeaseholderIds = new Set(
    (document.emailDeliveryEntries || [])
      .filter((entry: any) => entry.status === 'excluded')
      .map((entry: any) => entry.leaseholderId)
  );
  const pendingEmailRecipients = hasEmailDelivery
    ? postalRecipients.filter(recipient => previouslyNotEmailedLeaseholderIds.has(recipient.id) && Boolean(recipient.email?.trim()))
    : validEmailRecipients;
  const pendingMissingEmailRecipients = hasEmailDelivery
    ? postalRecipients.filter(recipient => previouslyNotEmailedLeaseholderIds.has(recipient.id) && !recipient.email?.trim())
    : missingEmailRecipients;
  const canSendEmail =
    !isProjectDocument &&
    (!isTemplateConsultationDocument || !isEditingTemplate) &&
    pendingEmailRecipients.length > 0;
  const emailDeliverySummary = document.emailDeliverySummary || null;
  const emailDeliveryEntries = document.emailDeliveryEntries || [];
  const documentObservations = observations.filter(observation => observation.documentId === document.id);
  const respondedCount = new Set(documentObservations.map(observation => observation.leaseholderId)).size;
  const noActionObservationCount = documentObservations.filter(observation => observation.status === 'no-action').length;
  const reviewingObservationCount = documentObservations.filter(observation => observation.status === 'reviewing').length;
  const addressedObservationCount = documentObservations.filter(observation => observation.status === 'addressed').length;
  const objectionObservationCount = documentObservations.filter(observation => observation.isObjection).length;
  const generationSummary = document.postalPackGeneratedAt
    ? `${document.postalPackGeneratedAt} by ${document.postalPackGeneratedBy || 'Unknown user'}`
    : null;
  const emailGenerationSummary = document.emailSentAt
    ? `${document.emailSentAt} by ${document.emailSentBy || 'Unknown user'}`
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
    if (responseFilter === 'no-action' && row.status !== 'no-action') {
      return false;
    }
    if (responseFilter === 'reviewing' && row.status !== 'reviewing') {
      return false;
    }
    if (responseFilter === 'addressed' && row.status !== 'addressed') {
      return false;
    }
    if (responseFilter === 'needs-attention' && row.status === 'addressed') {
      return false;
    }
    return true;
  });

  const sortedObservationRows = [...filteredObservationRows].sort((a, b) => {
    const getValue = (row: typeof observationRows[number]): string | number => {
      switch (sortColumn) {
        case 'leaseholder':
          return (row.leaseholderName || '').toLowerCase();
        case 'property':
          return (row.unit || '').toLowerCase();
        case 'response':
          return (row.message || '').toLowerCase();
        case 'status':
          return {
            'no-action': 0,
            reviewing: 1,
            addressed: 2
          }[row.status] ?? 99;
        case 'received':
          return new Date(row.receivedOn).getTime();
        default:
          return '';
      }
    };

    const aValue = getValue(a);
    const bValue = getValue(b);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    }

    const comparison = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
      sensitivity: 'base'
    });

    return sortDirection === 'asc' ? comparison : -comparison;
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

  const getObservationStatusLabel = (status: Observation['status']) => {
    switch (status) {
      case 'no-action':
        return 'No action';
      case 'reviewing':
        return 'In review';
      case 'addressed':
        return 'Addressed';
      default:
        return status;
    }
  };

  const getObservationStatusBadgeStyle = (status: Observation['status']) => {
    switch (status) {
      case 'no-action':
        return { backgroundColor: '#e5e7eb', color: '#4b5563' };
      case 'reviewing':
        return { backgroundColor: '#fef3c7', color: '#b45309' };
      case 'addressed':
        return { backgroundColor: '#dcfce7', color: '#15803d' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#4b5563' };
    }
  };

  const hasUnsavedObservationDraft =
    (showNewObservationForm || editingObservationId !== null) &&
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

    const normalizedForm = {
      ...observationForm,
      status:
        observationForm.isObjection && observationForm.status === 'no-action'
          ? 'reviewing'
          : observationForm.status
    };

    if (editingObservationId) {
      onUpdateObservation?.(editingObservationId, normalizedForm);
    } else {
      onCreateObservation?.(document, normalizedForm);
    }

    setShowNewObservationForm(false);
    setEditingObservationId(null);
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false,
      status: getDefaultObservationStatus()
    });
  };

  const handleSort = (column: typeof sortColumn) => {
    setObservationPage(1);
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === 'leaseholder' || column === 'property' || column === 'status' ? 'asc' : 'desc');
  };

  const handleEditObservation = (observation: Observation) => {
    setShowNewObservationForm(false);
    setEditingObservationId(observation.id);
    setObservationForm({
      leaseholderId: observation.leaseholderId,
      channel: observation.channel,
      message: observation.message,
      isObjection: observation.isObjection,
      status: observation.status
    });
  };

  const handleDeleteObservation = (observationId: string) => {
    setPendingConfirmation({ type: 'delete', observationId });
  };

  const confirmDeleteObservation = (observationId: string) => {
    if (editingObservationId === observationId) {
      setEditingObservationId(null);
      setShowNewObservationForm(false);
      setObservationForm({
        leaseholderId: leaseholderRecords[0]?.id || '',
        channel: 'email',
        message: '',
        isObjection: false,
        status: getDefaultObservationStatus()
      });
    }

    onDeleteObservation?.(observationId);
  };

  const handleCancelObservationForm = () => {
    setShowNewObservationForm(false);
    setEditingObservationId(null);
    setObservationForm({
      leaseholderId: leaseholderRecords[0]?.id || '',
      channel: 'email',
      message: '',
      isObjection: false,
      status: getDefaultObservationStatus()
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
      postalPackLeaseholderCount: postalRecipients.length,
      postalPackReason: hasGeneratedPostalPack ? regenerationReason : null,
      lastUpdated: generatedAt,
      lastUpdatedBy: 'Ahsan Jalil'
    });

    setShowPostalPackModal(false);
    setRegenerationReason('');
  };

  const handleSendEmailDocument = () => {
    if (!document?.id || !onUpdateDocument) {
      return;
    }

    const sentAt = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const existingEntriesByLeaseholderId = new Map(
      (document.emailDeliveryEntries || []).map((entry: any) => [entry.leaseholderId, entry])
    );

    const emailDeliveryEntries = postalRecipients.map((recipient, index) => {
      const existingEntry = existingEntriesByLeaseholderId.get(recipient.id);
      const shouldSendNow = pendingEmailRecipients.some(target => target.id === recipient.id);

      if (shouldSendNow) {
        const status =
          index % 7 === 3
            ? 'bounced'
            : index % 3 === 0
              ? 'opened'
              : index % 2 === 0
                ? 'delivered'
                : 'sent';

        return {
          leaseholderId: recipient.id,
          leaseholderName: recipient.name,
          unit: recipient.unit,
          status,
          sentAt,
          deliveredAt: status === 'delivered' || status === 'opened' ? sentAt : null,
          openedAt: status === 'opened' ? sentAt : null,
          bounceReason: status === 'bounced' ? 'Mailbox rejected delivery' : null
        };
      }

      if (existingEntry) {
        return existingEntry;
      }

      if (!recipient.email?.trim()) {
        return {
          leaseholderId: recipient.id,
          leaseholderName: recipient.name,
          unit: recipient.unit,
          status: 'excluded' as const,
          sentAt: null,
          deliveredAt: null,
          openedAt: null,
          bounceReason: 'No email address on record'
        };
      }

      return {
        leaseholderId: recipient.id,
        leaseholderName: recipient.name,
        unit: recipient.unit,
        status: 'excluded' as const,
        sentAt: null,
        deliveredAt: null,
        openedAt: null,
        bounceReason: 'Not included in this email run'
      };
    });

    const sentEntries = emailDeliveryEntries.filter(entry => entry.status !== 'excluded');
    const emailDeliverySummary = {
      targeted: postalRecipients.length,
      sent: sentEntries.length,
      delivered: sentEntries.filter(entry => entry.status === 'delivered' || entry.status === 'opened').length,
      opened: sentEntries.filter(entry => entry.status === 'opened').length,
      bounced: sentEntries.filter(entry => entry.status === 'bounced').length,
      excluded: emailDeliveryEntries.filter(entry => entry.status === 'excluded').length
    };

    onUpdateDocument(document.id, {
      emailDeliveryMethod: 'email',
      emailReadReceiptRequested: true,
      emailSentAt: sentAt,
      emailSentBy: 'Ahsan Jalil',
      emailDeliverySummary,
      emailDeliveryEntries,
      lastUpdated: sentAt,
      lastUpdatedBy: 'Ahsan Jalil'
    });

    setShowEmailSendModal(false);
    setShowEmailDeliveryDetails(false);
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

  const getEmailDeliveryBadgeStyle = (
    status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'excluded'
  ) => {
    switch (status) {
      case 'opened':
        return { backgroundColor: '#d1e7dd', color: '#0f5132' };
      case 'delivered':
        return { backgroundColor: '#cff4fc', color: '#055160' };
      case 'bounced':
        return { backgroundColor: '#f8d7da', color: '#842029' };
      case 'excluded':
        return { backgroundColor: '#e2e3e5', color: '#41464b' };
      default:
        return { backgroundColor: '#cfe2ff', color: '#084298' };
    }
  };

  const getEmailDeliveryStatusLabel = (
    status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'excluded'
  ) => {
    switch (status) {
      case 'opened':
        return 'Opened';
      case 'delivered':
        return 'Delivered';
      case 'bounced':
        return 'Bounced';
      case 'excluded':
        return 'Not emailed';
      default:
        return 'Sent';
    }
  };

  const getEmailDeliveryLatestUpdate = (entry: any) => {
    if (entry.status === 'opened') {
      return `Opened ${entry.openedAt}`;
    }
    if (entry.status === 'delivered') {
      return `Delivered ${entry.deliveredAt}`;
    }
    if (entry.status === 'bounced') {
      return entry.bounceReason || 'Bounced';
    }
    if (entry.status === 'excluded') {
      return 'No email address on record';
    }
    return entry.sentAt ? `Sent ${entry.sentAt}` : '—';
  };

  const getEmailDeliverySortTimestamp = (entry: any) => {
    const value = entry.openedAt || entry.deliveredAt || entry.sentAt;
    if (!value) {
      return 0;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const sortedEmailDeliveryEntries = [...emailDeliveryEntries].sort((a: any, b: any) => {
    const getValue = (entry: any): string | number => {
      switch (emailSortColumn) {
        case 'leaseholder':
          return (entry.leaseholderName || '').toLowerCase();
        case 'property':
          return (entry.unit || '').toLowerCase();
        case 'status':
          return {
            excluded: 0,
            bounced: 1,
            sent: 2,
            delivered: 3,
            opened: 4
          }[entry.status] ?? 99;
        case 'latestUpdate':
          return getEmailDeliverySortTimestamp(entry);
        default:
          return '';
      }
    };

    const aValue = getValue(a);
    const bValue = getValue(b);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      if (aValue < bValue) {
        return emailSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return emailSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    }

    const comparison = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
      sensitivity: 'base'
    });

    return emailSortDirection === 'asc' ? comparison : -comparison;
  });

  const documentAiInsight = (() => {
    const facts = [
      document.stage ? `Stage: ${document.stage}` : null,
      document.dueDate && !document.sentDate ? `Due to send: ${document.dueDate}` : null,
      leaseholderRecipientCount > 0 ? `${leaseholderRecipientCount} leaseholders targeted` : null,
      hasGeneratedPostalPack ? `Postal pack v${document.postalPackVersion || 1} generated` : null,
      emailDeliverySummary ? `${emailDeliverySummary.opened} opened by email` : null
    ].filter(Boolean) as string[];

    if (document.isOverdue && !document.sentDate) {
      return {
        tone: 'warning' as const,
        title: 'Document is overdue to send',
        detail: `This notice is still unsent and passed its due date of ${document.dueDate}.`,
        facts
      };
    }

    if (document.status === 'Awaiting approval') {
      return {
        tone: 'warning' as const,
        title: 'Approval is blocking issue',
        detail: 'This document should not be served until the required approval is completed.',
        facts
      };
    }

    if (document.status === 'Draft') {
      return {
        tone: 'info' as const,
        title: 'Document is still in draft',
        detail: 'Content should be checked and finalised before this is issued.',
        facts
      };
    }

    if (isTemplateConsultationDocument && !hasGeneratedPostalPack && !document.sentDate) {
      return {
        tone: 'info' as const,
        title: 'Postal pack has not been generated yet',
        detail: 'Generate the pack before marking this notice as sent.',
        facts
      };
    }

    if (document.sentDate) {
      return {
        tone: 'success' as const,
        title: 'Document has been issued',
        detail: 'This notice has already been marked as sent.',
        facts: [
          `Sent on ${document.sentDate}`,
          ...facts.filter(fact => !String(fact).startsWith('Due to send:'))
        ]
      };
    }

    return {
      tone: 'success' as const,
      title: 'No immediate document issues flagged',
      detail: 'This document is currently in a workable state.',
      facts
    };
  })();

  const observationAiInsight = (() => {
    const respondedLabel = `${respondedCount} leaseholder${respondedCount === 1 ? '' : 's'} responded`;
    const objectionLabel = `${objectionObservationCount} objection${objectionObservationCount === 1 ? '' : 's'} logged`;
    const inReviewLabel = `${reviewingObservationCount} ${reviewingObservationCount === 1 ? 'response is' : 'responses are'} in review`;
    const addressedLabel = `${addressedObservationCount} ${addressedObservationCount === 1 ? 'response is' : 'responses are'} addressed`;
    const noActionLabel = `${noActionObservationCount} ${noActionObservationCount === 1 ? 'response needs' : 'responses need'} a decision`;

    if (isLeaseholderNotice && objectionObservationCount > 0) {
      return {
        tone: 'warning' as const,
        title: 'Objections need review',
        detail: `${objectionLabel}. Make sure these are reviewed before the consultation moves forward.`,
        facts: [
          respondedLabel,
          reviewingObservationCount > 0 ? inReviewLabel : noActionLabel,
          addressedObservationCount > 0 ? addressedLabel : null
        ].filter(Boolean) as string[]
      };
    }

    if (isLeaseholderNotice && noActionObservationCount > 0) {
      return {
        tone: 'info' as const,
        title: 'Some responses still need a decision',
        detail: `${noActionLabel}. Triage them so key leaseholder points are not missed.`,
        facts: [
          respondedLabel,
          addressedObservationCount > 0 ? addressedLabel : null,
          document.sentDate ? `Issued on ${document.sentDate}` : null
        ].filter(Boolean) as string[]
      };
    }

    if (isLeaseholderNotice && document.sentDate && documentObservations.length === 0) {
      return {
        tone: 'info' as const,
        title: 'No observations logged yet',
        detail: 'This notice has been issued, but no leaseholder responses have been captured yet.',
        facts: [
          `Issued on ${document.sentDate}`,
          `${leaseholderRecipientCount} leaseholders served`
        ]
      };
    }

    return {
      tone: 'success' as const,
      title: 'No immediate issues flagged',
      detail: isLeaseholderNotice
        ? 'Responses are being tracked and there is no urgent issue highlighted right now.'
        : 'This document currently has no obvious workflow issues.',
      facts: [
        isLeaseholderNotice && respondedCount > 0 ? respondedLabel : null,
        isLeaseholderNotice && addressedObservationCount > 0 ? addressedLabel : null,
        document.sentDate ? `Sent on ${document.sentDate}` : null
      ].filter(Boolean) as string[]
    };
  })();

  const deliveryAiInsight = (() => {
    if (document.sentDate) {
      return {
        tone: 'success' as const,
        title: 'Document has been marked as sent',
        detail: `Issue was confirmed on ${document.sentDate}. Keep delivery records here if follow-up is needed.`,
        facts: []
      };
    }

    if (isTemplateConsultationDocument && !hasGeneratedPostalPack && !hasEmailDelivery) {
      return {
        tone: 'info' as const,
        title: 'No delivery method has been completed yet',
        detail: 'Generate a postal pack or send by email before marking this document as sent.',
        facts: []
      };
    }

    if (hasEmailDelivery && emailDeliverySummary && emailDeliverySummary.excluded > 0) {
      return {
        tone: 'warning' as const,
        title: 'Some leaseholders were not emailed',
        detail: `${emailDeliverySummary.excluded} leaseholder${emailDeliverySummary.excluded === 1 ? '' : 's'} still need follow-up or another delivery route.`,
        facts: []
      };
    }

    if (hasGeneratedPostalPack && !document.sentDate) {
      return {
        tone: 'info' as const,
        title: 'Postal pack is ready to issue',
        detail: 'Once the notices are posted, mark the document as sent to complete the delivery step.',
        facts: []
      };
    }

    if (hasEmailDelivery && !document.sentDate) {
      return {
        tone: 'info' as const,
        title: 'Email delivery has started',
        detail: 'Review delivery results, then mark the document as sent when the issue step is complete.',
        facts: []
      };
    }

    return {
      tone: 'success' as const,
      title: 'Delivery is in a workable state',
      detail: 'Postal and email actions are available from this tab.',
      facts: []
    };
  })();

  const getAiToneStyles = (tone: 'warning' | 'info' | 'success') => {
    if (tone === 'warning') {
      return {
        containerStyle: {
          backgroundColor: '#fff3cd',
          color: '#664d03'
        },
        icon: <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
      };
    }

    if (tone === 'success') {
      return {
        containerStyle: {
          backgroundColor: '#d1e7dd',
          color: '#0f5132'
        },
        icon: <CheckCircle2 size={22} style={{ color: '#198754' }} />
      };
    }

    return {
      containerStyle: {
        backgroundColor: '#cff4fc',
        color: '#055160'
      },
      icon: <Info size={22} style={{ color: '#0dcaf0' }} />
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
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Sparkles size={20} style={{ color: '#7c3aed' }} />
        <h5 className="mb-0">AI Insights</h5>
      </div>

      {(() => {
        const currentAiInsight =
          activeTab === 'observations'
            ? observationAiInsight
            : activeTab === 'delivery'
              ? deliveryAiInsight
              : documentAiInsight;
        const tone = getAiToneStyles(currentAiInsight.tone);
        return (
          <div
            className="px-3 py-3"
            style={{ ...tone.containerStyle, borderRadius: '18px' }}
          >
            <div className="d-flex align-items-start gap-3">
              <div className="mt-1 flex-shrink-0">{tone.icon}</div>
              <div className="flex-grow-1">
                <div style={{ fontSize: '15px', lineHeight: 1.45, fontWeight: 600 }}>
                  {currentAiInsight.title}
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.5, marginTop: '0.25rem' }}>
                  {currentAiInsight.detail}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderObservationSortHeader = (
    label: string,
    column: typeof sortColumn
  ) => (
    <button
      type="button"
      className="btn btn-link text-decoration-none text-reset p-0 d-flex align-items-center gap-1 fw-semibold"
      onClick={() => handleSort(column)}
      style={{ userSelect: 'none' }}
    >
      <span>{label}</span>
      {sortColumn === column && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
    </button>
  );

  const renderEmailSortHeader = (
    label: string,
    column: typeof emailSortColumn
  ) => (
    <button
      type="button"
      className="btn btn-link text-decoration-none text-reset p-0 d-flex align-items-center gap-1 fw-semibold"
      onClick={() => {
        if (emailSortColumn === column) {
          setEmailSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
          return;
        }
        setEmailSortColumn(column);
        setEmailSortDirection(column === 'leaseholder' || column === 'property' || column === 'status' ? 'asc' : 'desc');
      }}
      style={{ userSelect: 'none' }}
    >
      <span>{label}</span>
      {emailSortColumn === column && (emailSortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
    </button>
  );

  const renderObservationForm = (mode: 'new' | 'edit') => (
    <div className={`border rounded p-3 ${mode === 'new' ? 'mb-4 bg-light' : 'bg-light-subtle'}`}>
      <div className="row g-3">
        <div className="col-md-4">
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
        <div className="col-md-3">
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
        <div className="col-md-3">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={observationForm.status}
            onChange={(e) => setObservationForm(prev => ({ ...prev, status: e.target.value as Observation['status'] }))}
          >
            <option value="no-action">No action</option>
            <option value="reviewing">In review</option>
            <option value="addressed">Addressed</option>
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <div className="form-check mb-2 ms-md-2">
            <input
              id={mode === 'new' ? 'objection-flag-new' : 'objection-flag-edit'}
              className="form-check-input"
              type="checkbox"
              checked={observationForm.isObjection}
              onChange={(e) =>
                setObservationForm(prev => ({
                  ...prev,
                  isObjection: e.target.checked,
                  status:
                    e.target.checked && prev.status === 'no-action'
                      ? 'reviewing'
                      : prev.status
                }))
              }
            />
            <label
              htmlFor={mode === 'new' ? 'objection-flag-new' : 'objection-flag-edit'}
              className="form-check-label"
            >
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
          {mode === 'edit' ? 'Save changes' : 'Save response'}
        </button>
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

        {isConsultationDocument && (
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
                  aria-selected={activeTab === 'delivery'}
                  className="nav-link border-0"
                  onClick={() => setActiveTab('delivery')}
                  style={{
                    backgroundColor: activeTab === 'delivery' ? '#ffffff' : '#3b82c4',
                    color: activeTab === 'delivery' ? '#000000' : '#ffffff',
                    borderRadius: '0',
                    padding: '0.75rem 1.5rem',
                    fontWeight: '400',
                    borderLeft: activeTab === 'delivery' ? '3px solid #ffffff' : 'none'
                  }}
                >
                  Delivery
                </button>
              </li>
              {isObservationDocument && (
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
              )}
            </ul>
          </div>
        )}

        {(activeTab === 'document' || (!isConsultationDocument && activeTab !== 'delivery' && activeTab !== 'observations')) && (
          <>
            {aiSuggestionsSection}

            {isTemplateConsultationDocument && (
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-muted small">Document content</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge text-bg-light">{documentTemplateName || 'Standard consultation wording'}</span>
                    {!isEditingTemplate ? (
                      <button
                        className="btn btn-outline-primary btn-sm"
                        type="button"
                        onClick={() => setIsEditingTemplate(true)}
                      >
                        Edit
                      </button>
                    ) : (
                      <>
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

5. Consultation deadline:
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
                      </>
                    )}
                  </div>
                </div>
                <textarea
                  className="form-control"
                  rows={14}
                  style={{ minHeight: 'clamp(320px, 48vh, 640px)', lineHeight: 1.65, width: '100%', resize: 'vertical' }}
                  value={documentBody}
                  onChange={(event) => setDocumentBody(event.target.value)}
                  disabled={!isEditingTemplate}
                />
              </div>
            )}

            {isUploadedConsultationDocument && (
              <div className="alert alert-secondary mb-4 d-flex align-items-start gap-2">
                <Info size={16} className="mt-1" />
                <div className="small">
                  Uploaded documents are email-only in this prototype.
                  {isObservationDocument
                    ? ' Observations can still be captured in the same way after issue.'
                    : ''}
                </div>
              </div>
            )}

            {(isProjectDocument || isUploadedConsultationDocument) && (
              <div className="mb-4">
                <div className="text-muted small mb-2">Preview</div>
                <div
                  className="border rounded p-4 bg-light-subtle"
                  style={{ minHeight: isUploadedConsultationDocument ? 'clamp(220px, 34vh, 320px)' : 'clamp(320px, 48vh, 640px)' }}
                >
                  {isUploadedConsultationDocument ? (
                    <div
                      className="border rounded-3 bg-white d-flex flex-column align-items-center justify-content-center text-center"
                      style={{ minHeight: 'clamp(180px, 28vh, 240px)', width: '100%' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                          style={{ width: '44px', height: '44px', backgroundColor: '#f1f5f9', color: '#475569' }}
                        >
                          <FileText size={18} />
                        </div>
                        <div style={{ minWidth: 0, textAlign: 'left' }}>
                          <div className="fw-medium" style={{ fontSize: '14px' }}>
                            {document.uploadedFileName || document.name || 'Uploaded document'}
                          </div>
                          <div className="text-muted small text-uppercase">
                            {(document.uploadedFileName?.split('.').pop() || 'file')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                          <div className="fw-semibold">Fixflo Property Management</div>
                          <div className="text-muted small">123 Management Street, London, SE1 9RY</div>
                        </div>
                        <div className="text-muted small">{document.sentDate || document.lastUpdated || '25/11/2025'}</div>
                      </div>

                      <h5 className="mb-3">{document.name}</h5>
                      <div style={{ lineHeight: 1.7 }}>
                      {(documentBody || '').split(/\n{2,}/).filter(Boolean).map((paragraph, index, paragraphs) => (
                        <p key={`${paragraph}-${index}`} className={index === paragraphs.length - 1 ? 'mb-0' : undefined}>
                          {paragraph}
                        </p>
                      ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

          </>
        )}

        {activeTab === 'delivery' && !isProjectDocument && (
          <div>
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
                    <span>{leaseholderRecipientCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-3 p-2 p-lg-3 mb-4" style={{ backgroundColor: '#f8fafc', borderColor: '#dbe4f0' }}>
              <div className="mb-2">
                <div className="fw-semibold" style={{ color: '#0f172a' }}>
                  Delivery
                </div>
                <div className="small" style={{ color: '#475569' }}>
                  {document.sentDate ? `Marked sent on ${document.sentDate}` : 'Track postal and email issue history in one place.'}
                </div>
              </div>

              <div className="border rounded-3 bg-white p-2 p-lg-3 mb-2">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div className="d-flex align-items-start gap-2">
                    <ClipboardList size={18} style={{ color: '#334155', marginTop: '2px' }} />
                    <div>
                      <div className="fw-medium" style={{ color: '#0f172a' }}>Postal</div>
                      <div className="small" style={{ color: '#475569' }}>
                        {isUploadedConsultationDocument
                          ? 'Not available for uploaded documents'
                          : hasGeneratedPostalPack
                            ? `Generated ${generationSummary}`
                            : 'No postal pack generated yet'}
                      </div>
                      {hasGeneratedPostalPack && !isUploadedConsultationDocument && (
                        <div className="small mt-1" style={{ color: '#475569' }}>
                          Pack v{document.postalPackVersion || 1} for {document.postalPackLeaseholderCount || 0} leaseholder{(document.postalPackLeaseholderCount || 0) === 1 ? '' : 's'}.
                          {document.postalPackReason ? ` Regeneration reason: ${document.postalPackReason}.` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${isUploadedConsultationDocument ? 'text-bg-light' : hasGeneratedPostalPack ? 'text-bg-info' : 'text-bg-light'}`}>
                      {isUploadedConsultationDocument ? 'Not available' : hasGeneratedPostalPack ? 'Generated' : 'Not generated'}
                    </span>
                    {isTemplateConsultationDocument && (
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                        type="button"
                        onClick={() => {
                          if (!canGeneratePostalPack) {
                            return;
                          }
                          setShowPostalPackModal(true);
                        }}
                        disabled={!canGeneratePostalPack}
                      >
                        <Printer size={14} />
                        {hasGeneratedPostalPack ? 'Regenerate postal pack' : 'Generate postal pack'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="border rounded-3 bg-white p-2 p-lg-3">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                  <div className="d-flex align-items-start gap-2">
                    <Mail size={18} style={{ color: '#334155', marginTop: '2px' }} />
                    <div>
                      <div className="fw-medium" style={{ color: '#0f172a' }}>Email</div>
                      <div className="small" style={{ color: '#475569' }}>
                        {hasEmailDelivery && emailGenerationSummary ? `Sent ${emailGenerationSummary}` : 'No email delivery recorded yet'}
                      </div>
                      {hasEmailDelivery && emailDeliverySummary && (
                        <div className="small mt-1" style={{ color: '#475569' }}>
                          {emailDeliverySummary.sent} emailed, {emailDeliverySummary.delivered} delivered, {emailDeliverySummary.opened} opened, {emailDeliverySummary.bounced} bounced, {emailDeliverySummary.excluded} not emailed.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${hasEmailDelivery ? 'text-bg-info' : 'text-bg-light'}`}>
                      {hasEmailDelivery ? 'Sent' : 'Not sent'}
                    </span>
                    {!hasEmailDelivery && (
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                        type="button"
                        onClick={() => {
                          if (!canSendEmail) {
                            return;
                          }
                          setShowEmailSendModal(true);
                        }}
                        disabled={!canSendEmail}
                      >
                        <Mail size={14} />
                        Send by email
                      </button>
                    )}
                    {hasEmailDelivery && emailDeliverySummary && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                        onClick={() => setShowEmailDeliveryDetails(prev => !prev)}
                      >
                        {showEmailDeliveryDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {showEmailDeliveryDetails ? 'Hide details' : 'View details'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {hasEmailDelivery && emailDeliverySummary && showEmailDeliveryDetails && (
                <div className="mt-2">
                  {emailDeliverySummary.excluded > 0 && (
                    <div className="d-flex justify-content-end mb-2">
                      <button
                        className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                        type="button"
                        onClick={() => {
                          if (!canSendEmail) {
                            return;
                          }
                          setShowEmailSendModal(true);
                        }}
                        disabled={!canSendEmail}
                      >
                        <Mail size={14} />
                        Send to remaining leaseholders
                      </button>
                    </div>
                  )}
                  <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>{renderEmailSortHeader('Leaseholder', 'leaseholder')}</th>
                        <th>{renderEmailSortHeader('Property', 'property')}</th>
                        <th>{renderEmailSortHeader('Status', 'status')}</th>
                        <th>{renderEmailSortHeader('Latest update', 'latestUpdate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEmailDeliveryEntries.map((entry: any) => (
                        <tr key={entry.leaseholderId}>
                          <td className="fw-medium">{entry.leaseholderName}</td>
                          <td className="text-muted">{entry.unit}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                ...getEmailDeliveryBadgeStyle(entry.status),
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              {getEmailDeliveryStatusLabel(entry.status)}
                            </span>
                          </td>
                          <td className="small text-muted">{getEmailDeliveryLatestUpdate(entry)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'observations' && isObservationDocument && (
          <div>
            {aiSuggestionsSection}

            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Leaseholders</div>
                  <div className="fs-4 fw-semibold">{leaseholderRecords.length}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">No action</div>
                  <div className="fs-4 fw-semibold">{noActionObservationCount}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">In review</div>
                  <div className="fs-4 fw-semibold">{reviewingObservationCount}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="text-muted small mb-1">Addressed</div>
                  <div className="fs-4 fw-semibold">{addressedObservationCount}</div>
                </div>
              </div>
            </div>

            {showNewObservationForm && renderObservationForm('new')}

            <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
              <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                <select
                  className="form-select"
                  style={{ width: '190px' }}
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value as typeof responseFilter)}
                  aria-label="Filter responses"
                >
                  <option value="all">All responses</option>
                  <option value="needs-attention">Needs attention</option>
                  <option value="no-action">No action</option>
                  <option value="reviewing">In review</option>
                  <option value="addressed">Addressed</option>
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
              {!showNewObservationForm && editingObservationId === null && (
                <button
                  className="btn btn-primary d-flex align-items-center gap-2 ms-auto"
                  type="button"
                  onClick={() => {
                    setEditingObservationId(null);
                    setObservationForm({
                      leaseholderId: leaseholderRecords[0]?.id || '',
                      channel: 'email',
                      message: '',
                      isObjection: false,
                      status: getDefaultObservationStatus()
                    });
                    setShowNewObservationForm(true);
                  }}
                >
                  <Plus size={16} />
                  Log response
                </button>
              )}
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
                  <colgroup>
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '42%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '6%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{renderObservationSortHeader('Leaseholder', 'leaseholder')}</th>
                      <th>{renderObservationSortHeader('Property', 'property')}</th>
                      <th>{renderObservationSortHeader('Response', 'response')}</th>
                      <th>{renderObservationSortHeader('Status', 'status')}</th>
                      <th>{renderObservationSortHeader('Received', 'received')}</th>
                      <th />
                    </tr>
                  </thead>
                <tbody>
                  {paginatedObservationRows.map(row => (
                    <>
                      <tr
                        key={row.id}
                        style={
                          row.isObjection
                            ? {
                                backgroundColor: '#fff5f5',
                                boxShadow: 'inset 4px 0 0 #dc3545'
                              }
                            : undefined
                        }
                      >
                        <td style={{ verticalAlign: 'middle', height: '72px', paddingRight: '0.75rem' }}>
                          <div className="fw-semibold d-flex align-items-center gap-2">
                            <span>{row.leaseholderName}</span>
                            {row.isObjection && (
                              <span className="badge text-bg-danger">Objection</span>
                            )}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px', paddingLeft: '0.5rem', paddingRight: '0.75rem' }}>
                          <div className="text-muted small">{row.unit || '—'}</div>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px', paddingLeft: '0.5rem', paddingRight: '1rem' }}>
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
                                maxHeight: '2.7em'
                              }}
                              title={row.message}
                            >
                              {row.message}
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>
                          <span
                            className="badge"
                            style={{
                              ...getObservationStatusBadgeStyle(row.status),
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            {getObservationStatusLabel(row.status)}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle', height: '72px' }}>{formatObservationDate(row.receivedOn)}</td>
                        <td style={{ width: '1%', whiteSpace: 'nowrap', verticalAlign: 'middle', height: '72px' }}>
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                if (editingObservationId === row.id) {
                                  handleCancelObservationForm();
                                  return;
                                }
                                handleEditObservation(row);
                              }}
                              aria-label={
                                editingObservationId === row.id
                                  ? `Close edit response for ${row.leaseholderName}`
                                  : `Edit response for ${row.leaseholderName}`
                              }
                            >
                              {editingObservationId === row.id ? <X size={14} /> : <Edit3 size={14} />}
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
                    {editingObservationId === row.id && (
                      <tr key={`${row.id}-edit`}>
                        <td colSpan={6} className="pt-0 pb-3 border-0">
                          {renderObservationForm('edit')}
                        </td>
                      </tr>
                    )}
                    </>
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
          </div>
        )}
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
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <div className="modal-body p-0" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{body}</div>
            {activeTab !== 'observations' && (
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
                  {!isProjectDocument && (
                    <button
                      className="btn btn-primary d-flex align-items-center gap-2"
                      type="button"
                      onClick={() => setShowMarkSentModal(true)}
                      disabled={!canMarkSent}
                    >
                      <CheckCircle2 size={16} />
                      {document.sentDate ? 'Sent' : 'Mark as sent'}
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
              </div>
            )}
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
              {`This will generate one print-ready pack from a single document for ${postalRecipients.length} leaseholders.`}
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
        variant="info"
        confirmLabel={hasGeneratedPostalPack ? 'Regenerate pack' : 'Generate pack'}
        confirmDisabled={hasGeneratedPostalPack && !regenerationReason}
        cancelLabel="Cancel"
        onCancel={() => {
          setShowPostalPackModal(false);
          setRegenerationReason('');
        }}
        onConfirm={handleGeneratePostalPack}
      />
      {showEmailSendModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1080 }}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(event) => event.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div className="d-flex align-items-center gap-2">
                  <Mail size={18} style={{ color: '#2563eb' }} />
                  <h5 className="modal-title mb-0">{hasEmailDelivery ? 'Send to not emailed leaseholders?' : 'Send by email?'}</h5>
                </div>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowEmailSendModal(false)} />
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  {hasEmailDelivery
                    ? 'This will email only the leaseholders who were previously not emailed and now have a valid email address on record.'
                    : 'This will email this document to leaseholders with a valid email address and request read receipts.'}
                </p>
                <div className="row g-3 mb-3">
                  <div className="col-sm-4">
                    <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                      <div className="text-muted small">{hasEmailDelivery ? 'Previously not emailed' : 'Leaseholders in scope'}</div>
                      <div className="fw-semibold fs-5">{hasEmailDelivery ? previouslyNotEmailedLeaseholderIds.size : postalRecipients.length}</div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                      <div className="text-muted small">{hasEmailDelivery ? 'Ready to email now' : 'Valid emails'}</div>
                      <div className="fw-semibold fs-5">{pendingEmailRecipients.length}</div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="border rounded-3 p-3 h-100 bg-light-subtle">
                      <div className="text-muted small">Missing emails</div>
                      <div className="fw-semibold fs-5">{pendingMissingEmailRecipients.length}</div>
                    </div>
                  </div>
                </div>
                {pendingMissingEmailRecipients.length > 0 && (
                  <div className="alert alert-warning mb-0">
                    {pendingMissingEmailRecipients.length} leaseholder{pendingMissingEmailRecipients.length === 1 ? '' : 's'} do not have an email address on record.
                    If you continue, they will be shown as not emailed so PM can follow up separately.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEmailSendModal(false)}>
                  {pendingMissingEmailRecipients.length > 0 ? 'Get missing emails first' : 'Cancel'}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSendEmailDocument} disabled={pendingEmailRecipients.length === 0}>
                  {hasEmailDelivery
                    ? `Send to ${pendingEmailRecipients.length} not emailed leaseholder${pendingEmailRecipients.length === 1 ? '' : 's'}`
                    : pendingMissingEmailRecipients.length > 0
                      ? `Send to ${pendingEmailRecipients.length} leaseholder${pendingEmailRecipients.length === 1 ? '' : 's'}`
                      : `Send to ${pendingEmailRecipients.length} leaseholder${pendingEmailRecipients.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        show={showMarkSentModal}
        title="Mark document as sent?"
        message={
          hasEmailDelivery && hasGeneratedPostalPack
            ? 'Confirm that this document has now been issued using the completed delivery methods. This will mark the document as sent and record today as the sent date.'
            : hasEmailDelivery
              ? 'Confirm that this document has now been issued by email. This will mark the document as sent and record today as the sent date.'
              : isTemplateConsultationDocument
                ? 'Confirm that the generated postal pack has now been posted. This will mark the document as sent and record today as the sent date.'
                : 'Confirm that this uploaded document has now been issued by email. This will mark the document as sent and record today as the sent date.'
        }
        variant="info"
        confirmLabel="Mark as sent"
        cancelLabel="Cancel"
        onCancel={() => setShowMarkSentModal(false)}
        onConfirm={handleMarkAsSent}
      />
    </>
  );
}
