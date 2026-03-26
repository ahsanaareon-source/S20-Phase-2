import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, MapPin, Users, FileText, Clipboard, Briefcase, MessageSquare, PoundSterling, CheckCircle, AlertTriangle, AlertCircle, Clock, ChevronDown, ChevronUp, Hourglass, Search, Plus, ChevronLeft, ChevronRight, FilePlus, Check, X as XIcon, X, Info, Building2, Archive, Link as LinkIcon, Filter } from 'lucide-react';
import editIcon from '../../assets/fbd9969709d1864a127070fa8f50a71f1d1c78cb.png';
import NewDocumentModal from './NewDocumentModal';
import NewProjectDocumentModal from './NewProjectDocumentModal';
import DocumentDetailPanel from './DocumentDetailPanel';
import ConfirmationModal from './ConfirmationModal';
import MajorWorksForm from './MajorWorksForm';
import { generateMajorWorkDetailPDF } from '@/utils/pdfGenerator';
import { CONSULTATION_STAGE_LABELS, type ConsultationStage, type Observation } from '@/types';

interface Stage {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'pending';
  tasks: {
    id: string;
    label: string;
    completed: boolean;
  }[];
  isDelayed?: boolean;
  deadline?: {
    daysLeft: number;
    totalDays: number;
  };
}

interface MajorWorksDetailProps {
  work: {
    id: string;
    title: string;
    location: string;
    isNew?: boolean;
    formData?: any;
    status?: 'In progress' | 'On hold' | 'Completed' | 'Delayed' | 'Cancelled' | 'Dispensation';
  };
  onBack: () => void;
  onUpdateWork?: (workId: string, updatedData: any) => void;
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
}

interface ObservationFormState {
  leaseholderId: string;
  channel: 'email' | 'post' | 'phone' | 'portal' | 'internal-note';
  message: string;
  isObjection: boolean;
}

