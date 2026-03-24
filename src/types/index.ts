// TypeScript interfaces for Fixflo Major Works Management System

export type WorkStatus = 'In progress' | 'On hold' | 'Completed' | 'Delayed' | 'Cancelled' | 'Dispensation' | 'Archived';

export type ConsultationStage = 
  | 'notice-of-intention'
  | 'first-notice'
  | 'tenders'
  | 'statement-of-estimate'
  | 'notice-of-reasons'
  | 'ongoing-works'
  | 'completion';

export type WorkType = 'major-works' | 'improvements' | 'cyclical-works' | 'emergency-works';
export type ObservationChannel = 'email' | 'post' | 'phone' | 'portal' | 'internal-note';
export type ObservationStatus = 'new' | 'reviewing' | 'responded';

export type WorkCategory = 
  | 'roof-repairs'
  | 'external-repairs'
  | 'internal-repairs'
  | 'plumbing'
  | 'electrical'
  | 'fire-safety'
  | 'structural-works'
  | 'decorating'
  | 'lift-repairs';

export type UrgencyLevel = 'emergency' | 'urgent' | 'standard';

export type FeeType = 'percentage' | 'fixed';

export interface MajorWorkFormData {
  // Step 1 - Details
  title: string;
  description: string;
  workType: WorkType;
  workCategory: WorkCategory;
  urgencyLevel: UrgencyLevel;
  projectStatus?: WorkStatus;
  
  // Step 1 - Property & Budget
  estate: string;
  building: string;
  estimatedBudget: string;
  agentFeeType: FeeType;
  agentFeeValue: string;
  surveyorFeeType: FeeType;
  surveyorFeeValue: string;
  unitsAffected: string;
  startDate: string;
  completionDate: string;
  
  // Step 2 - Consultation
  consultationStage: ConsultationStage;
  consultationStartDate: string;
  consultationEndDate: string;
  assignedUsers?: string[];
  
  // Step 2 - Timeline
  useTemplate?: boolean;
  selectedTemplate?: string | null;
  selectedStages?: TimelineStage[];

  cdmAssessment?: boolean;
  cdmReasons?: {
    exceeds30Days: boolean;
    moreThan20Workers: boolean;
    exceeds500PersonDays: boolean;
    multipleTradesConcurrent: boolean;
  };
  cdmAdditionalChecks?: {
    principalDesigner: boolean;
    principalContractor: boolean;
    hseF10: boolean;
    hseF10Submitted: boolean;
    constructionPhasePlan: boolean;
    healthSafetyFile: boolean;
  };
  
  // Step 4 - Documents
  autoCreateDocuments?: boolean;
  usePastProjectDocuments?: boolean;
  selectedDocuments?: string[];
  
  // Additional
  additionalNotes?: string;
  
  // Tenders stage specific
  lowestQuoteAccepted?: boolean;
  quoteJustificationReason?: string;
  quoteJustificationExplanation?: string;
  
  // Task completions
  taskCompletions?: { [stageId: string]: { [taskId: string]: boolean } };
}

export interface TimelineStage {
  id: string;
  name: string;
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
  tasks: string[];
  status?: 'completed' | 'active' | 'pending';
  isDelayed?: boolean;
  deadline?: {
    daysLeft: number;
    totalDays: number;
  };
}

export interface MajorWork {
  id: string;
  title: string;
  location: string;
  createdOn: string;
  stage: string;
  status: WorkStatus;
  agentFee: number;
  propertyManager: string;
  formData?: MajorWorkFormData;
  isNew?: boolean;
  createdAt?: string;
}

export interface Observation {
  id: string;
  workId: string;
  leaseholderId: string;
  leaseholderName: string;
  stage: ConsultationStage;
  receivedOn: string;
  channel: ObservationChannel;
  message: string;
  isObjection: boolean;
  status: ObservationStatus;
  documentId?: number | string;
  documentName?: string;
}

export interface Document {
  id: number | string;
  name: string;
  type: string;
  category: 'consultation' | 'project';
  stage?: string;
  status?: string;
  dueDate?: string;
  sentDate?: string | null;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  recipients?: { label: string; count: number }[];
  lastUpdated?: string;
  lastUpdatedBy?: string;
  description?: string;
  visibility?: 'internal' | 'external';
  uploadedDate?: string;
  uploadedBy?: string;
}

export interface Issue {
  id: string;
  issueNumber: string;
  title: string;
  location: string;
  dateRaised: string;
  status: string;
  slaStatus: string;
  assignedTo: string;
  linked: boolean;
}

export interface PropertyInfo {
  apartmentCount: number;
  address: string;
  leaseholderCount: number;
}

export interface User {
  id: string;
  name: string;
  role: string;
}

// Constants
export const CONSULTATION_STAGE_LABELS: Record<ConsultationStage, string> = {
  'notice-of-intention': 'Notice of intention',
  'first-notice': 'First notice',
  'tenders': 'Tenders',
  'statement-of-estimate': 'Statement of estimate',
  'notice-of-reasons': 'Notice of reasons',
  'ongoing-works': 'Ongoing works',
  'completion': 'Completion'
};

export const STATUS_BADGE_CLASSES: Record<WorkStatus, string> = {
  'In progress': 'bg-success',
  'On hold': 'bg-secondary',
  'Completed': 'bg-primary',
  'Delayed': 'bg-warning',
  'Cancelled': 'bg-danger',
  'Dispensation': 'bg-danger',
  'Archived': 'bg-dark'
};
