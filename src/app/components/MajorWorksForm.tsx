import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Info, Building2, Calendar as CalendarIcon, FileText, Users, AlertCircle, MapPin, GripVertical } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar } from '@/app/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { format } from 'date-fns';

interface MajorWorksFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

// Template data based on work categories - Section 20 Consultation Stages
const getTimelineTemplate = (category: string) => {
  const templates: any = {
    'roof-repairs': [
      { id: '1', name: 'Notice of intention', duration: 30, durationUnit: 'days', tasks: ['Draft NOI with proposed works details', 'Issue NOI to all leaseholders', '30-day observation period (legally required)'] },
      { id: '2', name: 'Tenders', duration: 4, durationUnit: 'weeks', tasks: ['Request tenders from contractors', 'Identify preferred contractor', 'Share tender details with leaseholders'] },
      { id: '3', name: 'Statement of estimate', duration: 30, durationUnit: 'days', tasks: ['Review and approve estimates', 'Send Statement of Estimate to leaseholders', '30-day observation period (legally required)'] },
      { id: '4', name: 'Notice of reasons', duration: 2, durationUnit: 'weeks', tasks: ['Draft Notice of Reasons (if required)', 'Issue to leaseholders', 'Client confirms contractor appointment'] },
      { id: '5', name: 'Completion', duration: 12, durationUnit: 'weeks', tasks: ['Works completed on site', 'Final invoice approved', 'All issues closed'] }
    ],
    'external-repairs': [
      { id: '1', name: 'Notice of intention', duration: 30, durationUnit: 'days', tasks: ['Draft NOI with proposed works details', 'Issue NOI to all leaseholders', '30-day observation period (legally required)'] },
      { id: '2', name: 'Tenders', duration: 3, durationUnit: 'weeks', tasks: ['Request tenders from contractors', 'Identify preferred contractor', 'Share tender details with leaseholders'] },
      { id: '3', name: 'Statement of estimate', duration: 30, durationUnit: 'days', tasks: ['Review and approve estimates', 'Send Statement of Estimate to leaseholders', '30-day observation period (legally required)'] },
      { id: '4', name: 'Notice of reasons', duration: 2, durationUnit: 'weeks', tasks: ['Draft Notice of Reasons (if required)', 'Issue to leaseholders', 'Client confirms contractor appointment'] },
      { id: '5', name: 'Completion', duration: 8, durationUnit: 'weeks', tasks: ['Works completed on site', 'Final invoice approved', 'All issues closed'] }
    ],
    'internal-repairs': [
      { id: '1', name: 'Notice of intention', duration: 30, durationUnit: 'days', tasks: ['Draft NOI with proposed works details', 'Issue NOI to all leaseholders', '30-day observation period (legally required)'] },
      { id: '2', name: 'Tenders', duration: 3, durationUnit: 'weeks', tasks: ['Request tenders from contractors', 'Identify preferred contractor', 'Share tender details with leaseholders'] },
      { id: '3', name: 'Statement of estimate', duration: 30, durationUnit: 'days', tasks: ['Review and approve estimates', 'Send Statement of Estimate to leaseholders', '30-day observation period (legally required)'] },
      { id: '4', name: 'Notice of reasons', duration: 1, durationUnit: 'weeks', tasks: ['Draft Notice of Reasons (if required)', 'Issue to leaseholders', 'Client confirms contractor appointment'] },
      { id: '5', name: 'Completion', duration: 6, durationUnit: 'weeks', tasks: ['Works completed on site', 'Final invoice approved', 'All issues closed'] }
    ],
    'plumbing': [
      { id: '1', name: 'Notice of intention', duration: 30, durationUnit: 'days', tasks: ['Draft NOI with proposed works details', 'Issue NOI to all leaseholders', '30-day observation period (legally required)'] },
      { id: '2', name: 'Tenders', duration: 3, durationUnit: 'weeks', tasks: ['Request tenders from contractors', 'Identify preferred contractor', 'Share tender details with leaseholders'] },
      { id: '3', name: 'Statement of estimate', duration: 30, durationUnit: 'days', tasks: ['Review and approve estimates', 'Send Statement of Estimate to leaseholders', '30-day observation period (legally required)'] },
      { id: '4', name: 'Notice of reasons', duration: 1, durationUnit: 'weeks', tasks: ['Draft Notice of Reasons (if required)', 'Issue to leaseholders', 'Client confirms contractor appointment'] },
      { id: '5', name: 'Completion', duration: 5, durationUnit: 'weeks', tasks: ['Works completed on site', 'Final invoice approved', 'All issues closed'] }
    ],
    'electrical': [
      { id: '1', name: 'Notice of intention', duration: 30, durationUnit: 'days', tasks: ['Draft NOI with proposed works details', 'Issue NOI to all leaseholders', '30-day observation period (legally required)'] },
      { id: '2', name: 'Tenders', duration: 3, durationUnit: 'weeks', tasks: ['Request tenders from contractors', 'Identify preferred contractor', 'Share tender details with leaseholders'] },
      { id: '3', name: 'Statement of estimate', duration: 30, durationUnit: 'days', tasks: ['Review and approve estimates', 'Send Statement of Estimate to leaseholders', '30-day observation period (legally required)'] },
      { id: '4', name: 'Notice of reasons', duration: 1, durationUnit: 'weeks', tasks: ['Draft Notice of Reasons (if required)', 'Issue to leaseholders', 'Client confirms contractor appointment'] },
      { id: '5', name: 'Completion', duration: 5, durationUnit: 'weeks', tasks: ['Works completed on site', 'Final invoice approved', 'All issues closed'] }
    ]
  };
  
  return templates[category] || templates['roof-repairs'];
};