export default function MajorWorksDetail({ work, onBack, onUpdateWork, isEditMode = false, onEditModeChange }: MajorWorksDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(work.title);
  const [cdmAssessment, setCdmAssessment] = useState(false);
  const [tendersCdmAssessment, setTendersCdmAssessment] = useState(false);
  const [lowestQuoteAccepted, setLowestQuoteAccepted] = useState(false);
  const [showCdmModal, setShowCdmModal] = useState(false);
  const [cdmReasons, setCdmReasons] = useState({
    exceeds30Days: false,
    moreThan20Workers: false,
    exceeds500PersonDays: false,
    multipleTradesConcurrent: false
  });
  
  // Helper function for status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'In progress':
        return 'bg-success';
      case 'On hold':
        return 'bg-secondary';
      case 'Completed':
        return 'bg-primary';
      case 'Delayed':
        return 'bg-warning';
      case 'Cancelled':
        return 'bg-danger';
      case 'Dispensation':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const [cdmAdditionalChecks, setCdmAdditionalChecks] = useState({
    principalDesigner: false,
    principalContractor: false,
    hseF10: false,
    hseF10Submitted: false,
    constructionPhasePlan: false,
    healthSafetyFile: false
  });
  
  // Documents tab filters
  const [documentSegment, setDocumentSegment] = useState<'consultation' | 'project'>('consultation');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [showDueOverdue, setShowDueOverdue] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  const [showNewProjectDocumentModal, setShowNewProjectDocumentModal] = useState(false);
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  // Column visibility for documents tab
  const [showDocColumnDropdown, setShowDocColumnDropdown] = useState(false);
  const [visibleDocColumns, setVisibleDocColumns] = useState({
    documentName: true,
    type: true,
    section20Stage: true,
    status: true,
    dueToSendOn: true,
    sentOn: true,
    recipients: true,
    lastUpdated: true,
    lastUpdatedBy: true
  });
  const docColumnDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docColumnDropdownRef.current && !docColumnDropdownRef.current.contains(event.target as Node)) {
        setShowDocColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDocColumn = (columnName: keyof typeof visibleDocColumns) => {
    setVisibleDocColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };
  
  // Link Issues Modal state
  const [showLinkIssueModal, setShowLinkIssueModal] = useState(false);
  const [issueSearchQuery, setIssueSearchQuery] = useState('');
  const [selectedIssuesToLink, setSelectedIssuesToLink] = useState<string[]>([]);
  const [linkedIssues, setLinkedIssues] = useState<string[]>([]);
  
  // Individual users for recipient selection
  const individualUsers = [
    // Leaseholders
    { id: 'lh1', name: 'David Chen', role: 'Leaseholder', group: 'Leaseholders', avatar: 'DC' },
    { id: 'lh2', name: 'Emma Wilson', role: 'Leaseholder', group: 'Leaseholders', avatar: 'EW' },
    { id: 'lh3', name: 'Robert Martinez', role: 'Leaseholder', group: 'Leaseholders', avatar: 'RM' },
    { id: 'lh4', name: 'Lisa Anderson', role: 'Leaseholder', group: 'Leaseholders', avatar: 'LA' },
    { id: 'lh5', name: 'Thomas Brown', role: 'Leaseholder', group: 'Leaseholders', avatar: 'TB' },
    // Directors
    { id: 'dr1', name: 'Michael Thompson', role: 'Director', group: 'Directors', avatar: 'MT' },
    { id: 'dr2', name: 'Jennifer Clarke', role: 'Director', group: 'Directors', avatar: 'JC' },
    { id: 'dr3', name: 'William Hayes', role: 'Director', group: 'Directors', avatar: 'WH' },
    { id: 'dr4', name: 'Patricia Moore', role: 'Director', group: 'Directors', avatar: 'PM' },
    // Property Managers
    { id: 'pm1', name: 'Sarah Johnson', role: 'Property Manager', group: 'Property Managers', avatar: 'SJ' },
    { id: 'pm2', name: 'James Cooper', role: 'Property Manager', group: 'Property Managers', avatar: 'JC' },
    { id: 'pm3', name: 'Ahsan Jalil', role: 'Property Manager', group: 'Property Managers', avatar: 'AJ' },
    // Contractors
    { id: 'ct1', name: 'Emily Roberts', role: 'Contractor', group: 'Contractors', avatar: 'ER' },
    { id: 'ct2', name: 'John Smith', role: 'Contractor', group: 'Contractors', avatar: 'JS' },
    { id: 'ct3', name: 'Maria Garcia', role: 'Contractor', group: 'Contractors', avatar: 'MG' }
  ];

  const consultationStageMap: Record<string, ConsultationStage> = {
    'notice of intention': 'notice-of-intention',
    'first notice': 'first-notice',
    'tenders': 'tenders',
    'statement of estimate': 'statement-of-estimate',
    'notice of reasons': 'notice-of-reasons',
    'ongoing works': 'ongoing-works',
    'completion': 'completion'
  };
  const currentConsultationStage =
    work.formData?.consultationStage ||
    consultationStageMap[(work.stage || '').toLowerCase()] ||
    'notice-of-intention';
  const [observations, setObservations] = useState<Observation[]>([
    {
      id: 'obs-1',
      workId: work.id,
      leaseholderId: 'lh4',
      leaseholderName: 'Sophia Turner',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-08T10:20:00',
      channel: 'email',
      message: 'Asked whether the first notice is the same document referred to in the earlier resident update.',
      isObjection: false,
      status: 'reviewing',
      documentId: 1,
      documentName: 'Notice of intention'
    },
    {
      id: 'obs-2',
      workId: work.id,
      leaseholderId: 'lh7',
      leaseholderName: 'Noah Bennett',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-08T15:35:00',
      channel: 'portal',
      message: 'Objected to the proposed timing and asked for the observation window to be confirmed in writing.',
      isObjection: true,
      status: 'new',
      documentId: 1,
      documentName: 'Notice of intention'
    },
    {
      id: 'obs-3',
      workId: work.id,
      leaseholderId: 'lh1',
      leaseholderName: 'David Chen',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-10T09:30:00',
      channel: 'email',
      message: 'Asked for a fuller breakdown of the estimated contribution before the consultation closes.',
      isObjection: false,
      status: 'reviewing',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-4',
      workId: work.id,
      leaseholderId: 'lh2',
      leaseholderName: 'Emma Wilson',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-11T14:05:00',
      channel: 'post',
      message: 'Objected to the proposed scope and asked whether patch repairs were considered instead of full replacement.',
      isObjection: true,
      status: 'new',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-5',
      workId: work.id,
      leaseholderId: 'lh3',
      leaseholderName: 'Robert Martinez',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-12T09:15:00',
      channel: 'phone',
      message: 'Asked whether the specification can be shared in full before the observation deadline.',
      isObjection: false,
      status: 'responded',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-6',
      workId: work.id,
      leaseholderId: 'lh4',
      leaseholderName: 'Sophia Turner',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-12T11:42:00',
      channel: 'portal',
      message: 'Objected to the proposed timetable and said the notice period feels too short.',
      isObjection: true,
      status: 'new',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-7',
      workId: work.id,
      leaseholderId: 'lh5',
      leaseholderName: 'Oliver Green',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-12T14:10:00',
      channel: 'email',
      message: 'Requested confirmation of access arrangements during the survey period.',
      isObjection: false,
      status: 'reviewing',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-8',
      workId: work.id,
      leaseholderId: 'lh2',
      leaseholderName: 'Emma Wilson',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-13T08:20:00',
      channel: 'email',
      message: 'Followed up to ask whether alternative repair options will be circulated to leaseholders.',
      isObjection: false,
      status: 'reviewing',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-9',
      workId: work.id,
      leaseholderId: 'lh6',
      leaseholderName: 'Ava Patel',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-13T10:05:00',
      channel: 'post',
      message: 'Objected to the scope on cost grounds and asked for estimated individual contributions.',
      isObjection: true,
      status: 'new',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-10',
      workId: work.id,
      leaseholderId: 'lh7',
      leaseholderName: 'Noah Bennett',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-13T13:35:00',
      channel: 'portal',
      message: 'Asked if scaffold access will affect parking bays during the works.',
      isObjection: false,
      status: 'responded',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-11',
      workId: work.id,
      leaseholderId: 'lh8',
      leaseholderName: 'Mia Edwards',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-14T09:00:00',
      channel: 'email',
      message: 'Requested a copy of the consultant report referred to in the notice.',
      isObjection: false,
      status: 'reviewing',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-12',
      workId: work.id,
      leaseholderId: 'lh9',
      leaseholderName: 'Lucas Brooks',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-14T12:25:00',
      channel: 'phone',
      message: 'Objected to the proposal and said previous roof repairs should be reviewed first.',
      isObjection: true,
      status: 'new',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-13',
      workId: work.id,
      leaseholderId: 'lh10',
      leaseholderName: 'Grace Murphy',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-14T15:40:00',
      channel: 'internal-note',
      message: 'Resident raised concerns at the management desk and asked to be sent the contractor shortlist once available.',
      isObjection: false,
      status: 'reviewing',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-14',
      workId: work.id,
      leaseholderId: 'lh1',
      leaseholderName: 'David Chen',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-15T10:10:00',
      channel: 'email',
      message: 'Sent a second response asking whether weekend access will be required for intrusive inspections.',
      isObjection: false,
      status: 'new',
      documentId: 5,
      documentName: 'Initial Section 20 Notice to Lease...'
    },
    {
      id: 'obs-15',
      workId: work.id,
      leaseholderId: 'lh6',
      leaseholderName: 'Ava Patel',
      stage: 'first-notice',
      receivedOn: '2026-02-18T09:45:00',
      channel: 'email',
      message: 'Asked whether the FAQ document covers how estimates are apportioned across flats.',
      isObjection: false,
      status: 'reviewing',
      documentId: 6,
      documentName: 'Leaseholder FAQ Document'
    },
    {
      id: 'obs-16',
      workId: work.id,
      leaseholderId: 'lh4',
      leaseholderName: 'Sophia Turner',
      stage: 'first-notice',
      receivedOn: '2026-02-18T14:20:00',
      channel: 'portal',
      message: 'Asked for the FAQ to confirm whether payment plans may be available if the contribution is high.',
      isObjection: false,
      status: 'new',
      documentId: 6,
      documentName: 'Leaseholder FAQ Document'
    },
    {
      id: 'obs-17',
      workId: work.id,
      leaseholderId: 'lh8',
      leaseholderName: 'Mia Edwards',
      stage: 'tenders',
      receivedOn: '2026-02-21T11:15:00',
      channel: 'portal',
      message: 'Objected to the lowest quote being favoured without a clearer quality comparison.',
      isObjection: true,
      status: 'new',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-18',
      workId: work.id,
      leaseholderId: 'lh3',
      leaseholderName: 'Robert Martinez',
      stage: 'tenders',
      receivedOn: '2026-02-21T15:05:00',
      channel: 'email',
      message: 'Requested copies of the alternative contractor submissions before making a decision.',
      isObjection: false,
      status: 'responded',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-19',
      workId: work.id,
      leaseholderId: 'lh2',
      leaseholderName: 'Emma Wilson',
      stage: 'tenders',
      receivedOn: '2026-02-22T10:40:00',
      channel: 'phone',
      message: 'Queried why one of the contractor quotes appears materially higher than the others.',
      isObjection: false,
      status: 'reviewing',
      documentId: 8,
      documentName: 'Contractor Quote - XYZ Constru...'
    },
    {
      id: 'obs-20',
      workId: work.id,
      leaseholderId: 'lh5',
      leaseholderName: 'Oliver Green',
      stage: 'tenders',
      receivedOn: '2026-02-22T12:05:00',
      channel: 'email',
      message: 'Asked if the alternative quote includes the same warranty terms as the others.',
      isObjection: false,
      status: 'reviewing',
      documentId: 8,
      documentName: 'Contractor Quote - XYZ Constru...'
    },
    {
      id: 'obs-21',
      workId: work.id,
      leaseholderId: 'lh9',
      leaseholderName: 'Lucas Brooks',
      stage: 'tenders',
      receivedOn: '2026-02-22T13:20:00',
      channel: 'post',
      message: 'Objected to any appointment before the nominated contractor review is complete.',
      isObjection: true,
      status: 'new',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-22',
      workId: work.id,
      leaseholderId: 'lh1',
      leaseholderName: 'David Chen',
      stage: 'tenders',
      receivedOn: '2026-02-22T16:10:00',
      channel: 'email',
      message: 'Asked whether contractor references can be shared before the notice of reasons is issued.',
      isObjection: false,
      status: 'reviewing',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-23',
      workId: work.id,
      leaseholderId: 'lh5',
      leaseholderName: 'Oliver Green',
      stage: 'tenders',
      receivedOn: '2026-02-23T09:05:00',
      channel: 'portal',
      message: 'Wanted clarification on programme length differences between the contractor submissions.',
      isObjection: false,
      status: 'responded',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-24',
      workId: work.id,
      leaseholderId: 'lh3',
      leaseholderName: 'Robert Martinez',
      stage: 'statement-of-estimate',
      receivedOn: '2026-02-13T16:20:00',
      channel: 'phone',
      message: 'Queried whether nominated contractors would still be considered after the statement of estimates is issued.',
      isObjection: false,
      status: 'responded'
    },
    {
      id: 'obs-25',
      workId: work.id,
      leaseholderId: 'lh5',
      leaseholderName: 'Oliver Green',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-09T09:05:00',
      channel: 'phone',
      message: 'Asked if the notice of intention can be reissued with a clearer summary of proposed works.',
      isObjection: false,
      status: 'reviewing',
      documentId: 1,
      documentName: 'Notice of intention'
    },
    {
      id: 'obs-26',
      workId: work.id,
      leaseholderId: 'lh8',
      leaseholderName: 'Mia Edwards',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-09T11:30:00',
      channel: 'email',
      message: 'Requested confirmation of the deadline for written observations under the notice.',
      isObjection: false,
      status: 'new',
      documentId: 1,
      documentName: 'Notice of intention'
    },
    {
      id: 'obs-27',
      workId: work.id,
      leaseholderId: 'lh10',
      leaseholderName: 'Grace Murphy',
      stage: 'notice-of-intention',
      receivedOn: '2026-02-09T15:10:00',
      channel: 'portal',
      message: 'Objected to the wording of the notice and asked for the consultation stage labels to be clarified.',
      isObjection: true,
      status: 'new',
      documentId: 1,
      documentName: 'Notice of intention'
    },
    {
      id: 'obs-28',
      workId: work.id,
      leaseholderId: 'lh1',
      leaseholderName: 'David Chen',
      stage: 'first-notice',
      receivedOn: '2026-02-18T16:05:00',
      channel: 'email',
      message: 'Asked whether the FAQ will be updated once formal estimates are issued.',
      isObjection: false,
      status: 'responded',
      documentId: 6,
      documentName: 'Leaseholder FAQ Document'
    },
    {
      id: 'obs-29',
      workId: work.id,
      leaseholderId: 'lh7',
      leaseholderName: 'Noah Bennett',
      stage: 'first-notice',
      receivedOn: '2026-02-19T09:40:00',
      channel: 'portal',
      message: 'Requested that the FAQ include a note on when contractors may need access to loft spaces.',
      isObjection: false,
      status: 'new',
      documentId: 6,
      documentName: 'Leaseholder FAQ Document'
    },
    {
      id: 'obs-30',
      workId: work.id,
      leaseholderId: 'lh9',
      leaseholderName: 'Lucas Brooks',
      stage: 'tenders',
      receivedOn: '2026-02-21T16:20:00',
      channel: 'email',
      message: 'Asked whether ABC Building Services has completed similar roof schemes locally.',
      isObjection: false,
      status: 'reviewing',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-31',
      workId: work.id,
      leaseholderId: 'lh4',
      leaseholderName: 'Sophia Turner',
      stage: 'tenders',
      receivedOn: '2026-02-21T17:00:00',
      channel: 'phone',
      message: 'Objected to progressing with ABC without a written comparison against the other tenders.',
      isObjection: true,
      status: 'new',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-32',
      workId: work.id,
      leaseholderId: 'lh6',
      leaseholderName: 'Ava Patel',
      stage: 'tenders',
      receivedOn: '2026-02-22T08:10:00',
      channel: 'portal',
      message: 'Asked whether ABC includes all scaffold and making-good costs in the quoted total.',
      isObjection: false,
      status: 'responded',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-33',
      workId: work.id,
      leaseholderId: 'lh10',
      leaseholderName: 'Grace Murphy',
      stage: 'tenders',
      receivedOn: '2026-02-22T09:25:00',
      channel: 'internal-note',
      message: 'Resident asked the front desk to confirm if the ABC quote includes weekend working assumptions.',
      isObjection: false,
      status: 'reviewing',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-34',
      workId: work.id,
      leaseholderId: 'lh11',
      leaseholderName: 'Freya Collins',
      stage: 'tenders',
      receivedOn: '2026-02-22T11:40:00',
      channel: 'email',
      message: 'Requested a copy of the ABC insurance schedule before progressing the review.',
      isObjection: false,
      status: 'new',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-35',
      workId: work.id,
      leaseholderId: 'lh12',
      leaseholderName: 'Harry Foster',
      stage: 'tenders',
      receivedOn: '2026-02-22T13:50:00',
      channel: 'post',
      message: 'Objected to the ABC quote on value-for-money grounds and requested all tender clarifications.',
      isObjection: true,
      status: 'new',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-36',
      workId: work.id,
      leaseholderId: 'lh13',
      leaseholderName: 'Isla Hughes',
      stage: 'tenders',
      receivedOn: '2026-02-22T15:10:00',
      channel: 'portal',
      message: 'Asked whether ABC has priced for resident liaison during the scaffold period.',
      isObjection: false,
      status: 'responded',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-37',
      workId: work.id,
      leaseholderId: 'lh14',
      leaseholderName: 'Jack Morris',
      stage: 'tenders',
      receivedOn: '2026-02-22T16:45:00',
      channel: 'email',
      message: 'Requested confirmation that ABC has included the same warranty duration as the competing quotes.',
      isObjection: false,
      status: 'reviewing',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-38',
      workId: work.id,
      leaseholderId: 'lh15',
      leaseholderName: 'Lily Price',
      stage: 'tenders',
      receivedOn: '2026-02-22T17:30:00',
      channel: 'phone',
      message: 'Asked whether ABC has allowed for access protection in top-floor flats during roof strip-out.',
      isObjection: false,
      status: 'new',
      documentId: 7,
      documentName: 'Contractor Quote - ABC Building...'
    },
    {
      id: 'obs-39',
      workId: work.id,
      leaseholderId: 'lh6',
      leaseholderName: 'Ava Patel',
      stage: 'tenders',
      receivedOn: '2026-02-22T14:35:00',
      channel: 'email',
      message: 'Asked if the XYZ quote includes the same provisional sums as the other tenders.',
      isObjection: false,
      status: 'responded',
      documentId: 8,
      documentName: 'Contractor Quote - XYZ Constru...'
    },
    {
      id: 'obs-40',
      workId: work.id,
      leaseholderId: 'lh11',
      leaseholderName: 'Freya Collins',
      stage: 'tenders',
      receivedOn: '2026-02-22T15:55:00',
      channel: 'portal',
      message: 'Objected to the XYZ quote progressing without clarification on programme length.',
      isObjection: true,
      status: 'new',
      documentId: 8,
      documentName: 'Contractor Quote - XYZ Constru...'
    },
    {
      id: 'obs-41',
      workId: work.id,
      leaseholderId: 'lh12',
      leaseholderName: 'Harry Foster',
      stage: 'tenders',
      receivedOn: '2026-02-22T17:10:00',
      channel: 'post',
      message: 'Requested a cleaner side-by-side comparison between the XYZ and ABC submissions.',
      isObjection: false,
      status: 'reviewing',
      documentId: 8,
      documentName: 'Contractor Quote - XYZ Constru...'
    },
    {
      id: 'obs-42',
      workId: work.id,
      leaseholderId: 'lh2',
      leaseholderName: 'Emma Wilson',
      stage: 'tenders',
      receivedOn: '2026-02-23T09:40:00',
      channel: 'email',
      message: 'Requested confirmation that Premier Roofing carries equivalent product guarantees.',
      isObjection: false,
      status: 'reviewing',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-43',
      workId: work.id,
      leaseholderId: 'lh4',
      leaseholderName: 'Sophia Turner',
      stage: 'tenders',
      receivedOn: '2026-02-23T10:25:00',
      channel: 'portal',
      message: 'Asked for an explanation of the price difference between Premier and the next lowest quote.',
      isObjection: false,
      status: 'new',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-44',
      workId: work.id,
      leaseholderId: 'lh7',
      leaseholderName: 'Noah Bennett',
      stage: 'tenders',
      receivedOn: '2026-02-23T11:50:00',
      channel: 'phone',
      message: 'Objected to appointing Premier Roofing before residents have seen the tender comparison summary.',
      isObjection: true,
      status: 'new',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-45',
      workId: work.id,
      leaseholderId: 'lh8',
      leaseholderName: 'Mia Edwards',
      stage: 'tenders',
      receivedOn: '2026-02-23T13:05:00',
      channel: 'email',
      message: 'Asked if Premier Roofing has priced for additional insulation upgrades at the same time.',
      isObjection: false,
      status: 'responded',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    },
    {
      id: 'obs-46',
      workId: work.id,
      leaseholderId: 'lh10',
      leaseholderName: 'Grace Murphy',
      stage: 'tenders',
      receivedOn: '2026-02-23T14:45:00',
      channel: 'internal-note',
      message: 'Resident asked for confirmation that Premier Roofing can work around school run peak times.',
      isObjection: false,
      status: 'reviewing',
      documentId: 9,
      documentName: 'Contractor Quote - Premier Roofing'
    }
  ]);
  
  // Mock issues data for linking
  const buildingName = work.formData?.building || work.location || 'Riverside Apartments';
  
  const allIssues = [
    { id: '1', title: 'Leaking roof in apartment 3B causing water damage', building: buildingName, status: 'Open', issueRef: '#IS2001' },
    { id: '2', title: 'Broken heating system in communal areas', building: buildingName, status: 'Open', issueRef: '#IS2002' },
    { id: '3', title: 'Water damage in ground floor hallway', building: buildingName, status: 'In Progress', issueRef: '#IS2003' },
    { id: '4', title: 'Cracked windows in unit 5A need replacement', building: buildingName, status: 'Open', issueRef: '#IS2004' },
    { id: '5', title: 'Electrical fault in common area lighting', building: buildingName, status: 'Open', issueRef: '#IS2005' },
    { id: '6', title: 'Mold growth on bathroom ceiling', building: buildingName, status: 'Open', issueRef: '#IS2006' },
    { id: '7', title: 'Damaged carpet in main stairwell', building: buildingName, status: 'Open', issueRef: '#IS2007' },
    { id: '8', title: 'Faulty door lock on main entrance', building: buildingName, status: 'In Progress', issueRef: '#IS2008' },
    { id: '9', title: 'Damp issues in basement storage area', building: buildingName, status: 'Open', issueRef: '#IS2009' },
    { id: '10', title: 'Broken intercom system at entrance', building: buildingName, status: 'Open', issueRef: '#IS2010' },
    { id: '11', title: 'Cracks in external render on south wall', building: buildingName, status: 'Open', issueRef: '#IS2011' },
    { id: '12', title: 'Fire alarm system requires maintenance', building: buildingName, status: 'Open', issueRef: '#IS2012' },
    { id: '13', title: 'Blocked drainage causing flooding', building: buildingName, status: 'In Progress', issueRef: '#IS2013' },
    { id: '14', title: 'Lift mechanism making unusual noises', building: buildingName, status: 'Open', issueRef: '#IS2014' },
    { id: '15', title: 'Broken tiles in communal entrance', building: buildingName, status: 'Open', issueRef: '#IS2015' },
    { id: '16', title: 'Window frames deteriorating on upper floors', building: buildingName, status: 'Open', issueRef: '#IS2016' },
    { id: '17', title: 'Ventilation system not working properly', building: buildingName, status: 'Open', issueRef: '#IS2017' },
    { id: '18', title: 'Security gate requires repair', building: buildingName, status: 'Open', issueRef: '#IS2018' },
    { id: '19', title: 'Damaged guttering on east side', building: buildingName, status: 'Open', issueRef: '#IS2019' },
    { id: '20', title: 'Parking barrier malfunction', building: buildingName, status: 'In Progress', issueRef: '#IS2020' },
  ];
  
  // Handler functions for linking issues
  const handleToggleIssueSelection = (issueId: string) => {
    setSelectedIssuesToLink(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };
  
  const handleConfirmLinkIssues = () => {
    setLinkedIssues(prev => {
      const newLinked = [...prev];
      selectedIssuesToLink.forEach(issueId => {
        if (!newLinked.includes(issueId)) {
          newLinked.push(issueId);
        }
      });
      return newLinked;
    });
    setShowLinkIssueModal(false);
    setIssueSearchQuery('');
    setSelectedIssuesToLink([]);
  };
  
  const handleUnlinkIssue = (issueId: string) => {
    setLinkedIssues(prev => prev.filter(id => id !== issueId));
  };
  
  // Get available issues for the modal (filtered by building and excluding already linked)
  const getAvailableIssues = () => {
    return allIssues.filter(issue => 
      !linkedIssues.includes(issue.id)
    );
  };
  
  // Filter available issues by search query
  const getFilteredAvailableIssues = () => {
    const available = getAvailableIssues();
    if (!issueSearchQuery.trim()) return available;
    
    const query = issueSearchQuery.toLowerCase();
    return available.filter(issue => 
      issue.title.toLowerCase().includes(query) || 
      issue.issueRef.toLowerCase().includes(query)
    );
  };
  
  // Check if this is a new work - all stages should be pending
  const isNewWork = work.isNew || false;
  
  // Standard Section 20 consultation documents
  const getStandardDocuments = () => {
    return [
      { name: 'Notice of intention', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Draft' },
      { name: 'Structural Survey Report', type: 'Other', category: 'consultation', stage: 'Preparation', status: 'Draft' },
      { name: 'Consultation Estimates', type: 'Estimates', category: 'consultation', stage: 'Estimates', status: 'Draft' },
      { name: 'Right to be represented', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Draft' },
      { name: 'Notice of estimates', type: 'Letter', category: 'consultation', stage: 'Estimates', status: 'Draft' },
      { name: 'Right to nomination', type: 'Letter', category: 'consultation', stage: 'Tender', status: 'Draft' },
      { name: 'Award of contract', type: 'Letter', category: 'consultation', stage: 'Award', status: 'Draft' }
    ];
  };
  
  // Initialize documents from formData
  const getInitialDocuments = () => {
    if (isNewWork && work.formData) {
      const docs: any[] = [];
      let docId = 1;
      
      // Calculate leaseholder count inline
      const leaseholderCount = parseInt(work.formData.unitsAffected) || 24;
      
      // Add selected documents from past projects OR standard documents
      const documentsToAdd = work.formData.selectedDocuments && work.formData.selectedDocuments.length > 0
        ? work.formData.selectedDocuments
        : work.formData.autoCreateDocuments
        ? getStandardDocuments()
        : [];
      
      if (documentsToAdd.length > 0) {
        documentsToAdd.forEach((doc: any) => {
          // Determine proper category - consultation stays as is, everything else becomes 'project'
          const isConsultation = doc.category === 'consultation';
          const category = isConsultation ? 'consultation' : 'project';
          
          // For consultation documents, add required fields
          if (isConsultation) {
            docs.push({
              id: docId++,
              name: doc.name,
              type: doc.type,
              category: 'consultation',
              stage: doc.stage || 'Consultation',
              status: 'Draft',
              dueDate: work.formData.consultationStartDate ? new Date(work.formData.consultationStartDate).toLocaleDateString('en-GB').replace(/\//g, '/') : new Date().toLocaleDateString('en-GB'),
              sentDate: null,
              isOverdue: false,
              isDueSoon: false,
              recipients: [
                { label: 'Leaseholders', count: leaseholderCount }
              ],
              lastUpdated: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              lastUpdatedBy: 'System'
            });
          } else {
            // Project documents (technical, financial, legal, etc)
            docs.push({
              id: docId++,
              name: doc.name,
              type: doc.type,
              category: 'project',
              lastUpdated: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              lastUpdatedBy: 'System'
            });
          }
        });
      }
      
      // Add uploaded files as project documents
      if (work.formData.uploadedFiles && work.formData.uploadedFiles.length > 0) {
        work.formData.uploadedFiles.forEach((file: any) => {
          docs.push({
            id: docId++,
            name: file.name,
            type: 'Other',
            category: 'project',
            lastUpdated: new Date(file.uploadDate).toLocaleDateString('en-GB') + ', ' + new Date(file.uploadDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            lastUpdatedBy: 'System'
          });
        });
      }
      
      return docs;
    }
    
    // Default documents for existing projects
    return [
      {
        id: 1,
        name: 'Notice of intention',
        type: 'Letter',
        category: 'consultation',
        stage: 'Consultation',
        status: 'Send now',
        dueDate: '19/11/2025',
        sentDate: null,
        isOverdue: true,
        isDueSoon: false,
        recipients: [{ label: 'Leaseholders', count: 42 }],
        lastUpdated: '19/11/2025, 16:45',
        lastUpdatedBy: 'James Cooper'
      },
    {
      id: 2,
      name: 'Structural Survey Report',
      type: 'Other',
      category: 'consultation',
      stage: 'Preparation',
      status: 'Sent',
      dueDate: '19/11/2025',
      sentDate: '19/11/2025',
      isOverdue: false,
      isDueSoon: false,
      recipients: [{ label: 'Directors', count: 4 }],
      lastUpdated: '19/11/2025, 15:30',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 3,
      name: 'Building Safety Certificate',
      type: 'Certificate',
      category: 'consultation',
      stage: 'Preparation',
      status: 'Sent',
      dueDate: '19/11/2025',
      sentDate: '19/11/2025',
      isOverdue: false,
      isDueSoon: false,
      recipients: [
        { label: 'Directors', count: 5 },
        { label: 'Managing agent', count: 2 }
      ],
      lastUpdated: '19/11/2025, 10:00',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 4,
      name: 'Director Approval Email',
      type: 'Email',
      category: 'consultation',
      stage: 'First notice',
      status: 'Sent',
      dueDate: '19/11/2025',
      sentDate: '19/11/2025',
      isOverdue: false,
      isDueSoon: false,
      recipients: [{ label: 'Directors', count: 4 }],
      lastUpdated: '19/11/2025, 13:20',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 5,
      name: 'Initial Section 20 Notice to Lease...',
      type: 'Notice',
      category: 'consultation',
      stage: 'First notice',
      status: 'Sent',
      dueDate: '19/11/2025',
      sentDate: '19/11/2025',
      isOverdue: false,
      isDueSoon: false,
      recipients: [{ label: 'Leaseholders', count: 42 }],
      lastUpdated: '19/11/2025, 09:30',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 6,
      name: 'Leaseholder FAQ Document',
      type: 'Letter',
      category: 'consultation',
      stage: 'First notice',
      status: 'Ready to send',
      dueDate: '19/11/2025',
      sentDate: null,
      isOverdue: true,
      isDueSoon: false,
      recipients: [{ label: 'Leaseholders', count: 42 }],
      lastUpdated: '19/11/2025, 09:00',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 7,
      name: 'Contractor Quote - ABC Building...',
      type: 'Quote',
      category: 'consultation',
      stage: 'Quotes',
      status: 'Ready to send',
      dueDate: '19/11/2025',
      sentDate: null,
      isOverdue: false,
      isDueSoon: true,
      recipients: [
        { label: 'Leaseholders', count: 46 },
        { label: 'Directors', count: 4 }
      ],
      lastUpdated: '19/11/2025, 14:22',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 8,
      name: 'Contractor Quote - XYZ Constru...',
      type: 'Quote',
      category: 'consultation',
      stage: 'Consultation',
      status: 'Draft',
      dueDate: '19/11/2025',
      sentDate: null,
      isOverdue: false,
      isDueSoon: true,
      recipients: [
        { label: 'Leaseholders', count: 46 },
        { label: 'Directors', count: 3 }
      ],
      lastUpdated: '19/11/2025, 11:15',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 9,
      name: 'Contractor Quote - Premier Roofing',
      type: 'Quote',
      category: 'consultation',
      stage: 'Quotes',
      status: 'Awaiting approval',
      dueDate: '19/11/2025',
      sentDate: null,
      isOverdue: false,
      isDueSoon: true,
      recipients: [
        { label: 'Leaseholders', count: 46 },
        { label: 'Directors', count: 3 }
      ],
      lastUpdated: '19/11/2025, 10:30',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 10,
      name: 'Main Contractor Agreement',
      type: 'Contracts',
      category: 'project',
      lastUpdated: '18/11/2025, 14:20',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 11,
      name: 'Pre-Construction Meeting Notes',
      type: 'Site meeting minutes',
      category: 'project',
      lastUpdated: '15/11/2025, 10:00',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 12,
      name: 'Health & Safety F10 Notification',
      type: 'F10 / CDM docs',
      category: 'project',
      lastUpdated: '12/11/2025, 16:45',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 13,
      name: 'Payment Certificate - Phase 1',
      type: 'Certificates of payment',
      category: 'project',
      lastUpdated: '10/11/2025, 11:30',
      lastUpdatedBy: 'Sarah Mitchell'
    },
    {
      id: 14,
      name: 'Weekly Site Meeting - Week 4',
      type: 'Site meeting minutes',
      category: 'project',
      lastUpdated: '08/11/2025, 15:15',
      lastUpdatedBy: 'James Cooper'
    },
    {
      id: 15,
      name: 'CDM Regulations Compliance Doc',
      type: 'F10 / CDM docs',
      category: 'project',
      lastUpdated: '05/11/2025, 09:30',
      lastUpdatedBy: 'Sarah Mitchell'
    }];
  };
  
  const [documents, setDocuments] = useState(getInitialDocuments());
  
  // Get data from formData
  const getPropertyInfo = () => {
    if (!work.formData) return {
      apartmentCount: 0,
      address: '',
      leaseholderCount: 0
    };
    
    // Map estate/building to property details - using same structure as form
    const propertyMap: Record<string, Record<string, any>> = {
      'burns-court': {
        'riverside-block': { apartments: 12, address: '45 Thames Street, London • SE1 9RY', leaseholders: 24 },
        'parkview-block': { apartments: 18, address: '12 Park Avenue, London • SW1 2AB', leaseholders: 18 },
        'central-tower': { apartments: 20, address: '88 Central Road, London • EC1 5TY', leaseholders: 32 }
      },
      'west-side': {
        'riverside-block': { apartments: 24, address: '23 West Side Street, London • W2 3JK', leaseholders: 20 }
      },
      'east-end': {
        'riverside-block': { apartments: 20, address: '56 East End Road, London • E1 4RP', leaseholders: 15 }
      }
    };
    
    const estate = work.formData.estate;
    const building = work.formData.building;
    
    if (estate && building && propertyMap[estate]?.[building]) {
      const propertyData = propertyMap[estate][building];
      return {
        apartmentCount: propertyData.apartments,
        address: propertyData.address,
        leaseholderCount: propertyData.leaseholders
      };
    }
    
    // Default values if no match
    return {
      apartmentCount: parseInt(work.formData.unitsAffected) || 12,
      address: work.location || 'Property address not specified',
      leaseholderCount: parseInt(work.formData.unitsAffected) || 24
    };
  };
  
  const propertyInfo = getPropertyInfo();
  const leaseholderCount = propertyInfo.leaseholderCount;
  const leaseholderRecords = useMemo(() => {
    const seededLeaseholders = individualUsers
      .filter(user => user.group === 'Leaseholders')
      .map((user, index) => ({
        id: user.id,
        name: user.name,
        unit: `Flat ${101 + index}`,
        avatar: user.avatar,
        postalAddress: `${101 + index} Riverside Court, ${propertyInfo.address.split('•')[0].trim()}, London`
      }));
    const fallbackNames = [
      'Olivia Harris', 'Noah Turner', 'Sophia Walker', 'Liam Hall', 'Grace Young', 'Ethan King',
      'Chloe Wright', 'Mason Green', 'Ava Baker', 'Lucas Adams', 'Mia Nelson', 'Leo Carter',
      'Isla Phillips', 'Jack Evans', 'Ruby Collins', 'Oscar Stewart', 'Ella Sanchez', 'Archie Morris',
      'Freya Rogers', 'Harry Reed', 'Evie Cook', 'Henry Morgan', 'Sophie Bell', 'Theo Murphy',
      'Amelia Bailey', 'Charlie Rivera', 'Poppy Cooper', 'George Richardson', 'Lily Cox', 'Arthur Ward',
      'Zoe Peterson', 'Jacob Gray', 'Nora Ramirez', 'Adam James', 'Hannah Watson', 'Ryan Brooks',
      'Layla Kelly', 'Ben Sanders', 'Lucy Price', 'Tom Bennett', 'Jasmine Wood', 'Daniel Barnes'
    ];
    const generatedLeaseholders = Array.from({
      length: Math.max(leaseholderCount - seededLeaseholders.length, 0)
    }, (_, index) => {
      const name = fallbackNames[index % fallbackNames.length];
      const flatNumber = 101 + seededLeaseholders.length + index;
      return {
        id: `lh-generated-${index + 1}`,
        name,
        unit: `Flat ${flatNumber}`,
        avatar: name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        postalAddress: `${flatNumber} Riverside Court, ${propertyInfo.address.split('•')[0].trim()}, London`
      };
    });

    return [...seededLeaseholders, ...generatedLeaseholders];
  }, [individualUsers, leaseholderCount, propertyInfo.address]);
  
  // Check if all stages should be marked as completed
  const isCompleted = work.status === 'Completed';
  
  // Initialize stages from formData if available
  const getInitialStages = (): Stage[] => {
    if (isNewWork && work.formData?.selectedStages && work.formData.selectedStages.length > 0) {
      // Use custom stages from form
      return work.formData.selectedStages.map((stage: any) => ({
        id: stage.id || stage.name.toLowerCase().replace(/\s+/g, '-'),
        name: stage.name,
        status: 'pending' as const,
        tasks: (stage.tasks || []).map((task: string, idx: number) => ({
          id: `task-${idx}`,
          label: task,
          completed: false
        }))
      }));
    } else if (isNewWork) {
      // Default stages for new work
      return [
        {
          id: 'notice-intention',
          name: 'Notice of intention',
          status: 'pending',
          tasks: [
            { id: 'noi-drafted', label: 'NOI drafted and approved', completed: false },
            { id: 'noi-issued', label: 'NOI issued to all leaseholders', completed: false }
          ]
        },
        {
          id: 'tenders',
          name: 'Tenders',
          status: 'pending',
          tasks: [
            { id: 'tender-requested', label: 'Tender requested', completed: false },
            { id: 'contractor-identified', label: 'Preferred contractor identified', completed: false },
            { id: 'tender-shared', label: 'Tender shared with the clients', completed: false }
          ]
        },
        {
          id: 'statement-estimate',
          name: 'Statement of estimate',
          status: 'pending',
          tasks: [
            { id: 'estimates-reviewed', label: 'Estimates reviewed and approved', completed: false },
            { id: 'statement-sent', label: 'Statement of estimate sent to leaseholders', completed: false },
            { id: 'observation-completed', label: 'Observation period completed', completed: false }
          ]
        },
        {
          id: 'notice-reasons',
          name: 'Notice of reasons',
          status: 'pending',
          tasks: [
            { id: 'reasons-drafted', label: 'Notice of reasons drafted (if required)', completed: false },
            { id: 'issued-leaseholders', label: 'Issued to leaseholders', completed: false },
            { id: 'clear-contents', label: 'Confirms contractor appointment', completed: false }
          ]
        },
        {
          id: 'completion',
          name: 'Completion',
          status: 'pending',
          tasks: [
            { id: 'works-completed', label: 'Works completed', completed: false },
            { id: 'invoice-approved', label: 'Final invoice approved', completed: false },
            { id: 'issues-closed', label: 'Issues closed', completed: false }
          ]
        }
      ];
    } else {
      // Check if this work should have delayed stages (only for IDs 1 and 8)
      const hasDelayedNotice = work.id === '1' || work.id === '8';
      const hasDelayedTenders = work.id === '1'; // Only work ID 1 has delayed Tenders
      
      // Existing project stages
      return [
        {
          id: 'notice-intention',
          name: 'Notice of intention',
          status: isCompleted ? 'completed' : (hasDelayedNotice ? 'active' : 'completed'),
          tasks: [
            { id: 'noi-drafted', label: 'NOI drafted and approved', completed: true },
            { id: 'noi-issued', label: 'NOI issued to all leaseholders', completed: hasDelayedNotice ? false : true }
          ],
          ...(hasDelayedNotice ? {
            isDelayed: true,
            deadline: {
              daysLeft: -5,
              totalDays: 30
            }
          } : {
            deadline: {
              daysLeft: 30,
              totalDays: 30
            }
          })
        },
        {
          id: 'tenders',
          name: 'Tenders',
          status: isCompleted ? 'completed' : (hasDelayedNotice ? 'pending' : (hasDelayedTenders ? 'active' : 'active')),
          tasks: [
            { id: 'tender-requested', label: 'Tender requested', completed: hasDelayedNotice ? false : true },
            { id: 'contractor-identified', label: 'Preferred contractor identified', completed: isCompleted ? true : (hasDelayedTenders ? false : false) },
            { id: 'tender-shared', label: 'Tender shared with the clients', completed: isCompleted ? true : false }
          ],
          ...(hasDelayedTenders ? {
            isDelayed: true,
            deadline: {
              daysLeft: -3,
              totalDays: 10
            }
          } : (!hasDelayedNotice && !isCompleted ? {
            deadline: {
              daysLeft: 7,
              totalDays: 10
            }
          } : {}))
        },
        {
          id: 'statement-estimate',
          name: 'Statement of estimate',
          status: isCompleted ? 'completed' : 'pending',
          tasks: [
            { id: 'estimates-reviewed', label: 'Estimates reviewed and approved', completed: isCompleted ? true : false },
            { id: 'statement-sent', label: 'Statement of estimate sent to leaseholders', completed: isCompleted ? true : false },
            { id: 'observation-completed', label: 'Observation period completed', completed: isCompleted ? true : false }
          ],
          deadline: {
            daysLeft: 21,
            totalDays: 30
          }
        },
        {
          id: 'notice-reasons',
          name: lowestQuoteAccepted ? 'Notice of award' : 'Notice of reasons',
          status: isCompleted ? 'completed' : 'pending',
          tasks: [
            { 
              id: 'reasons-drafted', 
              label: lowestQuoteAccepted ? 'Notice of award drafted (if required)' : 'Notice of reasons drafted (if required)', 
              completed: isCompleted ? true : false 
            },
            { 
              id: 'issued-leaseholders', 
              label: 'Issued to leaseholders', 
              completed: isCompleted ? true : false 
            },
            { 
              id: 'clear-contents', 
              label: 'Confirms contractor appointment', 
              completed: isCompleted ? true : false 
            }
          ]
        },
        {
          id: 'completion',
          name: 'Completion',
          status: isCompleted ? 'completed' : 'pending',
          tasks: [
            { id: 'works-completed', label: 'Works completed', completed: isCompleted ? true : false },
            { id: 'invoice-approved', label: 'Final invoice approved', completed: isCompleted ? true : false },
            { id: 'issues-closed', label: 'Issues closed', completed: isCompleted ? true : false }
          ]
        }
      ];
    }
  };
  
  const [stages, setStages] = useState<Stage[]>(getInitialStages());

  const respondedLeaseholderCount = new Set(observations.map(observation => observation.leaseholderId)).size;
  const totalObservationEntries = observations.length;
  const objectionCount = observations.filter(observation => observation.isObjection).length;
  const currentStageDocuments = useMemo(
    () => documents.filter((document: any) => document.category === 'consultation'),
    [documents]
  );

  const unresolvedObservationCount = observations.filter(observation => observation.status !== 'responded').length;
  const addressedObservationCount = observations.filter(observation => observation.status === 'responded').length;
  const isObservationPriorityStage = ['first-notice', 'statement-of-estimate', 'notice-of-reasons'].includes(currentConsultationStage);

  const observationNoticeSummaries = useMemo(() => {
    const summaryMap = new Map<string, {
      documentId: string | number;
      documentName: string;
      stage: ConsultationStage;
      responses: number;
      objections: number;
      latestReceivedOn?: string;
    }>();

    observations.forEach(observation => {
      const key = String(observation.documentId || observation.stage);
      const existing = summaryMap.get(key);

      if (!existing) {
        summaryMap.set(key, {
          documentId: observation.documentId || key,
          documentName: observation.documentName || CONSULTATION_STAGE_LABELS[observation.stage],
          stage: observation.stage,
          responses: 1,
          objections: observation.isObjection ? 1 : 0,
          latestReceivedOn: observation.receivedOn
        });
        return;
      }

      existing.responses += 1;
      existing.objections += observation.isObjection ? 1 : 0;
      if (!existing.latestReceivedOn || new Date(observation.receivedOn).getTime() > new Date(existing.latestReceivedOn).getTime()) {
        existing.latestReceivedOn = observation.receivedOn;
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) =>
      new Date(b.latestReceivedOn || 0).getTime() - new Date(a.latestReceivedOn || 0).getTime()
    );
  }, [observations]);

  const overviewAttentionItems = useMemo(() => {
    if (isNewWork) {
      return [
        {
          source: 'Setup',
          title: 'No consultation started',
          detail: 'Create the first consultation documents to begin the Section 20 process.',
          tone: 'secondary' as const,
          actionLabel: 'Open documents',
          targetTab: 'documents' as const
        }
      ];
    }

    const items: {
      source: string;
      title: string;
      where?: string;
      when?: string;
      detail: string;
      tone: 'critical' | 'warning' | 'info' | 'secondary';
      actionLabel: string;
      targetTab: 'documents' | 'issues';
      targetDocumentId?: string | number;
    }[] = [];

    if (objectionCount > 0 && isObservationPriorityStage) {
      items.push({
        source: 'Observations',
        title: `${objectionCount} objection${objectionCount === 1 ? '' : 's'} unresolved`,
        where: observationNoticeSummaries[0]?.documentName || 'Active consultation notice',
        when: observationNoticeSummaries[0]?.latestReceivedOn
          ? new Date(observationNoticeSummaries[0].latestReceivedOn).toLocaleDateString('en-GB')
          : undefined,
        detail: 'Needs review before the consultation stage can be closed out.',
        tone: objectionCount >= 3 ? 'critical' : 'warning',
        actionLabel: 'Review observations',
        targetTab: 'documents',
        targetDocumentId: observationNoticeSummaries[0]?.documentId
      });
    }

    if (unresolvedObservationCount > 0 && isObservationPriorityStage) {
      items.push({
        source: 'Observations',
        title: `${unresolvedObservationCount} response${unresolvedObservationCount === 1 ? '' : 's'} still open`,
        where: observationNoticeSummaries[0]?.documentName || 'Active consultation notice',
        when: observationNoticeSummaries[0]?.latestReceivedOn
          ? new Date(observationNoticeSummaries[0].latestReceivedOn).toLocaleDateString('en-GB')
          : undefined,
        detail: 'Leaseholder responses still need PM action before consultation closure.',
        tone: unresolvedObservationCount >= 6 ? 'critical' : 'warning',
        actionLabel: 'Review observations',
        targetTab: 'documents',
        targetDocumentId: observationNoticeSummaries[0]?.documentId
      });
    }

    const draftConsultationDocs = currentStageDocuments.filter((document: any) => document.status === 'Draft');
    if (draftConsultationDocs.length > 0) {
      items.push({
        source: 'Documents',
        title: `${draftConsultationDocs.length} consultation document${draftConsultationDocs.length === 1 ? '' : 's'} still draft`,
        where: draftConsultationDocs[0]?.name,
        when: draftConsultationDocs[0]?.lastUpdated,
        detail: 'Required consultation notices are still draft and block safe progression.',
        tone: draftConsultationDocs.length >= 2 ? 'critical' : 'warning',
        actionLabel: 'Open draft',
        targetTab: 'documents',
        targetDocumentId: draftConsultationDocs[0]?.id
      });
    }

    const generatedButNotSent = currentStageDocuments.filter((document: any) => document.postalPackGeneratedAt && !document.sentDate);
    if (generatedButNotSent.length > 0) {
      items.push({
        source: 'Delivery',
        title: `${generatedButNotSent.length} document${generatedButNotSent.length === 1 ? '' : 's'} generated but not marked sent`,
        where: generatedButNotSent[0]?.name,
        when: generatedButNotSent[0]?.postalPackGeneratedAt,
        detail: 'Confirm issue once postal or email delivery has actually happened.',
        tone: generatedButNotSent.length >= 2 ? 'critical' : 'warning',
        actionLabel: 'Open delivery',
        targetTab: 'documents',
        targetDocumentId: generatedButNotSent[0]?.id
      });
    }

    return items.slice(0, 4);
  }, [
    currentStageDocuments,
    isNewWork,
    isObservationPriorityStage,
    objectionCount,
    observationNoticeSummaries,
    unresolvedObservationCount
  ]);

  const overviewKeyUpdates = useMemo(() => {
    const formatUpdateTimestamp = (value?: string | null) => {
      if (!value) return undefined;
      if (value.includes(',') && /\d{2}\/\d{2}\/\d{4}/.test(value)) return value;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    if (isNewWork) {
      return [
        {
          source: 'Setup',
          title: 'Major works created',
          where: 'Overview',
          when: formatUpdateTimestamp(work.createdOn),
          actor: work.propertyManager || 'System',
          detail: 'No live consultation, document, or contractor activity yet.',
          actionLabel: 'Open documents',
          targetTab: 'documents' as const
        }
      ];
    }

    const updates: {
      source: string;
      title: string;
      where?: string;
      when?: string;
      actor?: string;
      detail: string;
      actionLabel: string;
      targetTab: 'documents' | 'issues';
      targetDocumentId?: string | number;
    }[] = [];

    const latestSentConsultationDoc = [...currentStageDocuments]
      .filter((document: any) => document.sentDate)
      .sort((a: any, b: any) => new Date(b.sentDate || 0).getTime() - new Date(a.sentDate || 0).getTime())[0];

    if (latestSentConsultationDoc) {
      updates.push({
        source: 'Documents',
        title: `${latestSentConsultationDoc.lastUpdatedBy || 'PM'} sent ${latestSentConsultationDoc.name}`,
        where: latestSentConsultationDoc.stage,
        when: formatUpdateTimestamp(latestSentConsultationDoc.sentDate),
        actor: latestSentConsultationDoc.lastUpdatedBy,
        detail: `Marked sent in delivery for ${latestSentConsultationDoc.name}.`,
        actionLabel: 'Open document',
        targetTab: 'documents',
        targetDocumentId: latestSentConsultationDoc.id
      });
    }

    if (observationNoticeSummaries[0] && observationNoticeSummaries[0].objections === 0) {
      updates.push({
        source: 'Observations',
        title: `${observationNoticeSummaries[0].responses} leaseholder response${observationNoticeSummaries[0].responses === 1 ? '' : 's'} logged`,
        where: CONSULTATION_STAGE_LABELS[observationNoticeSummaries[0].stage],
        when: formatUpdateTimestamp(observationNoticeSummaries[0].latestReceivedOn),
        actor: 'Leaseholders',
        detail: `Latest against ${observationNoticeSummaries[0].documentName}.`,
        actionLabel: 'Review observations',
        targetTab: 'documents',
        targetDocumentId: observationNoticeSummaries[0].documentId
      });
    }

    if (cdmAssessment || tendersCdmAssessment || cdmAdditionalChecks.hseF10Submitted) {
      updates.push({
        source: 'Compliance',
        title: `${currentStageDocuments[0]?.lastUpdatedBy || 'PM'} updated CDM compliance checks`,
        where: 'CDM',
        when: formatUpdateTimestamp(currentStageDocuments[0]?.lastUpdated),
        actor: currentStageDocuments[0]?.lastUpdatedBy || 'Property manager',
        detail: 'CDM requirements were reviewed and updated for this major works.',
        actionLabel: 'Open documents',
        targetTab: 'documents'
      });
    }

    return updates.slice(0, 4);
  }, [
    cdmAdditionalChecks.hseF10Submitted,
    cdmAssessment,
    currentStageDocuments,
    isNewWork,
    observationNoticeSummaries,
    tendersCdmAssessment,
    work.createdOn,
    work.propertyManager
  ]);

  const handleOverviewAction = (targetTab: 'documents' | 'issues', targetDocumentId?: string | number) => {
    if (targetTab === 'documents') {
      setActiveTab('documents');
      setDocumentSegment('consultation');

      if (targetDocumentId !== undefined) {
        const targetDocument = documents.find((document: any) => String(document.id) === String(targetDocumentId));
        if (targetDocument) {
          setSelectedDocument(targetDocument);
          setShowDocumentDetail(true);
        }
      }
      return;
    }

    setActiveTab(targetTab);
  };

  const toggleStage = (stageId: string) => {
    setExpandedStage(prev => prev === stageId ? null : stageId);
  };

  // Check if a stage can have its tasks checked (all previous stages must be completed)
  const canCheckTasks = (stageId: string) => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    // Check all previous stages
    for (let i = 0; i < stageIndex; i++) {
      const prevStage = stages[i];
      const allTasksCompleted = prevStage.tasks.every(task => task.completed);
      if (!allTasksCompleted) {
        return false;
      }
    }
    return true;
  };

  const toggleTask = (stageId: string, taskId: string) => {
    // Check if this stage can have tasks checked
    if (!canCheckTasks(stageId)) {
      alert('Please complete all tasks in previous stages first.');
      return;
    }

    setStages(prev =>
      prev.map((stage, index) => {
        if (stage.id === stageId) {
          // Update the task
          const updatedTasks = stage.tasks.map(task =>
            task.id === taskId
              ? { ...task, completed: !task.completed }
              : task
          );
          
          // Determine new status based on tasks
          const completedCount = updatedTasks.filter(t => t.completed).length;
          const totalCount = updatedTasks.length;
          
          let newStatus: 'completed' | 'active' | 'pending' = 'pending';
          if (completedCount === totalCount) {
            newStatus = 'completed';
          } else if (completedCount > 0) {
            newStatus = 'active';
          }
          
          return {
            ...stage,
            tasks: updatedTasks,
            status: newStatus
          };
        }
        return stage;
      })
    );
  };

  const toggleCdmCheck = (stageId: string, checkName: string, currentValue: boolean) => {
    if (!canCheckTasks(stageId)) {
      alert('Please complete all tasks in previous stages first.');
      return;
    }

    setCdmAdditionalChecks(prev => ({
      ...prev,
      [checkName]: !currentValue
    }));
  };

  const getStageIcon = (stage: Stage) => {
    if (stage.status === 'completed') {
      return (
        <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
          <CheckCircle size={28} />
        </div>
      );
    } else if (stage.status === 'active') {
      return (
        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center hourglass-container" style={{ width: '60px', height: '60px' }}>
          <Hourglass size={28} className="hourglass-icon" />
        </div>
      );
    } else {
      return (
        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', backgroundColor: '#e9ecef' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#adb5bd', borderRadius: '50%' }} />
        </div>
      );
    }
  };



  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Category filter (consultation vs project)
    if (doc.category !== documentSegment) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        doc.name.toLowerCase().includes(query) ||
        (doc.recipients && doc.recipients.some(r => r.label.toLowerCase().includes(query))) ||
        doc.lastUpdatedBy.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (typeFilter !== 'All types' && doc.type !== typeFilter) {
      return false;
    }

    // Status filter (only for consultation documents)
    if (documentSegment === 'consultation' && statusFilter !== 'All statuses' && doc.status !== statusFilter) {
      return false;
    }

    // Due/Overdue filter (only for consultation documents)
    if (documentSegment === 'consultation' && showDueOverdue && !doc.isOverdue && !doc.isDueSoon) {
      return false;
    }

    return true;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'stage':
        aValue = a.stage ? a.stage.toLowerCase() : '';
        bValue = b.stage ? b.stage.toLowerCase() : '';
        break;
      case 'status':
        aValue = a.status ? a.status.toLowerCase() : '';
        bValue = b.status ? b.status.toLowerCase() : '';
        break;
      case 'dueDate':
        aValue = a.dueDate;
        bValue = b.dueDate;
        break;
      case 'sentDate':
        aValue = a.sentDate || '';
        bValue = b.sentDate || '';
        break;
      case 'lastUpdated':
        aValue = a.lastUpdated;
        bValue = b.lastUpdated;
        break;
      case 'lastUpdatedBy':
        aValue = a.lastUpdatedBy.toLowerCase();
        bValue = b.lastUpdatedBy.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleObservationStatusChange = (observationId: string, status: Observation['status']) => {
    setObservations(prev =>
      prev.map(observation =>
        observation.id === observationId ? { ...observation, status } : observation
      )
    );
  };

  const handleObservationCreate = (
    document: { id: number | string; name: string; stage?: string },
    form: ObservationFormState
  ) => {
    if (!form.leaseholderId || !form.message.trim()) {
      return;
    }

    const leaseholder = leaseholderRecords.find(user => user.id === form.leaseholderId);
    if (!leaseholder) {
      return;
    }

    const noticeStage =
      consultationStageMap[(document.stage || '').toLowerCase()] || currentConsultationStage;

    setObservations(prev => [
      {
        id: `obs-${prev.length + 1}`,
        workId: work.id,
        leaseholderId: leaseholder.id,
        leaseholderName: leaseholder.name,
        stage: noticeStage,
        receivedOn: new Date().toISOString(),
        channel: form.channel,
        message: form.message.trim(),
        isObjection: form.isObjection,
        status: 'new',
        documentId: document.id,
        documentName: document.name
      },
      ...prev
    ]);
  };

  const handleObservationUpdate = (
    observationId: string,
    form: ObservationFormState
  ) => {
    if (!form.leaseholderId || !form.message.trim()) {
      return;
    }

    const leaseholder = leaseholderRecords.find(user => user.id === form.leaseholderId);
    if (!leaseholder) {
      return;
    }

    setObservations(prev =>
      prev.map(observation =>
        observation.id === observationId
          ? {
              ...observation,
              leaseholderId: leaseholder.id,
              leaseholderName: leaseholder.name,
              channel: form.channel,
              message: form.message.trim(),
              isObjection: form.isObjection
            }
          : observation
      )
    );
  };

  const handleObservationDelete = (observationId: string) => {
    setObservations(prev => prev.filter(observation => observation.id !== observationId));
  };

  // Pagination
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = sortedDocuments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle document modal
  const handleNewDocumentClick = () => {
    if (documentSegment === 'project') {
      setShowNewProjectDocumentModal(true);
    } else {
      setShowNewDocumentModal(true);
    }
  };

  const handleDocumentModalClose = () => {
    setShowNewDocumentModal(false);
  };

  const handleProjectDocumentModalClose = () => {
    setShowNewProjectDocumentModal(false);
  };

  const handleDocumentSubmit = (data: any) => {
    // Check if this is a project document or consultation document
    const isProjectDoc = !data.recipients;
    
    const baseDocument = {
      id: documents.length + 1,
      name: data.documentName || 'Untitled Document',
      type: data.documentType.charAt(0).toUpperCase() + data.documentType.slice(1),
      lastUpdated: new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      lastUpdatedBy: 'Ahsan Jalil'
    };

    let newDocument;
    
    if (isProjectDoc) {
      // Project document structure
      newDocument = {
        ...baseDocument,
        category: 'project' as const,
        visibility: data.visibility || 'visible-to-all'
      };
    } else {
      // Consultation document structure
      newDocument = {
        ...baseDocument,
        category: 'consultation' as const,
        stage: data.stage || 'Not set',
        status: 'Draft',
        dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }).replace(/\//g, '/') : '19/11/2025',
        sentDate: null,
        isOverdue: false,
        isDueSoon: false,
        recipients: Object.entries(data.recipients)
          .filter(([key, value]) => value)
          .map(([key]) => {
            const recipientMap: { [key: string]: { label: string; count: number } } = {
              leaseholders: { label: 'Leaseholders', count: 42 },
              directors: { label: 'Directors', count: 4 },
              managingAgents: { label: 'Managing agent', count: 1 },
              freeholders: { label: 'Freeholders', count: 1 }
            };
            return recipientMap[key];
          })
      };
    }
    
    setDocuments([newDocument, ...documents]);
    setShowNewDocumentModal(false);
    setShowNewProjectDocumentModal(false);
  };

  const handleDocumentUpdate = (documentId: number | string, updates: any) => {
    setDocuments(prev =>
      prev.map(document =>
        document.id === documentId
          ? { ...document, ...updates }
          : document
      )
    );
    setSelectedDocument((prev: any) =>
      prev && prev.id === documentId
        ? { ...prev, ...updates }
        : prev
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Send now': 
        return { backgroundColor: '#fce8ec', color: '#b91c1c', borderRadius: '16px' };
      case 'Sent': 
        return { backgroundColor: '#d1f4e0', color: '#15803d', borderRadius: '16px' };
      case 'Ready to send': 
        return { backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '16px' };
      case 'Draft': 
        return { backgroundColor: '#e5e7eb', color: '#4b5563', borderRadius: '16px' };
      case 'Awaiting approval': 
        return { backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '16px' };
      default: 
        return { backgroundColor: '#e5e7eb', color: '#4b5563', borderRadius: '16px' };
    }
  };

  // Handler for edit form submission
  const handleEditSubmit = (updatedData: any) => {
    // Update the work data locally
    Object.assign(work, updatedData);
    setEditedTitle(updatedData.title);
    
    // Call parent's update handler if provided
    if (onUpdateWork) {
      onUpdateWork(work.id, updatedData);
    }
    
    if (onEditModeChange) {
      onEditModeChange(false);
    }
  };

  // Show edit form if user clicked edit
  if (isEditMode) {
    return (
      <MajorWorksForm
        mode="edit"
        initialData={work}
        onCancel={() => onEditModeChange && onEditModeChange(false)}
        onSubmit={handleEditSubmit}
      />
    );
  }

  return (
    <div className="container-fluid p-4">
      <style>{`
        .stage-tasks-expand {
          overflow: hidden;
          animation: expandDown 0.4s ease-out;
          transform-origin: top;
        }
        
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: scaleY(0.8);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: scaleY(1);
          }
        }
        
        .hourglass-container {
          position: relative;
        }
        
        .hourglass-icon {
          animation: hourglassRotate 2s ease-in-out infinite;
        }
        
        @keyframes hourglassRotate {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(180deg);
          }
        }
        
        .last-child-no-border:last-child {
          border-bottom: none !important;
        }
      `}</style>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              {!isEditingTitle ? (
                <>
                  <h2 className="mb-0">{editedTitle}</h2>
                  {work.status && (
                    <span className={`badge ${getStatusBadgeClass(work.status)}`}>
                      {work.status}
                    </span>
                  )}
                  <button 
                    className="btn btn-link p-0 text-muted"
                    onClick={() => onEditModeChange && onEditModeChange(true)}
                    style={{ opacity: 0.6 }}
                  >
                    <img src={editIcon} alt="Edit" style={{ width: '24px', height: '24px' }} />
                  </button>
                </>
              ) : (
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <input 
                    type="text"
                    className="form-control"
                    style={{ maxWidth: '500px' }}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingTitle(false);
                      } else if (e.key === 'Escape') {
                        setEditedTitle(work.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                  <button 
                    className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    <Check size={16} />
                    Save
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    onClick={() => {
                      setEditedTitle(work.title);
                      setIsEditingTitle(false);
                    }}
                  >
                    <XIcon size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-3 text-muted">
              <span className="d-flex align-items-center gap-1">
                <Building2 size={16} />
                {propertyInfo.apartmentCount} Apartments
              </span>
              <a 
                href="#" 
                className="text-decoration-none"
                style={{ color: '#0B81C5' }}
                onClick={(e) => e.preventDefault()}
              >
                {propertyInfo.address}
              </a>
              <span className="d-flex align-items-center gap-1">
                <Users size={16} />
                {propertyInfo.leaseholderCount} Leaseholders
              </span>
            </div>
          </div>
          <button 
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => {
              // Prepare data for PDF
              const pdfData = {
                id: work.id,
                title: work.title,
                estate: work.location.split(' - ')[0] || 'N/A',
                status: work.status || 'In Progress',
                progress: 65,
                budget: 450000,
                startDate: '15/01/2024',
                expectedCompletion: '30/06/2025',
                description: work.formData?.description || 'Comprehensive roof replacement and waterproofing project for Riverside Apartments. This major works project involves the complete removal and replacement of the existing roof structure, including improved insulation and drainage systems.',
                unitsAffected: '45 properties',
                residentsNotified: '42 leaseholders',
                contractors: '3 companies',
                planningDate: '01/12/2023',
                section20Date: '15/12/2023',
                contractorDate: '15/01/2024',
                documents: documents.map(doc => ({
                  name: doc.name,
                  type: doc.type,
                  date: doc.dueDate,
                  status: doc.status
                }))
              };
              generateMajorWorkDetailPDF(pdfData);
            }}
          >
            <Download size={18} />
            Download report
          </button>
        </div>

        {/* Timeline */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-4">
            {/* Horizontal Progress Bar - Desktop */}
            <div className="position-relative d-none d-md-block">
              {/* Horizontal connecting line */}
              <div 
                className="position-absolute" 
                style={{ 
                  top: '30px',
                  left: '30px',
                  right: '30px',
                  height: '2px',
                  backgroundColor: '#dee2e6',
                  zIndex: 0
                }}
              />
              
              {/* Stages in horizontal layout */}
              <div className="d-flex justify-content-between position-relative">
                {stages.map((stage, stageIndex) => (
                  <div key={stage.id} className="d-flex flex-column align-items-center" style={{ flex: 1, zIndex: 1 }}>
                    {/* Stage icon */}
                    <div 
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleStage(stage.id)}
                    >
                      {getStageIcon(stage)}
                    </div>
                    
                    {/* Stage name and status */}
                    <div className="text-center mt-3 mb-3" style={{ minWidth: '180px' }}>
                      <div 
                        className="fw-medium mb-2 d-flex align-items-center justify-content-center"
                        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <span>{stage.name}</span>
                        {expandedStage === stage.id ? (
                          <ChevronUp size={16} className="ms-1 text-primary" />
                        ) : (
                          <ChevronDown size={16} className="ms-1 text-primary" />
                        )}
                      </div>
                      
                      {/* Status and Deadline in same line */}
                      <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        {stage.status === 'completed' && (
                          <span className="badge bg-success">Completed</span>
                        )}
                        {stage.status === 'active' && !stage.isDelayed && (
                          <span className="badge bg-primary">In Progress</span>
                        )}
                        {stage.status === 'active' && stage.isDelayed && (
                          <span className="badge bg-danger d-flex align-items-center gap-1">
                            <AlertTriangle size={12} />
                            Delayed
                          </span>
                        )}
                        {stage.status === 'pending' && (
                          <span className="badge bg-secondary">Pending</span>
                        )}
                        
                        {/* Deadline indicator */}
                        {stage.deadline && (stage.status === 'active' || stage.status === 'pending') && (
                          <>
                            {stage.deadline.daysLeft < 0 ? (
                              <div className="d-flex align-items-center gap-1 text-danger small">
                                <AlertTriangle size={14} />
                                <span className="fw-medium">{Math.abs(stage.deadline.daysLeft)} days overdue</span>
                              </div>
                            ) : stage.deadline.daysLeft <= 7 ? (
                              <div className="d-flex align-items-center gap-1 text-danger small">
                                <Clock size={14} />
                                <span className="fw-medium">{stage.deadline.daysLeft} days left</span>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-1 text-muted small">
                                <Clock size={14} />
                                <span>{stage.deadline.daysLeft} days left</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical Progress Bar - Mobile */}
            <div className="position-relative d-md-none">
              {/* Vertical connecting line */}
              <div 
                className="position-absolute" 
                style={{ 
                  top: '30px',
                  left: '30px',
                  bottom: '30px',
                  width: '2px',
                  backgroundColor: '#dee2e6',
                  zIndex: 0
                }}
              />
              
              {/* Stages in vertical layout */}
              <div className="d-flex flex-column position-relative">
                {stages.map((stage, stageIndex) => (
                  <div key={stage.id} className="d-flex align-items-start mb-4" style={{ zIndex: 1 }}>
                    {/* Stage icon */}
                    <div 
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={() => toggleStage(stage.id)}
                    >
                      {getStageIcon(stage)}
                    </div>
                    
                    {/* Stage name and status */}
                    <div className="ms-3 flex-grow-1">
                      <div 
                        className="fw-medium mb-2 d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <span>{stage.name}</span>
                        {expandedStage === stage.id ? (
                          <ChevronUp size={16} className="ms-1 text-primary" />
                        ) : (
                          <ChevronDown size={16} className="ms-1 text-primary" />
                        )}
                      </div>
                      
                      {/* Status and Deadline */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        {stage.status === 'completed' && (
                          <span className="badge bg-success">Completed</span>
                        )}
                        {stage.status === 'active' && !stage.isDelayed && (
                          <span className="badge bg-primary">In Progress</span>
                        )}
                        {stage.status === 'active' && stage.isDelayed && (
                          <span className="badge bg-danger d-flex align-items-center gap-1">
                            <AlertTriangle size={12} />
                            Delayed
                          </span>
                        )}
                        {stage.status === 'pending' && (
                          <span className="badge bg-secondary">Pending</span>
                        )}
                        
                        {/* Deadline indicator */}
                        {stage.deadline && (stage.status === 'active' || stage.status === 'pending') && (
                          <>
                            {stage.deadline.daysLeft < 0 ? (
                              <div className="d-flex align-items-center gap-1 text-danger small">
                                <AlertTriangle size={14} />
                                <span className="fw-medium">{Math.abs(stage.deadline.daysLeft)} days overdue</span>
                              </div>
                            ) : stage.deadline.daysLeft <= 7 ? (
                              <div className="d-flex align-items-center gap-1 text-danger small">
                                <Clock size={14} />
                                <span className="fw-medium">{stage.deadline.daysLeft} days left</span>
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-1 text-muted small">
                                <Clock size={14} />
                                <span>{stage.deadline.daysLeft} days left</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Expandable task sections below the horizontal bar */}
            {stages.map((stage) => (
              expandedStage === stage.id && (
                <div key={`tasks-${stage.id}`} className="mt-3 p-3 bg-light rounded stage-tasks-expand">
                  <h6 className="mb-3 text-primary">{stage.name} - Tasks</h6>
                  
                  {/* Delay explanation prompt - only show for delayed stages that are not completed */}
                  {stage.isDelayed && stage.status !== 'completed' && (
                    <div className="alert alert-warning mb-3 d-flex align-items-center" role="alert">
                      <AlertTriangle size={16} className="me-2 flex-shrink-0" />
                      <span className="small">This stage is delayed and may need timeline or document follow-up.</span>
                    </div>
                  )}
                  
                  <div className="row">
                    {stage.id === 'completion' && (Object.values(cdmReasons).some(v => v)) && (
                      <>
                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="hseF10Submitted"
                              checked={cdmAdditionalChecks.hseF10Submitted}
                              onChange={() => toggleCdmCheck('completion', 'hseF10Submitted', cdmAdditionalChecks.hseF10Submitted)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="hseF10Submitted"
                              style={{
                                textDecoration: cdmAdditionalChecks.hseF10Submitted ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.hseF10Submitted ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              HSE F10 notification submitted
                            </label>
                          </div>
                        </div>

                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="constructionPhasePlan"
                              checked={cdmAdditionalChecks.constructionPhasePlan}
                              onChange={() => toggleCdmCheck('completion', 'constructionPhasePlan', cdmAdditionalChecks.constructionPhasePlan)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="constructionPhasePlan"
                              style={{
                                textDecoration: cdmAdditionalChecks.constructionPhasePlan ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.constructionPhasePlan ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              Construction Phase Plan in place
                            </label>
                          </div>
                        </div>

                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="healthSafetyFile"
                              checked={cdmAdditionalChecks.healthSafetyFile}
                              onChange={() => toggleCdmCheck('completion', 'healthSafetyFile', cdmAdditionalChecks.healthSafetyFile)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="healthSafetyFile"
                              style={{
                                textDecoration: cdmAdditionalChecks.healthSafetyFile ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.healthSafetyFile ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              Health & Safety File prepared for handover
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {stage.tasks.map((task) => (
                      <div key={task.id} className="col-md-4 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`${stage.id}-${task.id}`}
                            checked={task.completed}
                            onChange={() => toggleTask(stage.id, task.id)}
                            style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                          />
                          <label 
                            className="form-check-label ms-2" 
                            htmlFor={`${stage.id}-${task.id}`}
                            style={{ 
                              textDecoration: task.completed ? 'line-through' : 'none',
                              color: task.completed ? '#6c757d' : 'inherit',
                              fontSize: '16px',
                              lineHeight: '1.5'
                            }}
                          >
                            {task.label}
                          </label>
                        </div>
                      </div>
                    ))}

                    {stage.id === 'notice-reasons' && (Object.values(cdmReasons).some(v => v)) && (
                      <>
                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="principalDesigner"
                              checked={cdmAdditionalChecks.principalDesigner}
                              onChange={() => toggleCdmCheck('notice-reasons', 'principalDesigner', cdmAdditionalChecks.principalDesigner)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="principalDesigner"
                              style={{
                                textDecoration: cdmAdditionalChecks.principalDesigner ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.principalDesigner ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              Principal Designer appointed
                            </label>
                          </div>
                        </div>

                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="principalContractor"
                              checked={cdmAdditionalChecks.principalContractor}
                              onChange={() => toggleCdmCheck('notice-reasons', 'principalContractor', cdmAdditionalChecks.principalContractor)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="principalContractor"
                              style={{
                                textDecoration: cdmAdditionalChecks.principalContractor ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.principalContractor ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              Principal Contractor appointed
                            </label>
                          </div>
                        </div>

                        <div className="col-md-4 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="hseF10"
                              checked={cdmAdditionalChecks.hseF10}
                              onChange={() => toggleCdmCheck('notice-reasons', 'hseF10', cdmAdditionalChecks.hseF10)}
                              style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                            />
                            <label
                              className="form-check-label ms-2"
                              htmlFor="hseF10"
                              style={{
                                textDecoration: cdmAdditionalChecks.hseF10 ? 'line-through' : 'none',
                                color: cdmAdditionalChecks.hseF10 ? '#6c757d' : 'inherit',
                                fontSize: '16px',
                                lineHeight: '1.5'
                              }}
                            >
                              HSE F10 notification prepared
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Lowest Quote Accepted Toggle for Statement of estimate stage */}
                  {stage.id === 'statement-estimate' && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex align-items-center">
                        <div className="form-check form-switch d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="lowestQuoteAccepted"
                            checked={lowestQuoteAccepted}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setLowestQuoteAccepted(isChecked);
                              // Update stages to change Notice of reasons to Notice of award and update task labels
                              setStages(prev => 
                                prev.map(s => 
                                  s.id === 'notice-reasons' 
                                    ? { 
                                        ...s, 
                                        name: isChecked ? 'Notice of award' : 'Notice of reasons',
                                        tasks: s.tasks.map(task => {
                                          if (task.id === 'reasons-drafted') {
                                            return {
                                              ...task,
                                              label: isChecked ? 'Notice of award drafted (if required)' : 'Notice of reasons drafted (if required)'
                                            };
                                          }
                                          if (task.id === 'clear-contents') {
                                            return {
                                              ...task,
                                              label: 'Confirms contractor appointment'
                                            };
                                          }
                                          return task;
                                        })
                                      }
                                    : s
                                )
                              );
                            }}
                            style={{ cursor: 'pointer', marginTop: '0' }}
                          />
                          <label 
                            className="form-check-label ms-2" 
                            htmlFor="lowestQuoteAccepted"
                            style={{ fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                          >
                            Lowest quote accepted
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {stage.id === 'tenders' && (
                    <div className="mt-3 pt-3 border-top">
                      <div className="d-flex align-items-center">
                        <div className="form-check form-switch d-flex align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="tendersCdmAssessment"
                            checked={tendersCdmAssessment}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setTendersCdmAssessment(isChecked);
                              setCdmAssessment(isChecked);
                              if (isChecked) {
                                setShowCdmModal(true);
                              } else {
                                setCdmReasons({
                                  exceeds30Days: false,
                                  moreThan20Workers: false,
                                  exceeds500PersonDays: false,
                                  multipleTradesConcurrent: false
                                });
                                setCdmAdditionalChecks({
                                  principalDesigner: false,
                                  principalContractor: false,
                                  hseF10: false,
                                  hseF10Submitted: false,
                                  constructionPhasePlan: false,
                                  healthSafetyFile: false
                                });
                              }
                            }}
                            style={{ cursor: 'pointer', marginTop: '0' }}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="tendersCdmAssessment"
                            style={{ fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
                          >
                            Project flagged for CDM assessment
                          </label>
                        </div>
                        {tendersCdmAssessment && (Object.values(cdmReasons).some(v => v)) && (
                          <div className="ms-3 d-flex flex-wrap gap-2 align-items-center">
                            {cdmReasons.exceeds30Days && (
                              <span className="badge" style={{ fontSize: '12px', fontWeight: 'normal', backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                Works exceed 30 working days
                              </span>
                            )}
                            {cdmReasons.moreThan20Workers && (
                              <span className="badge" style={{ fontSize: '12px', fontWeight: 'normal', backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                More than 20 workers on site
                              </span>
                            )}
                            {cdmReasons.exceeds500PersonDays && (
                              <span className="badge" style={{ fontSize: '12px', fontWeight: 'normal', backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                Exceeds 500 person-days
                              </span>
                            )}
                            {cdmReasons.multipleTradesConcurrent && (
                              <span className="badge" style={{ fontSize: '12px', fontWeight: 'normal', backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                Multiple trades concurrent
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4" style={{ backgroundColor: '#3b82c4', marginLeft: '-1rem', marginRight: '-1rem', paddingLeft: '1rem' }}>
        <ul className="nav mb-0" style={{ gap: '0' }}>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 ${activeTab === 'overview' ? '' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{
                backgroundColor: activeTab === 'overview' ? '#ffffff' : '#3b82c4',
                color: activeTab === 'overview' ? '#000000' : '#ffffff',
                borderRadius: '0',
                padding: '0.75rem 1.5rem',
                fontWeight: '400',
                borderLeft: activeTab === 'overview' ? '3px solid #ffffff' : 'none',
                position: 'relative'
              }}
            >
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 ${activeTab === 'issues' ? '' : ''}`}
              onClick={() => setActiveTab('issues')}
              style={{
                backgroundColor: activeTab === 'issues' ? '#ffffff' : '#3b82c4',
                color: activeTab === 'issues' ? '#000000' : '#ffffff',
                borderRadius: '0',
                padding: '0.75rem 1.5rem',
                fontWeight: '400',
                borderLeft: activeTab === 'issues' ? '3px solid #ffffff' : 'none'
              }}
            >
              Issues
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 ${activeTab === 'documents' ? '' : ''}`}
              onClick={() => setActiveTab('documents')}
              style={{
                backgroundColor: activeTab === 'documents' ? '#ffffff' : '#3b82c4',
                color: activeTab === 'documents' ? '#000000' : '#ffffff',
                borderRadius: '0',
                padding: '0.75rem 1.5rem',
                fontWeight: '400',
                borderLeft: activeTab === 'documents' ? '3px solid #ffffff' : 'none'
              }}
            >
              Documents
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link border-0 ${activeTab === 'activity' ? '' : ''}`}
              onClick={() => setActiveTab('activity')}
              style={{
                backgroundColor: activeTab === 'activity' ? '#ffffff' : '#3b82c4',
                color: activeTab === 'activity' ? '#000000' : '#ffffff',
                borderRadius: '0',
                padding: '0.75rem 1.5rem',
                fontWeight: '400',
                borderLeft: activeTab === 'activity' ? '3px solid #ffffff' : 'none'
              }}
            >
              Audit trail
            </button>
          </li>
        </ul>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {isNewWork ? (
            /* Empty state for new works - Show structure with empty widgets */
            <>
              {/* Stats Cards - Empty State */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="text-muted small">Total Issues</div>
                        <FileText size={40} className="text-muted opacity-50" />
                      </div>
                      <h3 className="mb-1 text-muted">0</h3>
                      <div className="text-muted small">No issues yet</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="text-muted small">Active Contractors</div>
                        <Briefcase size={40} className="text-muted opacity-50" />
                      </div>
                      <h3 className="mb-1 text-muted">0</h3>
                      <div className="text-muted small">No contractors yet</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="text-muted small">Leaseholder Responses</div>
                        <MessageSquare size={40} className="text-muted opacity-50" />
                      </div>
                      <h3 className="mb-1 text-muted">0/{leaseholderCount}</h3>
                      <div className="text-muted small">No consultation started</div>
                    </div>
                  </div>
                </div>

                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="text-muted small">Total Estimated Cost</div>
                        <PoundSterling size={40} className={work.formData?.estimatedBudget ? "text-primary" : "text-muted opacity-50"} />
                      </div>
                      <h3 className={`mb-1 ${work.formData?.estimatedBudget ? "" : "text-muted"}`}>
                        {work.formData?.estimatedBudget 
                          ? `£${parseInt(work.formData.estimatedBudget).toLocaleString()}` 
                          : '£0'}
                      </h3>
                      {work.formData?.estimatedBudget && (work.formData?.agentFeeValue || work.formData?.surveyorFeeValue) ? (
                        <div className="d-flex align-items-center gap-1" style={{ position: 'relative' }}>
                          <button 
                            className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
                            style={{ fontSize: '12px' }}
                            onMouseEnter={() => setShowCostBreakdown(true)}
                            onMouseLeave={() => setShowCostBreakdown(false)}
                          >
                            <Info size={14} className="text-primary" />
                            <span className="text-primary">View cost breakdown</span>
                          </button>
                          
                          {/* Tooltip */}
                          {showCostBreakdown && (() => {
                            const estimatedBudget = parseFloat(work.formData.estimatedBudget);
                            let agentFee = 0;
                            let surveyorFee = 0;
                            
                            // Calculate management fee
                            if (work.formData.agentFeeValue) {
                              if (work.formData.agentFeeType === 'percentage') {
                                agentFee = (estimatedBudget * parseFloat(work.formData.agentFeeValue)) / 100;
                              } else {
                                agentFee = parseFloat(work.formData.agentFeeValue);
                              }
                            }
                            
                            // Calculate surveyor fee
                            if (work.formData.surveyorFeeValue) {
                              if (work.formData.surveyorFeeType === 'percentage') {
                                surveyorFee = (estimatedBudget * parseFloat(work.formData.surveyorFeeValue)) / 100;
                              } else {
                                surveyorFee = parseFloat(work.formData.surveyorFeeValue);
                              }
                            }
                            
                            const totalCost = estimatedBudget + agentFee + surveyorFee;
                            
                            return (
                              <div 
                                className="position-absolute bg-white border rounded shadow-lg p-3"
                                style={{
                                  top: '25px',
                                  left: '0',
                                  zIndex: 1000,
                                  minWidth: '280px',
                                  fontSize: '13px'
                                }}
                                onMouseEnter={() => setShowCostBreakdown(true)}
                                onMouseLeave={() => setShowCostBreakdown(false)}
                              >
                                <div className="fw-bold mb-2 pb-2 border-bottom">Cost Breakdown</div>
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted">Net cost of works:</span>
                                  <span className="fw-medium">£{estimatedBudget.toLocaleString()}</span>
                                </div>
                                {work.formData.agentFeeValue && (
                                  <>
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="text-muted">Management fee:</span>
                                      <span className="fw-medium">£{agentFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="mb-2 ps-3">
                                      <small className="text-muted" style={{ fontSize: '11px' }}>
                                        ({work.formData.agentFeeType === 'percentage' 
                                          ? `${work.formData.agentFeeValue}% of net cost`
                                          : 'Fixed fee'})
                                      </small>
                                    </div>
                                  </>
                                )}
                                {work.formData.surveyorFeeValue && (
                                  <>
                                    <div className="d-flex justify-content-between mb-1">
                                      <span className="text-muted">Surveyor fee:</span>
                                      <span className="fw-medium">£{surveyorFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="mb-2 ps-3">
                                      <small className="text-muted" style={{ fontSize: '11px' }}>
                                        ({work.formData.surveyorFeeType === 'percentage' 
                                          ? `${work.formData.surveyorFeeValue}% of net cost`
                                          : 'Fixed fee'})
                                      </small>
                                    </div>
                                  </>
                                )}
                                <div className="border-top pt-2 mt-2">
                                  <div className="d-flex justify-content-between">
                                    <span className="fw-bold">Total (inc. VAT):</span>
                                    <span className="fw-bold text-primary">£{totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-muted small">
                          {work.formData?.estimatedBudget ? 'Estimated budget' : 'No estimates yet'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="mb-2">Needs attention</h5>
                      <div className="rounded-3 border p-3 text-muted small">
                        Nothing needs PM action yet. Live items will appear here once consultation or contractor activity starts.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="mb-2">Key updates</h5>
                      <div className="rounded-3 border overflow-hidden">
                        <div className="px-3 py-3 text-muted small">No updates yet. This area will show the latest meaningful changes once the case becomes active.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="text-muted small">Total Issues</div>
                    <FileText size={40} className="text-primary" />
                  </div>
                  <h3 className="mb-1">6</h3>
                  <div className="text-muted small">Across all stages</div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="text-muted small">Active Contractors</div>
                    <Briefcase size={40} className="text-primary" />
                  </div>
                  <h3 className="mb-1">8</h3>
                  <div className="text-muted small">4 pending quotes</div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="text-muted small">Leaseholder Responses</div>
                    <MessageSquare size={40} className="text-primary" />
                  </div>
                  <h3 className="mb-1">47/70</h3>
                  <div className="text-muted small">67% response rate</div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="text-muted small">Total Estimated Cost</div>
                    <PoundSterling size={40} className="text-success" />
                  </div>
                  <h3 className="mb-1">£450,000</h3>
                  <div className="d-flex align-items-center gap-1" style={{ position: 'relative' }}>
                    <button 
                      className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
                      style={{ fontSize: '12px' }}
                      onMouseEnter={() => setShowCostBreakdown(true)}
                      onMouseLeave={() => setShowCostBreakdown(false)}
                    >
                      <Info size={14} className="text-primary" />
                      <span className="text-primary">View cost breakdown</span>
                    </button>
                    
                    {/* Tooltip */}
                    {showCostBreakdown && (
                      <div 
                        className="position-absolute bg-white border rounded shadow-lg p-3"
                        style={{
                          top: '25px',
                          left: '0',
                          zIndex: 1000,
                          minWidth: '280px',
                          fontSize: '13px'
                        }}
                        onMouseEnter={() => setShowCostBreakdown(true)}
                        onMouseLeave={() => setShowCostBreakdown(false)}
                      >
                        <div className="fw-bold mb-2 pb-2 border-bottom">Cost Breakdown</div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Net cost of works:</span>
                          <span className="fw-medium">£405,000</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Management fee:</span>
                          <span className="fw-medium">£40,500</span>
                        </div>
                        <div className="mb-2 ps-3">
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            (10% of net cost)
                          </small>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Surveyor fee:</span>
                          <span className="fw-medium">£4,500</span>
                        </div>
                        <div className="mb-2 ps-3">
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            (6% of net cost)
                          </small>
                        </div>
                        <div className="border-top pt-2 mt-2">
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold">Total (inc. VAT):</span>
                            <span className="fw-bold text-success">£450,000</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-2">Needs attention</h5>
                  {overviewAttentionItems.length > 0 ? (
                    <div className="rounded-3 border overflow-hidden">
                      {overviewAttentionItems.map((item, index) => (
                        <div
                          key={`${item.title}-${index}`}
                          className={index < overviewAttentionItems.length - 1 ? 'border-bottom' : ''}
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftStyle: 'solid',
                            borderLeftColor:
                              item.tone === 'critical'
                                ? '#DC2626'
                                : item.tone === 'warning'
                                  ? '#F59E0B'
                                  : '#175CD3',
                            backgroundColor: 'transparent'
                          }}
                        >
                          <div className="px-4 py-4">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                              <div style={{ minWidth: 0 }}>
                                <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                                  <span
                                    className="badge rounded-pill"
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      padding: '0.4rem 0.65rem',
                                      backgroundColor:
                                        item.tone === 'critical'
                                          ? '#FEE4E2'
                                          : item.tone === 'warning'
                                            ? '#FEC84B'
                                            : '#D1E9FF',
                                      color:
                                        item.tone === 'critical'
                                          ? '#912018'
                                          : item.tone === 'warning'
                                            ? '#7A2E0E'
                                            : '#1849A9'
                                    }}
                                  >
                                    {item.tone === 'critical' ? 'Very urgent' : item.tone === 'warning' ? 'Urgent' : 'Immediate'}
                                  </span>
                                  <div className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                                    {item.title}
                                  </div>
                                </div>
                                {(item.where || item.when) && (
                                  <div className="mb-2" style={{ color: '#344054', fontSize: '13px', fontWeight: 600, lineHeight: 1.4 }}>
                                    {item.where && <span className="fw-medium">{item.where}</span>}
                                    {item.where && item.when && <span>{' • '}</span>}
                                    {item.when && <span>{item.when}</span>}
                                  </div>
                                )}
                                <div style={{ color: '#475467', fontSize: '13px', fontWeight: 500, lineHeight: 1.55, maxWidth: '72ch' }}>
                                  {item.detail}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link p-0 text-decoration-none mt-2"
                                  onClick={() => handleOverviewAction(item.targetTab, item.targetDocumentId)}
                                >
                                  {item.actionLabel}
                                </button>
                              </div>
                              <div className="d-flex flex-column align-items-start align-items-md-end gap-2 flex-shrink-0" style={{ minWidth: '150px' }}>
                                <span
                                  className="badge rounded-pill"
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    padding: '0.4rem 0.65rem',
                                    backgroundColor: 'rgba(100, 116, 139, 0.12)',
                                    color: '#475569'
                                  }}
                                >
                                  {item.source}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3 border p-3 text-muted small">
                      All good. No immediate actions are needed and this major works is currently on track.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-2">Key updates</h5>
                  <div className="rounded-3 bg-white p-3">
                    {overviewKeyUpdates.map((update, index) => (
                      <div
                        key={`${update.title}-${index}`}
                        className={index < overviewKeyUpdates.length - 1 ? 'pb-3 mb-3 border-bottom' : ''}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2 mb-1">
                            <div className="fw-bold text-dark" style={{ fontSize: '16px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                              {update.title}
                            </div>
                            <span
                              className="badge rounded-pill"
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '0.35rem 0.6rem',
                                backgroundColor: 'rgba(100, 116, 139, 0.12)',
                                color: '#475569'
                              }}
                            >
                              {update.source}
                            </span>
                          </div>
                          {(update.where || update.when || update.actor) && (
                            <div className="mb-1" style={{ color: '#344054', fontSize: '13px', fontWeight: 600, lineHeight: 1.4 }}>
                              {update.where && <span className="fw-medium">{update.where}</span>}
                              {update.where && (update.when || update.actor) && <span>{' • '}</span>}
                              {update.when && <span>{update.when}</span>}
                              {update.when && update.actor && <span>{' • '}</span>}
                              {update.actor && <span>by {update.actor}</span>}
                            </div>
                          )}
                          <div style={{ color: '#475467', fontSize: '13px', fontWeight: 500, lineHeight: 1.55, maxWidth: '72ch' }}>
                            {update.detail}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-decoration-none"
                            onClick={() => handleOverviewAction(update.targetTab, update.targetDocumentId)}
                          >
                            {update.actionLabel}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </>
      )}

      {/* Other tabs content */}
      {activeTab === 'issues' && (
        <div>
          {isNewWork ? (
            /* Empty state for new works */
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="d-flex justify-content-center">
                  <FileText size={64} className="text-muted mb-3 opacity-50" />
                </div>
                <h4 className="mb-3">No issues yet</h4>
                <p className="text-muted mb-4">
                  This major works project doesn't have any issues linked yet.
                </p>
                <button className="btn btn-primary d-flex align-items-center gap-2 mx-auto">
                  <Plus size={18} />
                  Link an issue
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search and New Issue header */}
              <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
                <div className="d-flex align-items-center" style={{ flex: 1, maxWidth: '600px' }}>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={18} className="text-muted" />
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Search issues"
                      style={{ paddingLeft: '0' }}
                    />
                    <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    </button>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary d-flex align-items-center gap-2">
                    <Plus size={18} />
                    New issue
                  </button>
                  <button 
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={() => setShowLinkIssueModal(true)}
                    style={{ backgroundColor: '#0B81C5', borderColor: '#0B81C5' }}
                  >
                    <LinkIcon size={18} />
                    Link issues
                  </button>
                </div>
              </div>

              {/* Issues List */}
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <tbody>
                        {[...Array(10)].map((_, index) => (
                          <tr key={index} style={{ cursor: 'pointer' }}>
                            <td className="border-0 border-bottom py-3" style={{ width: '15%' }}>
                              <div className="fw-medium">Ref: IS20366791</div>
                              <div className="text-muted small">Raised: Mon 24 Nov</div>
                            </td>
                            <td className="border-0 border-bottom py-3" style={{ width: '30%' }}>
                              <div className="fw-medium">Other (Flat roof)</div>
                              <div className="text-muted small">17 Daylesford Grove, Burnham, SL1 5AX</div>
                            </td>
                            <td className="border-0 border-bottom py-3" style={{ width: '25%' }}>
                              <div className="fw-medium">Reported</div>
                              <div className="text-muted small">Raised today</div>
                              <div className="text-muted small">Assigned to: (Unassigned)</div>
                            </td>
                            <td className="border-0 border-bottom py-3 text-end" style={{ width: '20%' }}>
                              <span className="badge bg-danger" style={{ fontSize: '13px', padding: '6px 12px' }}>
                                3 - Non-urgent (high)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          {isNewWork && documents.length === 0 ? (
            /* Empty state for new works with no documents */
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="d-flex justify-content-center">
                  <FileText size={64} className="text-muted mb-3 opacity-50" />
                </div>
                <h4 className="mb-3">No documents yet</h4>
                <p className="text-muted mb-4">
                  Documents will be created and stored here as the major works project progresses through each stage.
                </p>
                <button 
                  className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
                  onClick={handleNewDocumentClick}
                >
                  <FilePlus size={18} />
                  New document
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Segment Control */}
              <div className="mb-4">
                <div className="btn-group" role="group" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                  <button
                    type="button"
                    className={`btn ${documentSegment === 'consultation' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setDocumentSegment('consultation');
                      setTypeFilter('All types');
                      setStatusFilter('All statuses');
                      setShowDueOverdue(false);
                      handleFilterChange();
                    }}
                    style={{
                      paddingLeft: '24px',
                      paddingRight: '24px',
                      fontWeight: documentSegment === 'consultation' ? '500' : '400'
                    }}
                  >
                    Consultation
                  </button>
                  <button
                    type="button"
                    className={`btn ${documentSegment === 'project' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setDocumentSegment('project');
                      setTypeFilter('All types');
                      handleFilterChange();
                    }}
                    style={{
                      paddingLeft: '24px',
                      paddingRight: '24px',
                      fontWeight: documentSegment === 'project' ? '500' : '400'
                    }}
                  >
                    Project
                  </button>
                </div>
              </div>

              {/* Filters - matching MajorWorksList styling */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <select 
                        className="form-select"
                        value={typeFilter}
                        onChange={(e) => {
                          setTypeFilter(e.target.value);
                          handleFilterChange();
                        }}
                      >
                        {documentSegment === 'consultation' ? (
                          <>
                            <option>All types</option>
                            <option>Letter</option>
                            <option>Notice</option>
                            <option>Quote</option>
                            <option>Certificate</option>
                            <option>Email</option>
                            <option>Other</option>
                          </>
                        ) : (
                          <>
                            <option>All types</option>
                            <option>Contracts</option>
                            <option>Site meeting minutes</option>
                            <option>F10 / CDM docs</option>
                            <option>Certificates of payment</option>
                          </>
                        )}
                      </select>
                    </div>

                    {documentSegment === 'consultation' && (
                      <div className="col-md-3">
                        <select 
                          className="form-select"
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilterChange();
                          }}
                        >
                          <option>All statuses</option>
                          <option>Sent</option>
                          <option>Ready to send</option>
                          <option>Draft</option>
                          <option>Awaiting approval</option>
                          <option>Send now</option>
                        </select>
                      </div>
                    )}

                    <div className={documentSegment === 'consultation' ? 'col-md-6' : 'col-md-9'}>
                      <div className="d-flex gap-3">
                        <div className="input-group flex-grow-1">
                          <span className="input-group-text bg-white border-end-0">
                            <Search size={18} className="text-muted" />
                          </span>
                          <input 
                            type="text" 
                            className="form-control border-start-0" 
                            placeholder={documentSegment === 'consultation' ? 'Search documents...' : 'Search documents...'}
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              handleFilterChange();
                            }}
                          />
                        </div>
                        <div className="position-relative" ref={docColumnDropdownRef}>
                          <button
                            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                            type="button"
                            onClick={() => setShowDocColumnDropdown(!showDocColumnDropdown)}
                            style={{ height: '38px', width: '38px', padding: '0' }}
                          >
                            <Filter size={18} />
                          </button>
                          {showDocColumnDropdown && (
                            <div
                              className="dropdown-menu show p-3"
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                minWidth: '280px',
                                maxHeight: '500px',
                                overflowY: 'auto',
                                zIndex: 1050
                              }}
                            >
                              <h6 className="dropdown-header px-0 fw-bold text-dark" style={{ fontSize: '16px' }}>
                                Show/hide columns
                              </h6>
                              <div className="mb-3">
                                <div className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="doc-col-documentName"
                                    checked={visibleDocColumns.documentName}
                                    onChange={() => toggleDocColumn('documentName')}
                                  />
                                  <label className="form-check-label" htmlFor="doc-col-documentName" style={{ color: '#4a5565' }}>
                                    Document name
                                  </label>
                                </div>
                                <div className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="doc-col-type"
                                    checked={visibleDocColumns.type}
                                    onChange={() => toggleDocColumn('type')}
                                  />
                                  <label className="form-check-label" htmlFor="doc-col-type" style={{ color: '#4a5565' }}>
                                    Type
                                  </label>
                                </div>
                                {documentSegment === 'consultation' && (
                                  <>
                                    <div className="form-check mb-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="doc-col-section20Stage"
                                        checked={visibleDocColumns.section20Stage}
                                        onChange={() => toggleDocColumn('section20Stage')}
                                      />
                                      <label className="form-check-label" htmlFor="doc-col-section20Stage" style={{ color: '#4a5565' }}>
                                        Section 20 stage
                                      </label>
                                    </div>
                                    <div className="form-check mb-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="doc-col-status"
                                        checked={visibleDocColumns.status}
                                        onChange={() => toggleDocColumn('status')}
                                      />
                                      <label className="form-check-label" htmlFor="doc-col-status" style={{ color: '#4a5565' }}>
                                        Status
                                      </label>
                                    </div>
                                    <div className="form-check mb-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="doc-col-dueToSendOn"
                                        checked={visibleDocColumns.dueToSendOn}
                                        onChange={() => toggleDocColumn('dueToSendOn')}
                                      />
                                      <label className="form-check-label" htmlFor="doc-col-dueToSendOn" style={{ color: '#4a5565' }}>
                                        Due to send on
                                      </label>
                                    </div>
                                    <div className="form-check mb-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="doc-col-sentOn"
                                        checked={visibleDocColumns.sentOn}
                                        onChange={() => toggleDocColumn('sentOn')}
                                      />
                                      <label className="form-check-label" htmlFor="doc-col-sentOn" style={{ color: '#4a5565' }}>
                                        Sent on
                                      </label>
                                    </div>
                                    <div className="form-check mb-2">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="doc-col-recipients"
                                        checked={visibleDocColumns.recipients}
                                        onChange={() => toggleDocColumn('recipients')}
                                      />
                                      <label className="form-check-label" htmlFor="doc-col-recipients" style={{ color: '#4a5565' }}>
                                        Recipients
                                      </label>
                                    </div>
                                  </>
                                )}
                                <div className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="doc-col-lastUpdated"
                                    checked={visibleDocColumns.lastUpdated}
                                    onChange={() => toggleDocColumn('lastUpdated')}
                                  />
                                  <label className="form-check-label" htmlFor="doc-col-lastUpdated" style={{ color: '#4a5565' }}>
                                    Last updated
                                  </label>
                                </div>
                                <div className="form-check mb-2">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="doc-col-lastUpdatedBy"
                                    checked={visibleDocColumns.lastUpdatedBy}
                                    onChange={() => toggleDocColumn('lastUpdatedBy')}
                                  />
                                  <label className="form-check-label" htmlFor="doc-col-lastUpdatedBy" style={{ color: '#4a5565' }}>
                                    Last updated by
                                  </label>
                                </div>
                              </div>
                              {documentSegment === 'consultation' && (
                                <>
                                  <hr className="my-2" />
                                  <div className="form-check mb-0">
                                    <input 
                                      className="form-check-input" 
                                      type="checkbox" 
                                      id="showDueOverdue"
                                      checked={showDueOverdue}
                                      onChange={(e) => {
                                        setShowDueOverdue(e.target.checked);
                                        handleFilterChange();
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor="showDueOverdue" style={{ color: '#4a5565' }}>
                                      Show only due & overdue
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <button 
                          className="btn btn-primary d-flex align-items-center gap-2"
                          onClick={handleNewDocumentClick}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <FilePlus size={18} />
                          New document
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

          {/* Documents Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div 
                className="table-responsive"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#dee2e6 #f8f9fa'
                }}
              >
                <table className="table table-hover mb-0" style={{ fontSize: '14px', minWidth: documentSegment === 'consultation' ? '1400px' : 'auto' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      {visibleDocColumns.documentName && (
                        <th 
                          className="border-0 py-3" 
                          style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none', minWidth: documentSegment === 'consultation' ? '200px' : '180px', whiteSpace: 'nowrap', paddingLeft: '1rem', paddingRight: '0.75rem' }}
                          onClick={() => handleSort('name')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Document name
                            {sortColumn === 'name' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.type && (
                        <th 
                          className="border-0 py-3" 
                          style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none', minWidth: documentSegment === 'consultation' ? '120px' : '100px', whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                          onClick={() => handleSort('type')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Type
                            {sortColumn === 'type' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {/* Consultation-only columns */}
                      {visibleDocColumns.section20Stage && documentSegment === 'consultation' && (
                        <th 
                          className="border-0 py-3" 
                          style={{ 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            userSelect: 'none', 
                            minWidth: '160px', 
                            whiteSpace: 'nowrap',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem'
                          }}
                          onClick={() => handleSort('stage')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Section 20 stage
                            {sortColumn === 'stage' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.status && documentSegment === 'consultation' && (
                        <th 
                          className="border-0 py-3" 
                          style={{ 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            userSelect: 'none', 
                            minWidth: '120px', 
                            whiteSpace: 'nowrap',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem'
                          }}
                          onClick={() => handleSort('status')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Status
                            {sortColumn === 'status' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.dueToSendOn && documentSegment === 'consultation' && (
                        <th 
                          className="border-0 py-3" 
                          style={{ 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            userSelect: 'none', 
                            minWidth: '140px', 
                            whiteSpace: 'nowrap',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem'
                          }}
                          onClick={() => handleSort('dueDate')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Due to send on
                            {sortColumn === 'dueDate' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.sentOn && documentSegment === 'consultation' && (
                        <th 
                          className="border-0 py-3" 
                          style={{ 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            userSelect: 'none', 
                            minWidth: '120px', 
                            whiteSpace: 'nowrap',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem'
                          }}
                          onClick={() => handleSort('sentDate')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Sent on
                            {sortColumn === 'sentDate' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.recipients && documentSegment === 'consultation' && (
                        <th 
                          className="border-0 py-3" 
                          style={{ 
                            fontWeight: '600', 
                            minWidth: '130px', 
                            whiteSpace: 'nowrap',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem'
                          }}
                        >
                          Recipients
                        </th>
                      )}
                      {visibleDocColumns.lastUpdated && (
                        <th 
                          className="border-0 py-3" 
                          style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none', minWidth: documentSegment === 'consultation' ? '130px' : '110px', whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}
                          onClick={() => handleSort('lastUpdated')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Last updated
                            {sortColumn === 'lastUpdated' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                      {visibleDocColumns.lastUpdatedBy && (
                        <th 
                          className="border-0 py-3" 
                          style={{ fontWeight: '600', cursor: 'pointer', userSelect: 'none', minWidth: documentSegment === 'consultation' ? '150px' : '130px', whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '1rem' }}
                          onClick={() => handleSort('lastUpdatedBy')}
                        >
                          <div className="d-flex align-items-center gap-1">
                            Last updated by
                            {sortColumn === 'lastUpdatedBy' && (
                              sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                          </div>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocuments.map((doc) => (
                      <tr 
                        key={doc.id} 
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedDocument?.id === doc.id ? '#f0f7ff' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDocumentDetail(true);
                        }}
                      >
                        {visibleDocColumns.documentName && (
                          <td className="border-0 border-bottom py-3" style={{ whiteSpace: 'nowrap', paddingLeft: '1rem', paddingRight: '0.75rem' }}>{doc.name}</td>
                        )}
                        {visibleDocColumns.type && (
                          <td className="border-0 border-bottom py-3" style={{ whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>{doc.type}</td>
                        )}
                        {/* Consultation-only cells */}
                        {visibleDocColumns.section20Stage && documentSegment === 'consultation' && (
                          <td className="border-0 border-bottom py-3" style={{ whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>{doc.stage}</td>
                        )}
                        {visibleDocColumns.status && documentSegment === 'consultation' && (
                          <td className="border-0 border-bottom py-3" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                            <span 
                              style={{ 
                                ...getStatusBadgeStyle(doc.status),
                                fontSize: '12px', 
                                padding: '6px 14px',
                                fontWeight: '600',
                                display: 'inline-block',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {doc.status}
                            </span>
                          </td>
                        )}
                        {visibleDocColumns.dueToSendOn && documentSegment === 'consultation' && (
                          <td className="border-0 border-bottom py-3" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                            <div style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{doc.dueDate}</div>
                            {doc.isOverdue && (
                              <span 
                                className="badge bg-danger mt-1" 
                                style={{ 
                                  fontSize: '10px', 
                                  padding: '3px 6px',
                                  fontWeight: '500',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Overdue
                              </span>
                            )}
                            {doc.isDueSoon && !doc.isOverdue && (
                              <span 
                                className="badge bg-warning mt-1" 
                                style={{ 
                                  fontSize: '10px', 
                                  padding: '3px 6px',
                                  fontWeight: '500',
                                  borderRadius: '3px',
                                  color: '#000',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Due soon
                              </span>
                            )}
                          </td>
                        )}
                        {visibleDocColumns.sentOn && documentSegment === 'consultation' && (
                          <td className="border-0 border-bottom py-3" style={{ fontSize: '14px', whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>{doc.sentDate || '—'}</td>
                        )}
                        {visibleDocColumns.recipients && documentSegment === 'consultation' && (
                          <td className="border-0 border-bottom py-3" style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                            {doc.recipients && doc.recipients.map((recipient, idx) => (
                              <div key={idx} className={`d-flex align-items-center gap-1 ${idx > 0 ? 'mt-1' : ''}`} style={{ whiteSpace: 'nowrap' }}>
                                <span 
                                  style={{ 
                                    backgroundColor: '#f0f0f0',
                                    color: '#333',
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '500',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {recipient.label}
                                </span>
                                <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>({recipient.count})</span>
                              </div>
                            ))}
                          </td>
                        )}
                        {visibleDocColumns.lastUpdated && (
                          <td className="border-0 border-bottom py-3" style={{ whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>{doc.lastUpdated}</td>
                        )}
                        {visibleDocColumns.lastUpdatedBy && (
                          <td className="border-0 border-bottom py-3" style={{ whiteSpace: 'nowrap', paddingLeft: '0.75rem', paddingRight: '1rem' }}>{doc.lastUpdatedBy}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <div className="text-muted" style={{ fontSize: '14px' }}>
                  Total <strong>{sortedDocuments.length}</strong> items
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <nav>
                    <ul className="pagination mb-0" style={{ fontSize: '14px' }}>
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          style={{ 
                            padding: '6px 12px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                        </button>
                      </li>
                      
                      {/* Page 1 */}
                      <li className={`page-item ${currentPage === 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          style={{ 
                            padding: '6px 12px',
                            height: '34px',
                            minWidth: '40px',
                            backgroundColor: currentPage === 1 ? '#3b82c4' : 'transparent',
                            borderColor: currentPage === 1 ? '#3b82c4' : '#dee2e6',
                            color: currentPage === 1 ? '#fff' : '#000'
                          }}
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </button>
                      </li>
                      
                      {/* Show ellipsis if needed */}
                      {currentPage > 3 && totalPages > 4 && (
                        <li className="page-item disabled">
                          <span className="page-link" style={{ padding: '6px 12px', height: '34px', display: 'flex', alignItems: 'center' }}>...</span>
                        </li>
                      )}
                      
                      {/* Middle pages */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (page === 1 || page === totalPages) return false;
                          return Math.abs(page - currentPage) <= 1;
                        })
                        .map(page => (
                          <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              style={{ 
                                padding: '6px 12px',
                                height: '34px',
                                minWidth: '40px',
                                backgroundColor: currentPage === page ? '#3b82c4' : 'transparent',
                                borderColor: currentPage === page ? '#3b82c4' : '#dee2e6',
                                color: currentPage === page ? '#fff' : '#000'
                              }}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                      
                      {/* Show ellipsis if needed */}
                      {currentPage < totalPages - 2 && totalPages > 4 && (
                        <li className="page-item disabled">
                          <span className="page-link" style={{ padding: '6px 12px', height: '34px', display: 'flex', alignItems: 'center' }}>...</span>
                        </li>
                      )}
                      
                      {/* Last page */}
                      {totalPages > 1 && (
                        <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            style={{ 
                              padding: '6px 12px',
                              height: '34px',
                              minWidth: '40px',
                              backgroundColor: currentPage === totalPages ? '#3b82c4' : 'transparent',
                              borderColor: currentPage === totalPages ? '#3b82c4' : '#dee2e6',
                              color: currentPage === totalPages ? '#fff' : '#000'
                            }}
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </button>
                        </li>
                      )}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          style={{ 
                            padding: '6px 12px',
                            height: '34px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </li>
                    </ul>
                  </nav>
                  
                  <select 
                    className="form-select" 
                    style={{ width: '120px', fontSize: '14px', padding: '6px 30px 6px 12px', height: '34px' }}
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                  
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: '14px' }}>Go to</span>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ width: '60px', fontSize: '14px', padding: '4px 10px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const page = parseInt((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= totalPages) {
                            setCurrentPage(page);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          {isNewWork ? (
            /* Activity Feed for new works - Show only creation activity */
            <div className="card border-0 shadow-sm">
              {/* Date Group */}
              <div className="border-bottom">
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted small fw-medium">Today</span>
                  </div>
                  <span className="text-muted small">{documents.length > 0 ? documents.length + 1 : 1} activit{documents.length > 0 ? 'ies' : 'y'}</span>
                </div>
                
                <div className="px-4 py-3">
                  {/* Documents Added Activities */}
                  {documents.length > 0 && (
                    <>
                      <div className="d-flex gap-3 mb-4 position-relative">
                        <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                          <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#0b81c5' }}></div>
                          <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                              <FileText size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                              <span style={{ verticalAlign: 'middle' }}>Documents Added</span>
                            </span>
                            <span className="ms-auto text-muted small">Just now</span>
                          </div>
                          <div className="mb-2">
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Users size={16} className="text-muted" />
                              <span style={{ fontSize: '14px' }}>System</span>
                              <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Automated</span>
                            </div>
                            <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                              {documents.length} document{documents.length !== 1 ? 's' : ''} imported from template and added to project
                            </p>
                            <div className="small text-muted">
                              {documents.slice(0, 3).map((doc, idx) => (
                                <div key={idx}>• {doc.name}</div>
                              ))}
                              {documents.length > 3 && <div>• and {documents.length - 3} more...</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Creation Activity */}
                  <div className="d-flex gap-3">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#008236', border: '1px solid #b9f8cf', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <CheckCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Major Works Created</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          {work.title}
                        </span>
                        <span className="ms-auto text-muted small">Just now</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>System</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Automated</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          New major works project created with estimated budget of £{work.formData?.estimatedBudget ? parseInt(work.formData.estimatedBudget).toLocaleString() : '0'}
                        </p>
                        <div className="small">
                          <div>
                            <span className="text-muted">Property:</span>{' '}
                            <a 
                              href="#" 
                              className="text-decoration-none"
                              style={{ color: '#0B81C5' }}
                              onClick={(e) => e.preventDefault()}
                            >
                              {propertyInfo.address}
                            </a>
                          </div>
                          <div><span className="text-muted">Leaseholders:</span> <span className="text-dark">{propertyInfo.leaseholderCount}</span></div>
                          {work.formData?.workCategory && (
                            <div><span className="text-muted">Category:</span> <span className="text-dark">{work.formData.workCategory.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header Section */}
              <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
            {/* Search bar */}
            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: '900px' }}>
              <div className="input-group" style={{ maxWidth: '400px' }}>
                <span className="input-group-text bg-white">
                  <Search size={18} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search for notes, orders, or rentals..."
                />
              </div>
              
              {/* Filters */}
              <select className="form-select" style={{ width: 'auto', minWidth: '140px' }}>
                <option>All boards</option>
                <option>Main board</option>
                <option>Issues</option>
              </select>
              
              <select className="form-select" style={{ width: 'auto', minWidth: '140px' }}>
                <option>All users</option>
                <option>Sarah Mitchell</option>
                <option>Michael Thompson</option>
              </select>
              
              <select className="form-select" style={{ width: 'auto', minWidth: '140px' }}>
                <option>All actions</option>
                <option>Updated</option>
                <option>Created</option>
                <option>Deleted</option>
              </select>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {/* Date Group: 16 December 2025 */}
              <div className="border-bottom">
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted small fw-medium">16 December 2025</span>
                  </div>
                  <button className="btn btn-link btn-sm text-muted text-decoration-none p-0">
                    4 activities
                  </button>
                </div>
                
                {/* Activity Items */}
                <div className="px-4 py-3">
                  {/* Activity Item 1 */}
                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#faf5ff', color: '#8200db', border: '1px solid #e9d4ff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <MessageSquare size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Consultation Response</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small">7 days ago</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Sarah Mitchell</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Responded to leaseholder queries regarding the proposed works timeline and contractor selection process
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Section 20 Consultation</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Item 2 */}
                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#ca3500', border: '1px solid #ffd6a7', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <AlertCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Leaseholder Observation</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small" style={{ whiteSpace: 'nowrap' }}>01 January '26<br/>01:30</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>David Chen</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Leaseholder</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Submitted observations regarding the consultation period and requested additional time to review contractor proposals
                        </p>
                        <p className="mb-2" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Flat Roof Replacement Works</span>
                        </p>
                        <p className="mb-2" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Sent to:</span> <span className="text-dark">Property Management Team</span>
                        </p>
                        <div className="bg-light rounded p-3" style={{ fontSize: '14px' }}>
                          <p className="mb-0 text-muted">
                            <strong className="text-dark">Observation:</strong> The flat roof replacement is urgent - we've been waiting 6 months since the last inspection. Please expedite the contractor selection process.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Item 3 */}
                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#008236', border: '1px solid #b9f8cf', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <CheckCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Quote Approved</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small">13 hours ago</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Michael Thompson</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Senior Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Approved contractor quote from New Stratford Commercial Ltd after consultation period concluded
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Sent to:</span> <span className="text-dark">All Leaseholders</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Item 4 */}
                  <div className="d-flex gap-3">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f9fafb', color: '#364153', border: '1px solid #e5e7eb', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <FileText size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Section 20 Notice Issued</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small" style={{ whiteSpace: 'nowrap' }}>14 hours ago<br/>12:04</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Emma Evans</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Leaseholder</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Accessed Section 20 Notice and Statement of Estimates via the leaseholder portal
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Major Works Consultation - Block A</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Group: 17 November 2025 */}
              <div className="border-bottom">
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted small fw-medium">17 November 2025</span>
                  </div>
                  <button className="btn btn-link btn-sm text-muted text-decoration-none p-0">
                    3 activities
                  </button>
                </div>
                
                <div className="px-4 py-3">
                  {/* Simplified activity items for this date */}
                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#ca3500', border: '1px solid #ffd6a7', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <AlertCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Contractor Appointed</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small">21 hours ago</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Sarah Mitchell</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Officially appointed New Stratford Commercial Ltd as the contractor for roof replacement works
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Roof Replacement Works</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#008236', border: '1px solid #b9f8cf', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <CheckCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Consultation Closed</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small">Yesterday at 14:10</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Michael Thompson</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Senior Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Leaseholder consultation period closed. Total of 12 responses received from leaseholders
                        </p>
                        <p className="mb-2" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Section 20 Consultation</span>
                        </p>
                        <div className="d-flex gap-2 align-items-center">
                          <span className="text-muted" style={{ fontSize: '14px' }}>Status changed from:</span>
                          <span className="badge text-dark" style={{ backgroundColor: '#e5e7eb', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                            In Consultation
                          </span>
                          <ChevronRight size={14} className="text-muted" />
                          <span className="badge text-dark" style={{ backgroundColor: '#e5e7eb', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                            Consultation Closed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#faf5ff', color: '#8200db', border: '1px solid #e9d4ff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <MessageSquare size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Estimates Reviewed</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small">Yesterday at 21:14</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Sarah Mitchell</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Reviewed and compared estimates from 4 contractors for the major works project
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Contractor Selection</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Group: 3 December 2025 */}
              <div>
                <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted small fw-medium">3 December 2025</span>
                  </div>
                  <button className="btn btn-link btn-sm text-muted text-decoration-none p-0">
                    5 activities
                  </button>
                </div>
                
                <div className="px-4 py-3">
                  <div className="d-flex gap-3 pb-4 position-relative">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                      <div style={{ width: '2px', height: '100%', backgroundColor: '#e5e7eb', position: 'absolute', top: '8px', left: '12px' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f9fafb', color: '#364153', border: '1px solid #e5e7eb', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <FileText size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Method Statement Uploaded</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small" style={{ whiteSpace: 'nowrap' }}>Tuesday at 13:31<br/>01:40</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>David Chen</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Leaseholder</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Contractor submitted detailed method statement and risk assessment documentation
                        </p>
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Health & Safety Documentation</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <div className="d-flex flex-column align-items-center" style={{ width: '24px' }}>
                      <div className="rounded-circle d-flex align-items-center justify-center" style={{ width: '8px', height: '8px', backgroundColor: '#6c757d' }}></div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
                        <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#008236', border: '1px solid #b9f8cf', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          <CheckCircle size={12} className="me-1" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                          <span style={{ verticalAlign: 'middle' }}>Consultation Started</span>
                        </span>
                        <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#0b81c5', border: '1px solid #bedbff', fontSize: '12px', padding: '4px 10px', fontWeight: '500' }}>
                          Riverside Roof
                        </span>
                        <span className="ms-auto text-muted small" style={{ whiteSpace: 'nowrap' }}>Tuesday at 13:31<br/>01:40</span>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Users size={16} className="text-muted" />
                          <span style={{ fontSize: '14px' }}>Sarah Mitchell</span>
                          <span className="badge border" style={{ backgroundColor: '#f3f4f6', color: '#1e2939', fontSize: '12px', padding: '3px 9px', fontWeight: '500' }}>Property Manager</span>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '14px' }}>
                          Commenced Section 20 consultation process with leaseholders for major works project
                        </p>
                        <p className="mb-2" style={{ fontSize: '14px' }}>
                          <span className="text-muted">Related to:</span> <span className="text-dark">Section 20 Consultation</span>
                        </p>
                        <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                          Estimated cost: <strong className="text-dark">£470,000</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* New Document Modal */}
      <NewDocumentModal
        show={showNewDocumentModal}
        onClose={handleDocumentModalClose}
        onSubmit={handleDocumentSubmit}
      />

      {/* New Project Document Modal */}
      <NewProjectDocumentModal
        show={showNewProjectDocumentModal}
        onClose={handleProjectDocumentModalClose}
        onSubmit={handleDocumentSubmit}
      />

      <DocumentDetailPanel
        show={showDocumentDetail}
        onHide={() => {
          setShowDocumentDetail(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onUpdateDocument={handleDocumentUpdate}
        observations={observations}
        leaseholderRecords={leaseholderRecords}
        onCreateObservation={handleObservationCreate}
        onUpdateObservation={handleObservationUpdate}
        onDeleteObservation={handleObservationDelete}
        onObservationStatusChange={handleObservationStatusChange}
      />

      {/* CDM Assessment Modal */}
      {showCdmModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">CDM Assessment Reasons</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCdmModal(false);
                    setTendersCdmAssessment(false);
                    setCdmAssessment(false);
                    setCdmReasons({
                      exceeds30Days: false,
                      moreThan20Workers: false,
                      exceeds500PersonDays: false,
                      multipleTradesConcurrent: false
                    });
                    setCdmAdditionalChecks({
                      principalDesigner: false,
                      principalContractor: false,
                      hseF10: false,
                      hseF10Submitted: false,
                      constructionPhasePlan: false,
                      healthSafetyFile: false
                    });
                  }}
                ></button>
              </div>

              <div className="modal-body">
                <p className="text-muted small mb-3">
                  Select applicable reasons for this project
                </p>

                <div className="d-flex flex-column gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="exceeds30Days"
                      checked={cdmReasons.exceeds30Days}
                      onChange={(e) => setCdmReasons({ ...cdmReasons, exceeds30Days: e.target.checked })}
                      style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="exceeds30Days"
                      style={{ fontSize: '16px' }}
                    >
                      Works exceed 30 working days
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="moreThan20Workers"
                      checked={cdmReasons.moreThan20Workers}
                      onChange={(e) => setCdmReasons({ ...cdmReasons, moreThan20Workers: e.target.checked })}
                      style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="moreThan20Workers"
                      style={{ fontSize: '16px' }}
                    >
                      More than 20 workers on site at any one time
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="exceeds500PersonDays"
                      checked={cdmReasons.exceeds500PersonDays}
                      onChange={(e) => setCdmReasons({ ...cdmReasons, exceeds500PersonDays: e.target.checked })}
                      style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="exceeds500PersonDays"
                      style={{ fontSize: '16px' }}
                    >
                      Total construction effort exceeds 500 person-days
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="multipleTradesConcurrent"
                      checked={cdmReasons.multipleTradesConcurrent}
                      onChange={(e) => setCdmReasons({ ...cdmReasons, multipleTradesConcurrent: e.target.checked })}
                      style={{ width: '20px', height: '20px', marginTop: '0.15rem' }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="multipleTradesConcurrent"
                      style={{ fontSize: '16px' }}
                    >
                      Multiple trades operating concurrently
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCdmModal(false);
                    setTendersCdmAssessment(false);
                    setCdmAssessment(false);
                    setCdmReasons({
                      exceeds30Days: false,
                      moreThan20Workers: false,
                      exceeds500PersonDays: false,
                      multipleTradesConcurrent: false
                    });
                    setCdmAdditionalChecks({
                      principalDesigner: false,
                      principalContractor: false,
                      hseF10: false,
                      hseF10Submitted: false,
                      constructionPhasePlan: false,
                      healthSafetyFile: false
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowCdmModal(false);
                    setCdmAssessment(Object.values(cdmReasons).some(Boolean));
                  }}
                >
                  Save Reasons
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Issue Modal */}
      {showLinkIssueModal && (
        <div 
          className="modal show d-block" 
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Link issue to major works</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowLinkIssueModal(false);
                    setIssueSearchQuery('');
                    setSelectedIssuesToLink([]);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Select one or more issues from <strong>{work.formData?.building || work.location || 'Riverside Apartments'}</strong> to manually link to this S20 major works
                </p>
                
                {/* Search input */}
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search issues by title or reference..."
                    value={issueSearchQuery}
                    onChange={(e) => setIssueSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Issue list */}
                <div 
                  className="list-group" 
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  {getFilteredAvailableIssues().length === 0 ? (
                    <div className="text-center text-muted py-3">
                      No issues found matching your search
                    </div>
                  ) : (
                    getFilteredAvailableIssues().map((issue) => (
                      <div
                        key={issue.id}
                        className="list-group-item list-group-item-action"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleIssueSelection(issue.id)}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <input
                            className="form-check-input mt-1"
                            type="checkbox"
                            checked={selectedIssuesToLink.includes(issue.id)}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              cursor: 'pointer',
                              accentColor: '#0B81C5'
                            }}
                          />
                          <div className="flex-grow-1">
                            <div className="fw-medium mb-1">{issue.title}</div>
                            <small className="text-muted">
                              {issue.issueRef} • {issue.building} • {issue.status}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLinkIssueModal(false);
                    setIssueSearchQuery('');
                    setSelectedIssuesToLink([]);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn d-flex align-items-center gap-2"
                  style={{ 
                    backgroundColor: '#0B81C5', 
                    color: 'white',
                    borderColor: '#0B81C5'
                  }}
                  disabled={selectedIssuesToLink.length === 0}
                  onClick={handleConfirmLinkIssues}
                >
                  <LinkIcon size={18} />
                  Link {selectedIssuesToLink.length} issue(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
