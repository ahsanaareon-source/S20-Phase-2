import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  MessageSquare,
  Upload
} from 'lucide-react';

interface NewDocumentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  existingDocuments?: any[];
}

type PurposeId = 'notice' | 'tender' | 'supporting';
type DocumentTypeId = 'notice' | 'quotes' | 'consultation' | 'estimate' | 'other';
type RecipientKey = 'leaseholders' | 'directors' | 'managingAgents' | 'freeholders';

interface ConsultationTemplate {
  id: string;
  purpose: PurposeId;
  label: string;
  description: string;
  documentType: DocumentTypeId;
  defaultStage: string;
  defaultRecipients: RecipientKey[];
}

interface ConsultationFormData {
  purpose: PurposeId | '';
  documentKind: string;
  documentType: DocumentTypeId | '';
  documentName: string;
  stage: string;
  contentSource: 'template' | 'upload';
  templateId: string;
  templateName: string;
  templateText: string;
  description: string;
  uploadedFile: File | null;
  recipients: Record<RecipientKey, boolean>;
  dueDate: string;
}

interface DocumentContentTemplate {
  id: string;
  label: string;
  description: string;
  body: string;
}

const emptyRecipients: Record<RecipientKey, boolean> = {
  leaseholders: false,
  directors: false,
  managingAgents: false,
  freeholders: false
};

const purposeOptions: Array<{
  id: PurposeId;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    id: 'notice',
    label: 'Create a notice',
    description: 'For NOI, statement of estimate, and notice of reasons.',
    icon: FileText
  },
  {
    id: 'tender',
    label: 'Issue tender / quote documents',
    description: 'For quote packs, estimate packs, and comparisons.',
    icon: DollarSign
  },
  {
    id: 'supporting',
    label: 'Add supporting document',
    description: 'For editable consultation support documents such as leaseholder FAQs.',
    icon: MessageSquare
  }
];

const templates: ConsultationTemplate[] = [
  {
    id: 'notice_of_intention',
    purpose: 'notice',
    label: 'Notice of intention',
    description: 'Stage 1 statutory consultation notice.',
    documentType: 'notice',
    defaultStage: 'Notice of intention',
    defaultRecipients: ['leaseholders']
  },
  {
    id: 'statement_of_estimate',
    purpose: 'notice',
    label: 'Statement of estimate',
    description: 'Issue estimates for consultation review.',
    documentType: 'estimate',
    defaultStage: 'Statement of estimate',
    defaultRecipients: ['leaseholders', 'directors']
  },
  {
    id: 'notice_of_reasons',
    purpose: 'notice',
    label: 'Notice of reasons',
    description: 'Explain appointment decision where required.',
    documentType: 'notice',
    defaultStage: 'Notice of reasons',
    defaultRecipients: ['leaseholders']
  },
  {
    id: 'notice_of_award',
    purpose: 'notice',
    label: 'Notice of award',
    description: 'Confirm contractor appointment where award notice is used.',
    documentType: 'notice',
    defaultStage: 'Notice of award',
    defaultRecipients: ['leaseholders']
  },
  {
    id: 'quote_pack',
    purpose: 'tender',
    label: 'Contractor quote pack',
    description: 'Share contractor quotes for review.',
    documentType: 'quotes',
    defaultStage: 'Tender',
    defaultRecipients: ['leaseholders', 'directors']
  },
  {
    id: 'estimate_pack',
    purpose: 'tender',
    label: 'Estimate pack',
    description: 'Issue estimate pack for review and comparison.',
    documentType: 'estimate',
    defaultStage: 'Statement of estimate',
    defaultRecipients: ['leaseholders', 'directors']
  },
  {
    id: 'comparison_document',
    purpose: 'tender',
    label: 'Comparison document',
    description: 'Summarise quote comparison and key differences.',
    documentType: 'consultation',
    defaultStage: 'Tender',
    defaultRecipients: ['leaseholders', 'directors']
  },
  {
    id: 'leaseholder_faq',
    purpose: 'supporting',
    label: 'Leaseholder FAQ',
    description: 'Answer common consultation questions.',
    documentType: 'consultation',
    defaultStage: 'Notice of intention',
    defaultRecipients: ['leaseholders']
  }
];