const getRequiredDocuments = (workType: string) => {
  if (workType === 'major-works') {
    return [
      { name: 'Notice of intention', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Draft' },
      { name: 'Structural Survey Report', type: 'Other', category: 'consultation', stage: 'Preparation', status: 'Draft' },
      { name: 'Consultation Estimates', type: 'Estimates', category: 'consultation', stage: 'Estimates', status: 'Draft' },
      { name: 'Right to be represented', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Draft' },
      { name: 'Notice of estimates', type: 'Letter', category: 'consultation', stage: 'Estimates', status: 'Draft' },
      { name: 'Right to nomination', type: 'Letter', category: 'consultation', stage: 'Tender', status: 'Draft' },
      { name: 'Award of contract', type: 'Letter', category: 'consultation', stage: 'Award', status: 'Draft' }
    ];
  }
  return [];
};

// Past projects for template selection
const pastProjects = [
  { 
    id: '1', 
    name: 'Roof Replacement - Burns Court', 
    status: 'Completed',
    workCategory: 'Roof Repairs',
    stages: 5,
    documents: 12,
    leaseholders: 48,
    totalCost: '£125,000',
    duration: '16 weeks',
    projectDocuments: [
      { name: 'Notice of intention', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Completed' },
      { name: 'Tenders received summary', type: 'Report', category: 'consultation', stage: 'Tender', status: 'Completed' },
      { name: 'Statement of estimate', type: 'Letter', category: 'consultation', stage: 'Estimates', status: 'Completed' },
      { name: 'Notice of reasons', type: 'Letter', category: 'consultation', stage: 'Award', status: 'Completed' },
      { name: 'Completion certificate', type: 'Certificate', category: 'consultation', stage: 'Completion', status: 'Completed' },
      { name: 'Contractor proposal', type: 'Document', category: 'technical', stage: 'Planning', status: 'Completed' },
      { name: 'Cost breakdown', type: 'Spreadsheet', category: 'financial', stage: 'Planning', status: 'Completed' },
      { name: 'Site inspection report', type: 'Report', category: 'technical', stage: 'Assessment', status: 'Completed' },
      { name: 'Leaseholder consultation responses', type: 'Document', category: 'consultation', stage: 'Consultation', status: 'Completed' },
      { name: 'Final accounts summary', type: 'Report', category: 'financial', stage: 'Completion', status: 'Completed' },
      { name: 'Photographic evidence', type: 'Document', category: 'technical', stage: 'Completion', status: 'Completed' },
      { name: 'Warranty documents', type: 'Certificate', category: 'legal', stage: 'Completion', status: 'Completed' }
    ]
  },
  { 
    id: '2', 
    name: 'External Repairs - West Side Estate', 
    status: 'Completed',
    workCategory: 'External Repairs',
    stages: 5,
    documents: 10,
    leaseholders: 32,
    totalCost: '£89,500',
    duration: '12 weeks',
    projectDocuments: [
      { name: 'Notice of intention', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Completed' },
      { name: 'Tenders received summary', type: 'Report', category: 'consultation', stage: 'Tender', status: 'Completed' },
      { name: 'Statement of estimate', type: 'Letter', category: 'consultation', stage: 'Estimates', status: 'Completed' },
      { name: 'Notice of reasons', type: 'Letter', category: 'consultation', stage: 'Award', status: 'Completed' },
      { name: 'Completion certificate', type: 'Certificate', category: 'consultation', stage: 'Completion', status: 'Completed' },
      { name: 'Structural assessment', type: 'Report', category: 'technical', stage: 'Assessment', status: 'Completed' },
      { name: 'Material specifications', type: 'Document', category: 'technical', stage: 'Planning', status: 'Completed' },
      { name: 'Cost breakdown', type: 'Spreadsheet', category: 'financial', stage: 'Planning', status: 'Completed' },
      { name: 'Work schedule', type: 'Document', category: 'technical', stage: 'Planning', status: 'Completed' },
      { name: 'Final invoice', type: 'Document', category: 'financial', stage: 'Completion', status: 'Completed' }
    ]
  },
  { 
    id: '3', 
    name: 'Electrical Upgrade - Central Tower', 
    status: 'Completed',
    workCategory: 'Electrical',
    stages: 5,
    documents: 8,
    leaseholders: 24,
    totalCost: '£56,000',
    duration: '10 weeks',
    projectDocuments: [
      { name: 'Notice of intention', type: 'Letter', category: 'consultation', stage: 'Consultation', status: 'Completed' },
      { name: 'Tenders received summary', type: 'Report', category: 'consultation', stage: 'Tender', status: 'Completed' },
      { name: 'Statement of estimate', type: 'Letter', category: 'consultation', stage: 'Estimates', status: 'Completed' },
      { name: 'Notice of reasons', type: 'Letter', category: 'consultation', stage: 'Award', status: 'Completed' },
      { name: 'Electrical safety certificate', type: 'Certificate', category: 'technical', stage: 'Completion', status: 'Completed' },
      { name: 'Circuit diagrams', type: 'Document', category: 'technical', stage: 'Planning', status: 'Completed' },
      { name: 'Compliance certificates', type: 'Certificate', category: 'legal', stage: 'Completion', status: 'Completed' },
      { name: 'Cost breakdown', type: 'Spreadsheet', category: 'financial', stage: 'Planning', status: 'Completed' }
    ]
  }
];

// Draggable Document Item Component
interface DraggableDocumentItemProps {
  doc: any;
  index: number;
  moveDocument: (dragIndex: number, hoverIndex: number) => void;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}

const DraggableDocumentItem = ({ doc, index, moveDocument, isChecked, onToggle }: DraggableDocumentItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ handlerId }, drop] = useDrop({
    accept: 'document',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveDocument(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'document',
    item: () => {
      return { id: doc.name, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      data-handler-id={handlerId}
      className="list-group-item" 
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
    >
      <div className="form-check d-flex align-items-center">
        <div ref={preview} className="me-2" style={{ cursor: 'grab' }}>
          <GripVertical size={16} className="text-muted" />
        </div>
        <input
          className="form-check-input"
          type="checkbox"
          id={`past-doc-${index}`}
          checked={isChecked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <label className="form-check-label d-flex align-items-center w-100 ms-2" htmlFor={`past-doc-${index}`}>
          <FileText size={16} className="me-2 text-primary flex-shrink-0" />
          <div className="flex-grow-1">
            <div className="fw-medium">{doc.name}</div>
            <small className="text-muted">{doc.type} • {doc.category} • {doc.stage}</small>
          </div>
          <span className="badge bg-success ms-2">{doc.status}</span>
        </label>
      </div>
    </div>
  );
};

// Available users for assignment
const availableUsers = [
  { id: 'user-1', name: 'Sarah Johnson', role: 'Property Manager' },
  { id: 'user-2', name: 'James Mitchell', role: 'Senior Property Manager' },
  { id: 'user-3', name: 'Emily Roberts', role: 'Project Coordinator' },
  { id: 'user-4', name: 'Michael Chen', role: 'Building Surveyor' },
  { id: 'user-5', name: 'Rebecca Williams', role: 'Asset Manager' },
  { id: 'user-6', name: 'David Thompson', role: 'Technical Manager' },
];

export default function MajorWorksForm({ onCancel, onSubmit, initialData, mode = 'create' }: MajorWorksFormProps) {
  // Default form data
  const defaultFormData = {
    // Step 1 - Basic Info
    title: 'Roof Replacement and Waterproofing Works',
    description: 'Comprehensive roof replacement including waterproofing membrane installation, gutter repairs, and chimney stack repointing to address ongoing water ingress issues affecting multiple units.',
    workType: 'major-works',
    workCategory: 'roof-repairs',
    urgencyLevel: 'standard',
    projectStatus: 'On hold',
    
    // Step 2 - Property, Budget & Consultation
    estate: 'burns-court',
    building: 'riverside-block',
    estimatedBudget: '125000',
    agentFeeType: 'percentage',
    agentFeeValue: '',
    surveyorFeeType: 'percentage',
    surveyorFeeValue: '',
    unitsAffected: '24',
    startDate: '2025-03-01',
    completionDate: '2025-06-30',
    consultationStage: 'notice-of-intention',
    consultationStartDate: '2025-02-01',
    consultationEndDate: '2025-03-03',
    assignedUsers: [], // Array of user IDs
    
    // Step 3 - Project Template
    useTemplate: false,
    selectedTemplate: null,
    selectedStages: [],
    
    // Step 4 - Documents
    autoCreateDocuments: true,
    usePastProjectDocuments: true,
    selectedDocuments: [],
    
    // Additional
    additionalNotes: ''
  };
  
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef2 = useRef<HTMLDivElement>(null);
  
  // Initialize form data based on mode
  const getInitialFormData = () => {
    if (mode === 'edit' && initialData) {
      // In edit mode, extract data from the work object
      return {
        ...defaultFormData,
        ...initialData.formData,
        title: initialData.title,
        projectStatus: initialData.status || 'In progress'
      };
    }
    return initialData || defaultFormData;
  };
  
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Reset form when initialData changes (e.g., when creating a new form)
  useEffect(() => {
    if (initialData === null) {
      // Reset all state to original values
      setFormData(defaultFormData);
      setCurrentStep(1);
      setUploadedFiles([]);
      setAvailableDocuments([]);
    } else if (mode === 'edit') {
      // Update form data when in edit mode
      setFormData(getInitialFormData());
    }
  }, [initialData, mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideRef1 = userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node);
      const isOutsideRef2 = userDropdownRef2.current && !userDropdownRef2.current.contains(event.target as Node);
      
      if (isOutsideRef1 && isOutsideRef2) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleUserToggle = (userId: string) => {
    const currentUsers = formData.assignedUsers || [];
    const isSelected = currentUsers.includes(userId);
    
    if (isSelected) {
      handleChange('assignedUsers', currentUsers.filter((id: string) => id !== userId));
    } else {
      handleChange('assignedUsers', [...currentUsers, userId]);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).map((file: File) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString()
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const moveDocument = useCallback((dragIndex: number, hoverIndex: number) => {
    const draggedDocument = availableDocuments[dragIndex];
    const newDocuments = [...availableDocuments];
    newDocuments.splice(dragIndex, 1);
    newDocuments.splice(hoverIndex, 0, draggedDocument);
    setAvailableDocuments(newDocuments);
  }, [availableDocuments]);

  const nextStep = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // In edit mode, there's only 1 step, so no next
    if (mode === 'edit') {
      return;
    }
    
    // Auto-population logic (only in create mode)
    if (currentStep === 2 && formData.workCategory && !formData.useTemplate) {
      // Auto-generate timeline based on work category
      const stages = getTimelineTemplate(formData.workCategory);
      handleChange('selectedStages', stages);
      
      // Auto-populate standard documents when moving to Documents step
      const docs = getRequiredDocuments('major-works');
      handleChange('selectedDocuments', docs);
      handleChange('autoCreateDocuments', true);
    }
    
    setCurrentStep(currentStep + 1);
  };

  const prevStep = (e?: React.MouseEvent) => {
    // Prevent any form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // In edit mode, there's only 1 step, so no previous
    if (mode === 'edit') {
      return;
    }
    
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare final data
    const finalData = mode === 'edit' 
      ? {
          // In edit mode, just update the formData with projectStatus
          ...initialData,
          title: formData.title,
          status: formData.projectStatus,
          formData: {
            ...formData
          }
        }
      : {
          // In create mode, include all fields
          ...formData,
          timeline: formData.selectedStages,
          documents: formData.selectedDocuments.map((doc: any, index: number) => ({
            ...doc,
            id: index + 1,
            dueDate: '',
            uploadedDate: '',
            uploadedBy: ''
          })),
          uploadedFiles: uploadedFiles,
          status: 'planning',
          progress: 0,
          createdDate: new Date().toISOString()
        };
    
    onSubmit(finalData);
  };

  const formatWorkCategory = (category: string) => {
    return category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatCurrency = (value: string) => {
    if (!value) return '£0';
    const num = parseFloat(value);
    return `£${num.toLocaleString()}`;
  };

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

  const buildingOptions: any = {
    'no-estate': ['Standalone Building A', 'Standalone Building B', 'Independent Tower', 'Single Property Unit'],
    'burns-court': ['Riverside Block', 'Parkview Block', 'Central Tower'],
    'west-side': ['Riverside Block'],
    'east-end': ['Riverside Block']
  };

  // Building information data
  const buildingInfo: any = {
    'no-estate': {
      'standalone-building-a': {
        name: 'Standalone Building A',
        address: '15 Independent Street, London',
        postcode: 'N1 4QR',
        leaseholders: 12
      },
      'standalone-building-b': {
        name: 'Standalone Building B',
        address: '28 Freehold Avenue, London',
        postcode: 'E2 8LP',
        leaseholders: 16
      },
      'independent-tower': {
        name: 'Independent Tower',
        address: '101 Solo Road, London',
        postcode: 'W1 7NT',
        leaseholders: 28
      },
      'single-property-unit': {
        name: 'Single Property Unit',
        address: '7 Detached Lane, London',
        postcode: 'SW3 6HM',
        leaseholders: 8
      }
    },
    'burns-court': {
      'riverside-block': {
        name: 'Riverside Block',
        address: '45 Thames Street, London',
        postcode: 'SE1 9RY',
        leaseholders: 24
      },
      'parkview-block': {
        name: 'Parkview Block',
        address: '12 Park Avenue, London',
        postcode: 'SW1 2AB',
        leaseholders: 18
      },
      'central-tower': {
        name: 'Central Tower',
        address: '88 Central Road, London',
        postcode: 'EC1 5TY',
        leaseholders: 32
      }
    },
    'west-side': {
      'riverside-block': {
        name: 'Riverside Block',
        address: '23 West Side Street, London',
        postcode: 'W2 3JK',
        leaseholders: 20
      }
    },
    'east-end': {
      'riverside-block': {
        name: 'Riverside Block',
        address: '56 East End Road, London',
        postcode: 'E1 4RP',
        leaseholders: 15
      }
    }
  };

  // Get current building info
  const getCurrentBuildingInfo = () => {
    if (formData.estate && formData.building) {
      return buildingInfo[formData.estate]?.[formData.building];
    }
    return null;
  };

  // Calculate total steps and progress based on mode
  const totalSteps = mode === 'edit' ? 1 : 3;
  const progress = (currentStep / totalSteps) * 100;
  
  // Define steps based on mode
  const steps = mode === 'edit' 
    ? [
        { num: 1, label: 'Edit Details' }
      ]
    : [
        { num: 1, label: 'Basic Info' },
        { num: 2, label: 'Property & Consultation' },
        { num: 3, label: 'Review' }
      ];

  return (
    <div className="container-fluid p-0 h-100">
      <div className="row g-0 h-100">
        <div className="col-12 p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <h2 className="mb-0 fw-bold">
              {mode === 'edit' ? `Edit ${initialData?.title || 'major works'}` : 'Create new major works'}
            </h2>
            {mode === 'edit' && initialData?.status && (
              <span className={`badge ${getStatusBadgeClass(initialData.status)}`}>
                {initialData.status}
              </span>
            )}
          </div>
          
          {/* Progress Indicator - Only show in create mode */}
          {mode === 'create' && (
          <div className="mb-4">
            <div className="progress mb-3" style={{ height: '8px' }}>
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="d-flex justify-content-between">
              {steps.map((step) => (
                <div key={step.num} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: step.num < currentStep ? '#0B81C5' : step.num === currentStep ? '#0B81C5' : '#e9ecef',
                      color: step.num <= currentStep ? '#fff' : '#6c757d',
                      fontWeight: 'bold',
                      fontSize: '24px'
                    }}
                  >
                    {step.num < currentStep ? <CheckCircle size={28} /> : step.num}
                  </div>
                  <span className="text-center" style={{ fontSize: '15px', fontWeight: '600' }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
          )}

          <form onSubmit={handleSubmit}>
            <style>{`
              /* Override Bootstrap primary color with #0B81C5 */
              .form-check-input:checked {
                background-color: #0B81C5 !important;
                border-color: #0B81C5 !important;
              }
              .form-check-input:focus {
                border-color: #0B81C5 !important;
                box-shadow: 0 0 0 0.25rem rgba(11, 129, 197, 0.25) !important;
              }
              .btn-primary {
                background-color: #0B81C5 !important;
                border-color: #0B81C5 !important;
              }
              .btn-primary:hover {
                background-color: #096fa8 !important;
                border-color: #096fa8 !important;
              }
              .btn-primary:focus {
                box-shadow: 0 0 0 0.25rem rgba(11, 129, 197, 0.25) !important;
              }
              .btn-outline-primary {
                color: #0B81C5 !important;
                border-color: #0B81C5 !important;
              }
              .btn-outline-primary:hover {
                background-color: #0B81C5 !important;
                border-color: #0B81C5 !important;
                color: white !important;
              }
              .btn-outline-primary:focus {
                box-shadow: 0 0 0 0.25rem rgba(11, 129, 197, 0.25) !important;
              }
              .btn-outline-primary.active,
              .btn-check:checked + .btn-outline-primary {
                background-color: #0B81C5 !important;
                border-color: #0B81C5 !important;
                color: white !important;
              }
              .text-primary {
                color: #0B81C5 !important;
              }
              .bg-primary {
                background-color: #0B81C5 !important;
              }
              .border-primary {
                border-color: #0B81C5 !important;
              }
              .progress-bar {
                background-color: #0B81C5 !important;
              }
              .badge.bg-primary {
                background-color: #0B81C5 !important;
              }
              .alert-info {
                background-color: rgba(11, 129, 197, 0.1) !important;
                border-color: rgba(11, 129, 197, 0.2) !important;
                color: #096fa8 !important;
              }
              .alert-info .text-primary {
                color: #0B81C5 !important;
              }
              .form-label { font-size: 1.1rem !important; }
              .form-control, .form-select { font-size: 1.05rem !important; padding: 0.6rem 0.75rem !important; }
              .form-check-label { font-size: 1.05rem !important; }
              .card-body h6 { font-size: 1.25rem !important; font-weight: 600 !important; }
              hr { opacity: 0.2; }
            `}</style>
            {/* Step 1: Basic Information (or combined form in edit mode) */}
            {currentStep === 1 && (
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h4 className="mb-1 fw-bold">{mode === 'edit' ? 'Edit Details' : 'Basic Information'}</h4>
                  <p className="text-muted mb-0">{mode === 'edit' ? 'Update major works details' : 'General details about the major works project'}</p>
                </div>
                <div className="card-body">
                  {/* Major Works Title */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Major Works Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Roof Replacement - Riverside Estate"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Description</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Provide detailed description of the works to be undertaken"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </div>

                  <hr className="my-4" />

                  {/* Work Type */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Work type</label>
                    <div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="workType"
                          id="majorWorks"
                          value="major-works"
                          checked={formData.workType === 'major-works'}
                          onChange={(e) => handleChange('workType', e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="majorWorks">
                          Major works
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="workType"
                          id="qualifying"
                          value="qualifying"
                          checked={formData.workType === 'qualifying'}
                          onChange={(e) => handleChange('workType', e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="qualifying">
                          Qualifying long-term agreement
                        </label>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Work Category */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Work category</label>
                    <select
                      className="form-select"
                      value={formData.workCategory}
                      onChange={(e) => handleChange('workCategory', e.target.value)}
                    >
                      <option value="">Select work category</option>
                      <option value="roof-repairs">Roof repairs</option>
                      <option value="external-repairs">External repairs</option>
                      <option value="internal-repairs">Internal repairs</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <hr className="my-4" />

                  {/* Urgency Level */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">Urgency level</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="urgencyLevel"
                          id="urgencyStandard"
                          value="standard"
                          checked={formData.urgencyLevel === 'standard'}
                          onChange={(e) => handleChange('urgencyLevel', e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="urgencyStandard">
                          Standard
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="urgencyLevel"
                          id="urgencyHighPriority"
                          value="high-priority"
                          checked={formData.urgencyLevel === 'high-priority'}
                          onChange={(e) => handleChange('urgencyLevel', e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="urgencyHighPriority">
                          High Priority
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="urgencyLevel"
                          id="urgencyEmergency"
                          value="emergency"
                          checked={formData.urgencyLevel === 'emergency'}
                          onChange={(e) => handleChange('urgencyLevel', e.target.value)}
                        />
                        <label className="form-check-label" htmlFor="urgencyEmergency">
                          Emergency
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Project Status - Only show in edit mode */}
                  {mode === 'edit' && (
                    <>
                      <hr className="my-4" />
                      <div className="mb-3">
                        <label className="form-label fw-medium">Project Status</label>
                        <select
                          className="form-select"
                          value={formData.projectStatus}
                          onChange={(e) => handleChange('projectStatus', e.target.value)}
                        >
                          <option value="On hold">On hold</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Dispensation">Dispensation</option>
                        </select>
                      </div>
                      
                      <hr className="my-4" />
                      
                      {/* Budget & Timeline Section */}
                      <h6 className="mb-3">Budget & Timeline</h6>
                      
                      <div className="mb-3">
                        <label className="form-label fw-medium">Estimated budget</label>
                        <div className="input-group">
                          <span className="input-group-text">£</span>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0.00"
                            value={formData.estimatedBudget}
                            onChange={(e) => handleChange('estimatedBudget', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-medium">Management fee</label>
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.agentFeeValue}
                              onChange={(e) => handleChange('agentFeeValue', e.target.value)}
                              step="0.01"
                            />
                            <select 
                              className="form-select" 
                              style={{ maxWidth: '120px' }}
                              value={formData.agentFeeType}
                              onChange={(e) => handleChange('agentFeeType', e.target.value)}
                            >
                              <option value="percentage">%</option>
                              <option value="amount">£</option>
                            </select>
                          </div>
                          {formData.agentFeeValue && formData.estimatedBudget && formData.agentFeeType === 'percentage' && (
                            <small className="text-muted mt-1 d-block">
                              Amount: {formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.agentFeeValue)) / 100)}
                            </small>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-medium">Surveyor fee</label>
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="0.00"
                              value={formData.surveyorFeeValue}
                              onChange={(e) => handleChange('surveyorFeeValue', e.target.value)}
                              step="0.01"
                            />
                            <select 
                              className="form-select" 
                              style={{ maxWidth: '120px' }}
                              value={formData.surveyorFeeType}
                              onChange={(e) => handleChange('surveyorFeeType', e.target.value)}
                            >
                              <option value="percentage">%</option>
                              <option value="amount">£</option>
                            </select>
                          </div>
                          {formData.surveyorFeeValue && formData.estimatedBudget && formData.surveyorFeeType === 'percentage' && (
                            <small className="text-muted mt-1 d-block">
                              Amount: {formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.surveyorFeeValue)) / 100)}
                            </small>
                          )}
                        </div>
                      </div>

                      <hr className="my-4" />

                      {/* Consultation Details Section */}
                      <h6 className="mb-3">Consultation Details</h6>

                      {/* Assign Users - Multi-select with checkboxes */}
                      <div className="mb-3">
                        <label className="form-label fw-medium">
                          Assign users
                        </label>
                        <div className="dropdown w-100" ref={userDropdownRef}>
                          <button
                            className="form-select text-start d-flex align-items-center justify-content-between"
                            type="button"
                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            style={{ cursor: 'pointer' }}
                          >
                            <span>
                              {formData.assignedUsers && formData.assignedUsers.length > 0
                                ? `${formData.assignedUsers.length} user${formData.assignedUsers.length > 1 ? 's' : ''} selected`
                                : 'Select users'}
                            </span>
                            <ChevronRight 
                              size={16} 
                              className={`transition-transform ${isUserDropdownOpen ? 'rotate-90' : ''}`}
                              style={{ 
                                transform: isUserDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                              }}
                            />
                          </button>
                          
                          {isUserDropdownOpen && (
                            <div 
                              className="dropdown-menu show w-100 p-2" 
                              style={{ 
                                maxHeight: '300px', 
                                overflowY: 'auto',
                                position: 'relative',
                                inset: 'auto'
                              }}
                            >
                              {availableUsers.map((user) => (
                                <div 
                                  key={user.id} 
                                  className="form-check py-2" 
                                  style={{ 
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    paddingLeft: '2.5rem',
                                    paddingRight: '1rem'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`user-${user.id}`}
                                    checked={formData.assignedUsers?.includes(user.id) || false}
                                    onChange={() => handleUserToggle(user.id)}
                                    style={{ marginLeft: '-1.5rem' }}
                                  />
                                  <label 
                                    className="form-check-label w-100" 
                                    htmlFor={`user-${user.id}`}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <span className="fw-medium">{user.name}</span>
                                  </label>
                                </div>
                              ))}
                              
                              {availableUsers.length === 0 && (
                                <div className="text-center text-muted py-3">
                                  No users available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Display selected users */}
                        {formData.assignedUsers && formData.assignedUsers.length > 0 && (
                          <div className="mt-2 d-flex flex-wrap gap-2">
                            {formData.assignedUsers.map((userId: string) => {
                              const user = availableUsers.find(u => u.id === userId);
                              return user ? (
                                <span key={userId} className="badge bg-primary d-flex align-items-center gap-1">
                                  {user.name}
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    style={{ fontSize: '0.6rem' }}
                                    onClick={() => handleUserToggle(userId)}
                                    aria-label="Remove"
                                  />
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Expected start date</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="form-control text-start d-flex align-items-center justify-content-between"
                              style={{ height: 'auto' }}
                            >
                              {formData.consultationStartDate ? (
                                format(new Date(formData.consultationStartDate), 'dd MMM yyyy')
                              ) : (
                                <span className="text-muted">Select date</span>
                              )}
                              <CalendarIcon size={16} className="text-muted" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.consultationStartDate ? new Date(formData.consultationStartDate) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const formattedDate = format(date, 'yyyy-MM-dd');
                                  handleChange('consultationStartDate', formattedDate);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Property, Budget & Consultation - Only in create mode */}
            {currentStep === 2 && mode === 'create' && (
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h4 className="mb-1 fw-bold">Property, Budget & Consultation</h4>
                  <p className="text-muted mb-0">Select affected properties and set project parameters</p>
                </div>
                <div className="card-body">
                  {/* Section A: Property Selection */}
                  <h6 className="mb-3">Property Selection</h6>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">
                        <MapPin size={16} className="me-1 text-primary" />
                        Estate
                      </label>
                      <select
                        className="form-select"
                        value={formData.estate}
                        onChange={(e) => {
                          setFormData({ ...formData, estate: e.target.value, building: '' });
                        }}
                      >
                        <option value="">Please select an estate</option>
                        <option value="no-estate">No estate</option>
                        <option value="burns-court">Burns Court</option>
                        <option value="west-side">West Side Estate</option>
                        <option value="east-end">East End Complex</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-medium">
                        <Building2 size={16} className="me-1 text-primary" />
                        Building
                      </label>
                      {!formData.estate ? (
                        <select className="form-select" disabled>
                          <option>Please select an estate first</option>
                        </select>
                      ) : (
                        <select
                          className="form-select"
                          value={formData.building}
                          onChange={(e) => handleChange('building', e.target.value)}
                        >
                          <option value="">Please select a building</option>
                          {buildingOptions[formData.estate]?.map((building: string) => (
                            <option key={building} value={building.toLowerCase().replace(' ', '-')}>
                              {building}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Building Info Alert */}
                  {getCurrentBuildingInfo() && (
                    <div className="alert alert-primary d-flex align-items-start mb-4" role="alert">
                      <AlertCircle className="me-2 flex-shrink-0" size={20} />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <Building2 size={16} className="me-2" />
                          <strong>{getCurrentBuildingInfo().name}</strong>
                        </div>
                        <p className="mb-1 small">
                          {getCurrentBuildingInfo().address} • {getCurrentBuildingInfo().postcode}
                        </p>
                        <p className="mb-0 small d-flex align-items-center">
                          <Users size={14} className="me-1" />
                          {getCurrentBuildingInfo().leaseholders} Leaseholders
                        </p>
                      </div>
                    </div>
                  )}

                  <hr className="my-4" />

                  {/* Section B: Budget & Timeline */}
                  <h6 className="mb-3">Budget & Timeline</h6>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium">Estimated budget</label>
                    <div className="input-group">
                      <span className="input-group-text">£</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        value={formData.estimatedBudget}
                        onChange={(e) => handleChange('estimatedBudget', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Management fee</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          value={formData.agentFeeValue}
                          onChange={(e) => handleChange('agentFeeValue', e.target.value)}
                          step="0.01"
                        />
                        <select 
                          className="form-select" 
                          style={{ maxWidth: '120px' }}
                          value={formData.agentFeeType}
                          onChange={(e) => handleChange('agentFeeType', e.target.value)}
                        >
                          <option value="percentage">%</option>
                          <option value="amount">£</option>
                        </select>
                      </div>
                      {formData.agentFeeValue && formData.estimatedBudget && formData.agentFeeType === 'percentage' && (
                        <small className="text-muted mt-1 d-block">
                          Amount: {formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.agentFeeValue)) / 100)}
                        </small>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Surveyor fee</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          value={formData.surveyorFeeValue}
                          onChange={(e) => handleChange('surveyorFeeValue', e.target.value)}
                          step="0.01"
                        />
                        <select 
                          className="form-select" 
                          style={{ maxWidth: '120px' }}
                          value={formData.surveyorFeeType}
                          onChange={(e) => handleChange('surveyorFeeType', e.target.value)}
                        >
                          <option value="percentage">%</option>
                          <option value="amount">£</option>
                        </select>
                      </div>
                      {formData.surveyorFeeValue && formData.estimatedBudget && formData.surveyorFeeType === 'percentage' && (
                        <small className="text-muted mt-1 d-block">
                          Amount: {formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.surveyorFeeValue)) / 100)}
                        </small>
                      )}
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Section C: Consultation Details */}
                  <h6 className="mb-3">Consultation Details</h6>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Consultation stage</label>
                    <select
                      className="form-select"
                      value={formData.consultationStage || ''}
                      onChange={(e) => handleChange('consultationStage', e.target.value)}
                    >
                      <option value="">Select consultation stage</option>
                      <option value="notice-intention">Notice of intention</option>
                      <option value="tenders">Tenders</option>
                      <option value="statement-estimate">Statement of estimate</option>
                      <option value="notice-reasons">Notice of reasons</option>
                      <option value="completion">Completion</option>
                    </select>
                  </div>

                  {/* Assign Users - Multi-select with checkboxes */}
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      Assign users
                    </label>
                    <div className="dropdown w-100" ref={userDropdownRef2}>
                      <button
                        className="form-select text-start d-flex align-items-center justify-content-between"
                        type="button"
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>
                          {formData.assignedUsers && formData.assignedUsers.length > 0
                            ? `${formData.assignedUsers.length} user${formData.assignedUsers.length > 1 ? 's' : ''} selected`
                            : 'Select users'}
                        </span>
                        <ChevronRight 
                          size={16} 
                          className={`transition-transform ${isUserDropdownOpen ? 'rotate-90' : ''}`}
                          style={{ 
                            transform: isUserDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </button>
                      
                      {isUserDropdownOpen && (
                        <div 
                          className="dropdown-menu show w-100 p-2" 
                          style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto',
                            position: 'relative',
                            inset: 'auto'
                          }}
                        >
                          {availableUsers.map((user) => (
                            <div 
                              key={user.id} 
                              className="form-check py-2" 
                              style={{ 
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                paddingLeft: '2.5rem',
                                paddingRight: '1rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`user-step2-${user.id}`}
                                checked={formData.assignedUsers?.includes(user.id) || false}
                                onChange={() => handleUserToggle(user.id)}
                                style={{ marginLeft: '-1.5rem' }}
                              />
                              <label 
                                className="form-check-label w-100" 
                                htmlFor={`user-step2-${user.id}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <span className="fw-medium">{user.name}</span>
                              </label>
                            </div>
                          ))}
                          
                          {availableUsers.length === 0 && (
                            <div className="text-center text-muted py-3">
                              No users available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Display selected users */}
                    {formData.assignedUsers && formData.assignedUsers.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {formData.assignedUsers.map((userId: string) => {
                          const user = availableUsers.find(u => u.id === userId);
                          return user ? (
                            <span key={userId} className="badge bg-primary d-flex align-items-center gap-1">
                              {user.name}
                              <button
                                type="button"
                                className="btn-close btn-close-white"
                                style={{ fontSize: '0.6rem' }}
                                onClick={() => handleUserToggle(userId)}
                                aria-label="Remove"
                              />
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">Expected start date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="form-control text-start d-flex align-items-center justify-content-between"
                          style={{ height: 'auto' }}
                        >
                          {formData.consultationStartDate ? (
                            format(new Date(formData.consultationStartDate), 'dd MMM yyyy')
                          ) : (
                            <span className="text-muted">Select date</span>
                          )}
                          <CalendarIcon size={16} className="text-muted" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.consultationStartDate ? new Date(formData.consultationStartDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = format(date, 'yyyy-MM-dd');
                              handleChange('consultationStartDate', formattedDate);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <hr className="my-4" />

                  <h6 className="mb-3">Supporting documents</h6>
                  <div
                    className={`border rounded-3 p-4 text-center ${isDragging ? 'border-primary bg-light' : ''}`}
                    style={{
                      borderStyle: 'dashed',
                      borderWidth: '2px',
                      cursor: 'pointer'
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      id="property-consultation-upload"
                      type="file"
                      multiple
                      className="d-none"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <label htmlFor="property-consultation-upload" className="d-block mb-0" style={{ cursor: 'pointer' }}>
                      <FileText size={28} className="text-primary mb-3" />
                      <div className="fw-medium mb-1">Upload project documents</div>
                      <div className="text-muted small">Drag and drop files here, or click to browse</div>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-3">
                      <div className="fw-medium mb-2">
                        {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} added
                      </div>
                      <div className="list-group">
                        {uploadedFiles.map((file: any, index: number) => (
                          <div key={`${file.name}-${index}`} className="list-group-item">
                            <div className="d-flex align-items-start">
                              <FileText size={16} className="me-2 text-success mt-1 flex-shrink-0" />
                              <div className="flex-grow-1">
                                <div className="fw-medium">{file.name}</div>
                                <small className="text-muted">{(file.size / 1024).toFixed(2)} KB</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit - Only in create mode */}
            {currentStep === 3 && mode === 'create' && (
              <div>
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h4 className="mb-1 fw-bold">Review & Create</h4>
                    <p className="text-muted mb-0">{mode === 'edit' ? 'Review all details before saving changes' : 'Review all details before creating the major works project'}</p>
                  </div>
                  <div className="card-body">
                    {/* Section 1: Basic Information */}
                    <div className="mb-4">
                      <h6 className="mb-3 d-flex align-items-center">
                        <Info size={18} className="me-2 text-primary" />
                        Basic Information
                      </h6>
                      <div className="ps-4">
                        <div className="row">
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted">Project Title:</strong>
                            <div>{formData.title || <span className="text-muted">Not provided</span>}</div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted">Work Category:</strong>
                            <div>{formData.workCategory ? formatWorkCategory(formData.workCategory) : <span className="text-muted">Not selected</span>}</div>
                          </div>
                          <div className="col-12 mb-2">
                            <strong className="text-muted">Description:</strong>
                            <div>{formData.description || <span className="text-muted">No description provided</span>}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* Section 2: Property & Consultation Details */}
                    <div className="mb-4">
                      <h6 className="mb-3 d-flex align-items-center">
                        <Building2 size={18} className="me-2 text-primary" />
                        Property & Consultation Details
                      </h6>
                      <div className="ps-4">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <strong className="text-muted d-block mb-1">Estate:</strong>
                            <div>{formData.estate ? formatWorkCategory(formData.estate) : <span className="text-muted">Not selected</span>}</div>
                          </div>
                          <div className="col-md-6 mb-3">
                            <strong className="text-muted d-block mb-1">Building:</strong>
                            <div>{formData.building ? formatWorkCategory(formData.building) : <span className="text-muted">Not selected</span>}</div>
                          </div>
                          {getCurrentBuildingInfo() && (
                            <div className="col-12 mb-3">
                              <div className="alert alert-light border d-flex align-items-start">
                                <Building2 size={16} className="me-2 text-primary mt-1" />
                                <div>
                                  <strong>{getCurrentBuildingInfo().name}</strong>
                                  <div className="small text-muted">{getCurrentBuildingInfo().address} • {getCurrentBuildingInfo().postcode}</div>
                                  <div className="small text-muted d-flex align-items-center">
                                    <Users size={14} className="me-1" />
                                    {getCurrentBuildingInfo().leaseholders} Leaseholders
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Estimated Budget:</strong>
                            <div>{formData.estimatedBudget ? formatCurrency(formData.estimatedBudget) : <span className="text-muted">Not provided</span>}</div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Management Fee:</strong>
                            <div>
                              {formData.agentFeeValue ? (
                                <>
                                  {formData.agentFeeType === 'percentage' ? (
                                    <>
                                      {formData.agentFeeValue}% 
                                      {formData.estimatedBudget && (
                                        <span className="text-muted"> ({formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.agentFeeValue)) / 100)})</span>
                                      )}
                                    </>
                                  ) : (
                                    formatCurrency(formData.agentFeeValue)
                                  )}
                                </>
                              ) : <span className="text-muted">Not provided</span>}
                            </div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Surveyor Fee:</strong>
                            <div>
                              {formData.surveyorFeeValue ? (
                                <>
                                  {formData.surveyorFeeType === 'percentage' ? (
                                    <>
                                      {formData.surveyorFeeValue}%
                                      {formData.estimatedBudget && (
                                        <span className="text-muted"> ({formatCurrency((parseFloat(formData.estimatedBudget) * parseFloat(formData.surveyorFeeValue)) / 100)})</span>
                                      )}
                                    </>
                                  ) : (
                                    formatCurrency(formData.surveyorFeeValue)
                                  )}
                                </> 
                              ) : <span className="text-muted">Not provided</span>}
                            </div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Project Start Date:</strong>
                            <div>{formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="text-muted">Not set</span>}</div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Expected Completion Date:</strong>
                            <div>{formData.completionDate ? new Date(formData.completionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="text-muted">Not set</span>}</div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Consultation Stage:</strong>
                            <div>{formData.consultationStage ? formatWorkCategory(formData.consultationStage) : <span className="text-muted">Not selected</span>}</div>
                          </div>
                          <div className="col-md-6 mb-2">
                            <strong className="text-muted d-block mb-1">Consultation Period:</strong>
                            <div>
                              {formData.consultationStartDate && formData.consultationEndDate ? (
                                <>
                                  {new Date(formData.consultationStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
                                  {' → '}
                                  {new Date(formData.consultationEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </>
                              ) : (
                                <span className="text-muted">Not set</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* Section 3: Template Selection */}
                    <div className="mb-4">
                      <h6 className="mb-3 d-flex align-items-center">
                        <FileText size={18} className="me-2 text-primary" />
                        Project Template
                      </h6>
                      <div className="ps-4">
                        {formData.selectedTemplate ? (
                          <div className="alert alert-info d-flex align-items-start mb-0">
                            <CheckCircle size={18} className="me-2 mt-1 flex-shrink-0" />
                            <div>
                              <strong>Template Used:</strong> {pastProjects.find(p => p.id === formData.selectedTemplate)?.name}
                              <div className="small text-muted mt-1">
                                Documents and settings from this past project will be used as a starting point
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted d-flex align-items-center">
                            <AlertCircle size={16} className="me-2" />
                            No template selected - starting from scratch
                          </div>
                        )}
                      </div>
                    </div>

                    <hr className="my-4" />

                    {/* Section 4: Documents */}
                    <div className="mb-4">
                      <h6 className="mb-3 d-flex align-items-center">
                        <FileText size={18} className="me-2 text-primary" />
                        Documents
                      </h6>
                      <div className="ps-4">
                        {(formData.selectedDocuments.length > 0 || formData.autoCreateDocuments) && (
                          <>
                            <div className="mb-3">
                              <strong>{(formData.selectedDocuments.length > 0 ? formData.selectedDocuments : getRequiredDocuments('major-works')).length} standard document{(formData.selectedDocuments.length > 0 ? formData.selectedDocuments : getRequiredDocuments('major-works')).length !== 1 ? 's' : ''} will be created</strong>
                              <span className="badge bg-primary ms-2">Auto-generated</span>
                            </div>
                            <div className="list-group">
                              {(formData.selectedDocuments.length > 0 ? formData.selectedDocuments : getRequiredDocuments('major-works')).map((doc: any, index: number) => (
                                <div key={index} className="list-group-item">
                                  <div className="d-flex align-items-start">
                                    <FileText size={16} className="me-2 text-primary mt-1 flex-shrink-0" />
                                    <div className="flex-grow-1">
                                      <div className="fw-medium">{doc.name}</div>
                                      <small className="text-muted">{doc.type} • {doc.stage}</small>
                                    </div>
                                    <span className="badge bg-secondary">{doc.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                          <div className="mt-4">
                            <strong className="d-block mb-2">{uploadedFiles.length} additional file{uploadedFiles.length !== 1 ? 's' : ''} uploaded</strong>
                            <div className="list-group">
                              {uploadedFiles.map((file: any, index: number) => (
                                <div key={index} className="list-group-item">
                                  <div className="d-flex align-items-start">
                                    <FileText size={16} className="me-2 text-success mt-1 flex-shrink-0" />
                                    <div className="flex-grow-1">
                                      <div className="fw-medium">{file.name}</div>
                                      <small className="text-muted">{(file.size / 1024).toFixed(2)} KB</small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 5: What Will Be Created */}
                    <div className="mb-0">
                      <h6 className="mb-3 d-flex align-items-center">
                        <CheckCircle size={18} className="me-2 text-success" />
                        What Will Be Created
                      </h6>
                      <div className="ps-4">
                        <div className="alert alert-success mb-0">
                          <ul className="mb-0 ps-3">
                            <li className="mb-2">
                              <strong>Complete Project Structure:</strong> Full major works project with all configured details and settings
                            </li>
                            {(formData.selectedDocuments.length > 0 || formData.autoCreateDocuments) && (
                              <li className="mb-2">
                                <strong>Section 20 Documents:</strong> {(formData.selectedDocuments.length > 0 ? formData.selectedDocuments : getRequiredDocuments('major-works')).length} consultation document{(formData.selectedDocuments.length > 0 ? formData.selectedDocuments : getRequiredDocuments('major-works')).length !== 1 ? 's' : ''} ready for review and customization
                              </li>
                            )}
                            {uploadedFiles.length > 0 && (
                              <li className="mb-2">
                                <strong>Uploaded Files:</strong> {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} attached during setup
                              </li>
                            )}
                            {formData.estimatedBudget && (
                              <li className="mb-2">
                                <strong>Budget Framework:</strong> Pre-configured with estimated budget of {formatCurrency(formData.estimatedBudget)}
                              </li>
                            )}
                            {formData.unitsAffected && (
                              <li className="mb-2">
                                <strong>Unit Management:</strong> Track and manage {formData.unitsAffected} affected units
                              </li>
                            )}
                            <li className="mb-0">
                              <strong>Progress Tracking:</strong> Automatic analytics, timelines, and reporting dashboards
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="d-flex justify-content-between">
              <div className="d-flex gap-2">
                {currentStep > 1 && mode === 'create' && (
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary d-flex align-items-center gap-2"
                    onClick={(e) => prevStep(e)}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
              
              <div className="d-flex gap-2">
                {mode === 'edit' ? (
                  <button 
                    type="submit" 
                    className="btn btn-success d-flex align-items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Save changes
                  </button>
                ) : (
                  <>
                    {currentStep < totalSteps ? (
                      <button 
                        type="button" 
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={(e) => nextStep(e)}
                      >
                        Next
                        <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        className="btn btn-success d-flex align-items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Create major works
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