const stages = [
  'Notice of intention',
  'Statement of estimate',
  'Notice of reasons',
  'Notice of award',
  'Tender',
  'Completion'
];

const standardTemplate: DocumentContentTemplate = {
  id: 'section20-standard-template',
  label: 'Section 20 consultation notice template',
  description: 'Draft format aligned to common Section 20 notice structure (edit per case and legal review process).',
  body: `To: {{leaseholder_name}}
Property: {{leaseholder_property}}
Postal address: {{postal_address}}
And: [Recognised Tenants' Association, if applicable]

Section 20 Consultation - Notice of Intention (Draft)
Premises: [Building / block name]
Landlord or Manager: [Entity name]

1. We intend to carry out qualifying works for which consultation is required under section 20 of the Landlord and Tenant Act 1985.

2. General description of the proposed works:
[Insert high-level description of works]

3. If full documents are provided for inspection:
[Insert inspection address, days, and times]

4. Reasons the works are considered necessary:
[Insert reasons]

5. You are invited to send written observations to:
[Insert postal / email address for observations]

6. The consultation period is 30 days from the date this notice is served.
Observations must be received by: {{consultation_deadline}}

7. Leaseholders may nominate a contractor for tender where this applies.
Nomination details should be submitted within the same consultation period.

Signed: [Name]
For and on behalf of: [Landlord / Manager / Authorised Agent]
Address for future correspondence: [Insert address]
Date of notice: [Insert date]`
};

const initialFormData: ConsultationFormData = {
  purpose: '',
  documentKind: '',
  documentType: '',
  documentName: '',
  stage: '',
  contentSource: 'template',
  templateId: '',
  templateName: '',
  templateText: '',
  description: '',
  uploadedFile: null,
  recipients: { ...emptyRecipients },
  dueDate: ''
};

export default function NewDocumentModal({ show, onClose, onSubmit, existingDocuments = [] }: NewDocumentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ConsultationFormData>(initialFormData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTemplateStages = useMemo(
    () => new Set(templates.filter(template => template.purpose === 'notice').map(template => template.defaultStage)),
    []
  );
  const existingNoticeStages = useMemo(
    () =>
      new Set(
        existingDocuments
          .filter(document => document.category === 'consultation' && noticeTemplateStages.has(document.stage))
          .map(document => document.stage)
      ),
    [existingDocuments, noticeTemplateStages]
  );

  const availableTemplates = useMemo(
    () => templates.filter(template => template.purpose === formData.purpose),
    [formData.purpose]
  );

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === formData.documentKind) || null,
    [formData.documentKind]
  );

  const isTemplateUnavailable = (template: ConsultationTemplate) =>
    template.purpose === 'notice' && existingNoticeStages.has(template.defaultStage);

  const resetAndClose = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    onClose();
  };

  const updateFormData = <K extends keyof ConsultationFormData>(field: K, value: ConsultationFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setCreationMethod = (method: ConsultationFormData['contentSource']) => {
    setFormData(prev => ({
      ...prev,
      purpose: '',
      documentKind: '',
      documentType: '',
      documentName: '',
      stage: '',
      contentSource: method,
      templateId: method === 'template' ? standardTemplate.id : '',
      templateName: method === 'template' ? standardTemplate.label : '',
      templateText: method === 'template' ? standardTemplate.body : '',
      uploadedFile: null,
      recipients: { ...emptyRecipients }
    }));
  };

  const setPurpose = (purpose: PurposeId) => {
    setFormData(prev => ({
      ...prev,
      purpose,
      documentKind: '',
      documentType: '',
      documentName: '',
      stage: '',
      contentSource: 'template',
      templateId: '',
      templateName: '',
      templateText: '',
      uploadedFile: null,
      recipients: { ...emptyRecipients }
    }));
  };

  const applyTemplate = (template: ConsultationTemplate) => {
    if (isTemplateUnavailable(template)) {
      return;
    }

    const recipients = { ...emptyRecipients };
    template.defaultRecipients.forEach(key => {
      recipients[key] = true;
    });

    setFormData(prev => ({
      ...prev,
      documentKind: template.id,
      documentType: template.documentType,
      documentName: template.label,
      stage: template.defaultStage,
      templateId: standardTemplate.id,
      templateName: standardTemplate.label,
      templateText: standardTemplate.body,
      recipients
    }));
  };

  const canContinue = () => {
    if (currentStep === 1) {
      return Boolean(formData.contentSource);
    }
    if (currentStep === 2) {
      if (formData.contentSource === 'template') {
        return Boolean(formData.documentKind);
      }
      return Boolean(formData.uploadedFile);
    }
    if (currentStep === 3) {
      if (formData.contentSource === 'upload') {
        return true;
      }
      return Boolean(formData.documentName.trim()) && Boolean(formData.stage);
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedTemplate && isTemplateUnavailable(selectedTemplate)) {
      return;
    }

    onSubmit({
      documentType: formData.documentType || 'other',
      documentName: formData.documentName || formData.uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'Uploaded document',
      stage: formData.stage || 'Not set',
      contentSource: formData.contentSource,
      description: formData.description,
      uploadedFile: formData.uploadedFile,
      recipients: formData.recipients,
      dueDate: formData.dueDate,
      templateId: formData.templateId,
      templateName: formData.templateName,
      templateText: formData.templateText
    });
    resetAndClose();
  };

  if (!show) {
    return null;
  }

  const stepLabels = [
    'Method',
    formData.contentSource === 'upload' ? 'Upload' : 'Template',
    'Details',
    'Review'
  ];

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '10px' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-3">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h5 className="modal-title fw-semibold mb-0" style={{ fontSize: '18px', letterSpacing: '-0.44px' }}>
                  Create consultation document
                </h5>
                <button type="button" className="btn-close" onClick={resetAndClose} aria-label="Close" />
              </div>

              <div className="d-flex align-items-center mb-3" style={{ gap: '8px' }}>
                {[1, 2, 3, 4].map(step => {
                  const isLastStep = step === 4;
                  return (
                    <div key={step} className="d-flex align-items-center" style={{ flex: !isLastStep ? 1 : 'unset' }}>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: currentStep > step ? '#198754' : currentStep === step ? '#0b81c5' : '#e5e7eb',
                          flexShrink: 0
                        }}
                      >
                        {currentStep > step ? (
                          <Check size={18} color="white" strokeWidth={2.5} />
                        ) : (
                          <span className={currentStep === step ? 'text-white fw-medium' : 'text-muted'} style={{ fontSize: '16px' }}>
                            {step}
                          </span>
                        )}
                      </div>
                      {!isLastStep && (
                        <div
                          style={{
                            flex: 1,
                            height: '4px',
                            backgroundColor: currentStep > step ? '#198754' : '#e5e7eb',
                            borderRadius: '2px',
                            marginLeft: '8px',
                            marginRight: '8px'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="d-flex align-items-center mb-0" style={{ gap: '8px', fontSize: '12px', color: '#6c757d' }}>
                {stepLabels.map((text, index) => {
                  const isLastStep = index === 3;
                  return (
                    <div key={text} className="d-flex align-items-center" style={{ flex: !isLastStep ? 1 : 'unset' }}>
                      <span style={{ width: '32px', textAlign: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>{text}</span>
                      {!isLastStep && <div style={{ flex: 1, marginLeft: '8px', marginRight: '8px' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-body px-4 py-3" style={{ overflowY: 'hidden' }}>
            {currentStep === 1 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  How do you want to create this document?
                </h6>
                <div className="d-flex flex-column gap-2 mb-3">
                  {[
                    {
                      id: 'template' as const,
                      label: 'Use template',
                      description: 'Start from a standard Section 20 document template.',
                      icon: FileText
                    },
                    {
                      id: 'upload' as const,
                      label: 'Upload your own',
                      description: 'Add a custom consultation document and name it yourself.',
                      icon: Upload
                    }
                  ].map(option => {
                    const IconComponent = option.icon;
                    const isSelected = formData.contentSource === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`border rounded-3 p-2 d-flex align-items-center gap-2 ${isSelected ? 'border-primary border-2 bg-light' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '56px' }}
                        onClick={() => setCreationMethod(option.id)}
                      >
                        <div
                          className="rounded d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: isSelected ? '#0d6efd' : '#f8f9fa',
                            flexShrink: 0
                          }}
                        >
                          <IconComponent size={20} color={isSelected ? 'white' : '#6c757d'} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold mb-0" style={{ fontSize: '14px' }}>
                            {option.label}
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {option.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  {formData.contentSource === 'upload' ? 'Upload document' : 'Choose template'}
                </h6>
                {formData.contentSource === 'template' ? (
                  <>
                    <h6 className="mb-3 fw-semibold" style={{ fontSize: '14px' }}>
                      What are you trying to do?
                    </h6>
                    <div className="d-flex flex-column gap-2 mb-3">
                      {purposeOptions.map(option => {
                        const IconComponent = option.icon;
                        const isSelected = formData.purpose === option.id;
                        return (
                          <div
                            key={option.id}
                            className={`border rounded-3 p-2 d-flex align-items-center gap-2 ${isSelected ? 'border-primary border-2 bg-light' : ''}`}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '56px' }}
                            onClick={() => setPurpose(option.id)}
                          >
                            <div
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: isSelected ? '#0d6efd' : '#f8f9fa',
                                flexShrink: 0
                              }}
                            >
                              <IconComponent size={20} color={isSelected ? 'white' : '#6c757d'} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold mb-0" style={{ fontSize: '14px' }}>
                                {option.label}
                              </div>
                              <div className="text-muted" style={{ fontSize: '12px' }}>
                                {option.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {formData.purpose && (
                      <>
                        <h6 className="mb-2 fw-semibold" style={{ fontSize: '14px' }}>
                          Choose document
                        </h6>
                        <div className="d-flex flex-column gap-2">
                          {availableTemplates.map(template => {
                            const isSelected = formData.documentKind === template.id;
                            const isUnavailable = isTemplateUnavailable(template);
                            return (
                              <div
                                key={template.id}
                                className={`border rounded-3 p-2 ${isSelected ? 'border-primary border-2 bg-light' : ''} ${isUnavailable ? 'bg-light-subtle' : ''}`}
                                style={{ cursor: isUnavailable ? 'not-allowed' : 'pointer', opacity: isUnavailable ? 0.72 : 1 }}
                                onClick={() => applyTemplate(template)}
                              >
                                <div className="d-flex align-items-center justify-content-between gap-2">
                                  <div className="fw-semibold" style={{ fontSize: '13px' }}>
                                    {template.label}
                                  </div>
                                  {isUnavailable && (
                                    <span
                                      className="badge"
                                      style={{
                                        backgroundColor: '#f1f3f5',
                                        color: '#495057',
                                        border: '1px solid #dee2e6',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        flexShrink: 0
                                      }}
                                    >
                                      Already created
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                  {isUnavailable
                                    ? `A ${template.label.toLowerCase()} already exists for this stage.`
                                    : template.description}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="alert alert-secondary py-2 px-3 mb-3" style={{ fontSize: '13px' }}>
                      Upload a custom consultation document. File upload is required; name, stage, and due date can be added now or later.
                    </div>
                    <div
                      className="border border-2 rounded-3 text-center d-flex flex-column align-items-center justify-content-center"
                      style={{ borderStyle: 'dashed', cursor: 'pointer', borderColor: '#dee2e6', padding: '24px 16px' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={26} className="text-muted mb-2" />
                      <p className="mb-1 fw-medium" style={{ fontSize: '13px' }}>
                        {formData.uploadedFile ? formData.uploadedFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                        PDF, DOC, DOCX (max 10MB)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="d-none"
                        accept=".pdf,.doc,.docx"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setFormData(prev => ({
                            ...prev,
                            uploadedFile: file,
                            templateId: file ? 'uploaded-file' : '',
                            templateName: file ? 'Uploaded custom document' : '',
                            templateText: ''
                          }));
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Document details
                </h6>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Document name <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter document name"
                    value={formData.documentName}
                    onChange={(event) => updateFormData('documentName', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Section 20 stage <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <select
                    className="form-select"
                    value={formData.stage}
                    onChange={(event) => updateFormData('stage', event.target.value)}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select stage</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Internal description
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Add notes or description for internal use"
                    value={formData.description}
                    onChange={(event) => updateFormData('description', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                {formData.contentSource === 'template' ? (
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                      Template
                    </label>
                    <div className="border rounded-3 p-3 bg-light-subtle">
                      <div className="fw-medium" style={{ fontSize: '14px' }}>
                        {standardTemplate.label}
                      </div>
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '12px' }}>
                      {standardTemplate.description}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                      Uploaded file
                    </label>
                    <div className="border rounded-3 p-3 bg-light-subtle d-flex justify-content-between align-items-center gap-3">
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-medium text-truncate" style={{ fontSize: '14px' }}>
                          {formData.uploadedFile?.name || 'No file uploaded'}
                        </div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                          Custom upload
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace file
                      </button>
                    </div>
                  </div>
                )}
                <div className="mb-3 p-3 border rounded-3 bg-light-subtle">
                  <div className="fw-medium mb-1" style={{ fontSize: '14px' }}>
                    Delivery channel
                  </div>
                  <div className="text-muted" style={{ fontSize: '13px' }}>
                    Post (default). Recipient mapping will be handled during mail merge workflow.
                  </div>
                </div>
                <div>
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Due to send on <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={(event) => updateFormData('dueDate', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Review and create
                </h6>
                <div className="border rounded-3 p-3" style={{ backgroundColor: 'white', borderColor: '#e9ecef' }}>
                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Purpose
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.contentSource === 'upload'
                          ? 'Uploaded custom document'
                          : purposeOptions.find(option => option.id === formData.purpose)?.label || 'Not selected'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Document
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.contentSource === 'upload'
                          ? 'Custom document'
                          : selectedTemplate?.label || 'Not selected'}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Document name
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.documentName || formData.uploadedFile?.name?.replace(/\.[^.]+$/, '') || 'Untitled document'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Source
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.contentSource === 'upload'
                          ? formData.uploadedFile?.name || 'Uploaded custom document'
                          : formData.templateName || 'Not selected'}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                      Template
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {formData.contentSource === 'upload'
                        ? 'No template used'
                        : formData.templateName || 'Standard consultation wording'}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                      Stage
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {formData.stage || 'To be assigned later'}
                    </div>
                  </div>

                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Due date
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.dueDate
                          ? new Date(formData.dueDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'To be set later'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Status on create
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>Draft</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer border-top px-4 py-3">
            <div className="d-flex justify-content-between w-100 gap-2">
              {currentStep > 1 ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={handleBack}
                  style={{ fontSize: '14px' }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              ) : (
                <button type="button" className="btn btn-outline-secondary" onClick={resetAndClose} style={{ fontSize: '14px' }}>
                  Cancel
                </button>
              )}
              <div className="ms-auto">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    className={`btn d-flex align-items-center gap-1 ${canContinue() ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={handleNext}
                    disabled={!canContinue()}
                    style={{ fontSize: '14px' }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={handleSubmit} style={{ fontSize: '14px' }}>
                    Create document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
