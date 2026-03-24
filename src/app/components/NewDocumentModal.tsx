import { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Upload, Calendar as CalendarIcon, FileText, DollarSign, Award, MessageSquare, FileBarChart, File } from 'lucide-react';

interface NewDocumentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const getDocumentIcon = (id: string) => {
  const iconMap: { [key: string]: any } = {
    notice: FileText,
    quotes: DollarSign,
    project: Award,
    consultation: MessageSquare,
    estimate: FileBarChart,
    other: File
  };
  return iconMap[id] || File;
};

export default function NewDocumentModal({ show, onClose, onSubmit }: NewDocumentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    documentType: '',
    documentName: '',
    stage: '',
    description: '',
    uploadedFile: null as File | null,
    recipients: {
      leaseholders: false,
      directors: false,
      managingAgents: false,
      freeholders: false
    },
    dueDate: '',
    autoSend: false
  });

  const documentTypes = [
    { 
      id: 'notice', 
      label: 'Notice', 
      description: 'Formal Section 20 notices to stakeholders'
    },
    { 
      id: 'quotes', 
      label: 'Quotes', 
      description: 'Contractor quotes and proposals'
    },
    { 
      id: 'consultation', 
      label: 'Consultation', 
      description: 'Consultation documents and responses'
    },
    { 
      id: 'estimate', 
      label: 'Estimate', 
      description: 'Cost estimates and financial projections'
    },
    { 
      id: 'other', 
      label: 'Other', 
      description: 'Other document types'
    }
  ];

  const aiSuggestions = [
    {
      id: 'notice_intention',
      label: 'Notice of intention',
      description: 'Recommended for Stage 1'
    },
    {
      id: 'notice_reasons',
      label: 'Notice of reasons',
      description: 'Recommended for Stage 2'
    }
  ];

  const stages = [
    'Notice of intention',
    'Statement of estimate',
    'Notice of reasons',
    'Tender',
    'First notice',
    'Completion'
  ];

  const recipientsList = [
    { id: 'leaseholders', label: 'Leaseholders', count: 42 },
    { id: 'directors', label: 'Directors', count: 4 },
    { id: 'managingAgents', label: 'Managing agents', count: 1 },
    { id: 'freeholders', label: 'Freeholders', count: 1 }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
    // Reset form
    setCurrentStep(1);
    setFormData({
      documentType: '',
      documentName: '',
      stage: '',
      description: '',
      uploadedFile: null,
      recipients: {
        leaseholders: false,
        directors: false,
        managingAgents: false,
        freeholders: false
      },
      dueDate: '',
      autoSend: false
    });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateRecipient = (recipientId: string, checked: boolean) => {
    setFormData({
      ...formData,
      recipients: {
        ...formData.recipients,
        [recipientId]: checked
      }
    });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '518px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '10px' }}>
          {/* Header */}
          <div className="modal-header border-0 px-4 pt-4 pb-3">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h5 className="modal-title fw-semibold mb-0" style={{ fontSize: '18px', letterSpacing: '-0.44px' }}>
                  Create major works document
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>

              {/* Progress Indicator */}
              <div className="d-flex align-items-center mb-3" style={{ gap: '8px' }}>
                {[1, 2, 3, 4].map((step, index) => {
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
                          <span 
                            className={currentStep === step ? 'text-white fw-medium' : 'text-muted'} 
                            style={{ fontSize: '16px' }}
                          >
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

              {/* Step Labels */}
              <div className="d-flex align-items-center mb-0" style={{ gap: '8px', fontSize: '12px', color: '#6c757d' }}>
                {[
                  { text: 'Choose type', flex: 1, step: 1 },
                  { text: 'Details', flex: 1, step: 2 },
                  { text: 'Recipients', flex: 1, step: 3 },
                  { text: 'Review', flex: 'unset', step: 4 }
                ].map((label, index) => {
                  const isLastStep = label.step === 4;
                  
                  return (
                    <div 
                      key={index}
                      className="d-flex align-items-center"
                      style={{ flex: !isLastStep ? 1 : 'unset' }}
                    >
                      <span style={{ width: '32px', textAlign: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {label.text}
                      </span>
                      {!isLastStep && (
                        <div style={{ flex: 1, marginLeft: '8px', marginRight: '8px' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body px-4 py-3" style={{ overflowY: 'hidden' }}>
            {/* Step 1: Choose Type */}
            {currentStep === 1 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Choose document type
                </h6>
                <div className="d-flex flex-column gap-2 mb-3">
                  {documentTypes.map((type) => {
                    const IconComponent = getDocumentIcon(type.id);
                    return (
                      <div 
                        key={type.id}
                        className={`border rounded-3 p-2 d-flex align-items-center gap-2 ${formData.documentType === type.id ? 'border-primary border-2 bg-light' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '56px' }}
                        onClick={() => updateFormData('documentType', type.id)}
                      >
                        <div 
                          className="rounded d-flex align-items-center justify-content-center"
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: formData.documentType === type.id ? '#0d6efd' : '#f8f9fa',
                            flexShrink: 0
                          }}
                        >
                          <IconComponent 
                            size={20} 
                            color={formData.documentType === type.id ? 'white' : '#6c757d'} 
                          />
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-semibold mb-0" style={{ fontSize: '14px' }}>
                            {type.label}
                          </div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {type.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Suggestions */}
                <div className="border-top pt-3">
                  <h6 className="mb-2 fw-semibold d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
                    <div 
                      className="rounded-circle"
                      style={{
                        width: '20px',
                        height: '20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    />
                    AI suggestion
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {aiSuggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        className="border rounded-3 p-2 bg-light"
                        style={{ cursor: 'pointer', minHeight: '48px' }}
                        onClick={() => {
                          updateFormData('documentType', 'notice');
                          updateFormData('documentName', suggestion.label);
                        }}
                      >
                        <div className="fw-semibold mb-0" style={{ fontSize: '13px' }}>
                          {suggestion.label}
                        </div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>
                          {suggestion.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Document details
                </h6>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Document name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter document name"
                    value={formData.documentName}
                    onChange={(e) => updateFormData('documentName', e.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                {/* Only show stage selection for non-project documents */}
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Section 20 stage
                  </label>
                  <select
                    className="form-select"
                    value={formData.stage}
                    onChange={(e) => updateFormData('stage', e.target.value)}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Select stage</option>
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
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
                    onChange={(e) => updateFormData('description', e.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Upload document
                  </label>
                  <div 
                    className="border border-2 rounded-3 text-center d-flex flex-column align-items-center justify-content-center"
                    style={{ borderStyle: 'dashed', cursor: 'pointer', borderColor: '#dee2e6', padding: '28px 16px' }}
                  >
                    <Upload size={28} className="text-muted mb-2" />
                    <p className="mb-1 fw-medium" style={{ fontSize: '13px' }}>
                      Click to upload or drag and drop
                    </p>
                    <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                      PDF, DOC, DOCX, JPG, PNG (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Recipients */}
            {currentStep === 3 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Recipients and schedule
                </h6>
                <div className="mb-3">
                  <label className="form-label fw-medium mb-2" style={{ fontSize: '14px' }}>
                    Select recipients
                  </label>
                  <div className="d-flex flex-column gap-2">
                    {recipientsList.map((recipient) => (
                      <div 
                        key={recipient.id}
                        className="border rounded-3 p-2"
                        style={{ minHeight: '44px' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={recipient.id}
                              checked={formData.recipients[recipient.id as keyof typeof formData.recipients]}
                              onChange={(e) => updateRecipient(recipient.id, e.target.checked)}
                            />
                            <label className="form-check-label fw-medium" htmlFor={recipient.id} style={{ fontSize: '14px' }}>
                              {recipient.label}
                            </label>
                          </div>
                          <span className="text-muted" style={{ fontSize: '13px' }}>
                            {recipient.count} recipients
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Due to send on
                  </label>
                  <div className="position-relative">
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dueDate}
                      onChange={(e) => updateFormData('dueDate', e.target.value)}
                      style={{ fontSize: '14px' }}
                    />
                    <CalendarIcon 
                      size={16} 
                      className="position-absolute text-muted" 
                      style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    />
                  </div>
                </div>

                <div className="bg-light border rounded-3 p-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoSend"
                      checked={formData.autoSend}
                      onChange={(e) => updateFormData('autoSend', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="autoSend">
                      <div className="fw-medium mb-0" style={{ fontSize: '13px' }}>
                        Send automatically on due date
                      </div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        Document will be sent automatically at 9:00 AM on the due date
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Review and create
                </h6>
                <div className="border rounded-3 p-3" style={{ backgroundColor: 'white', borderColor: '#e9ecef' }}>
                  {/* Row 1: Document Name and Type */}
                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Document name
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.documentName || 'Untitled Document'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Type
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {documentTypes.find(t => t.id === formData.documentType)?.label || 'Not selected'}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Stage and Due Date */}
                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Stage
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.stage || 'Not selected'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Due date
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }) : 'Not set'}
                      </div>
                    </div>
                  </div>

                  {/* Recipients - Only show if not a project document */}
                  {formData.documentType !== 'project' && (
                    <div className="mb-2">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Recipients
                      </div>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        {recipientsList
                          .filter(r => formData.recipients[r.id as keyof typeof formData.recipients])
                          .map(r => (
                            <span key={r.id} className="d-inline-flex align-items-center gap-1">
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: '#eceef2', 
                                  color: '#030213',
                                  fontSize: '12px', 
                                  fontWeight: 500,
                                  padding: '3px 9px',
                                  borderRadius: '8px'
                                }}
                              >
                                {r.label}
                              </span>
                              <span style={{ fontSize: '14px', color: '#0a0a0a' }}>
                                ({r.count})
                              </span>
                            </span>
                          ))}
                        {!Object.values(formData.recipients).some(v => v) && (
                          <span style={{ fontSize: '14px', color: '#6c757d' }}>No recipients selected</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {formData.description && (
                    <div className="mb-2">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Description
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.description}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <hr style={{ borderTop: '2px solid #e5e7eb', margin: '12px 0' }} />

                  {/* Status Information */}
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#f3f4f6', 
                          color: '#364153',
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '3px 8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      >
                        Draft
                      </span>
                      <span style={{ fontSize: '14px', color: '#6c757d' }}>
                        Document will be saved as draft until sent
                      </span>
                    </div>

                    {formData.autoSend && (
                      <div className="d-flex align-items-center gap-2">
                        <Check size={20} style={{ color: '#0d6efd' }} />
                        <span style={{ fontSize: '14px', color: '#0d6efd' }}>
                          Automatic send enabled
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  style={{ fontSize: '14px' }}
                >
                  Cancel
                </button>
              )}
              <div className="ms-auto">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    className={`btn d-flex align-items-center gap-1 ${currentStep === 1 && !formData.documentType ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleNext}
                    disabled={currentStep === 1 && !formData.documentType}
                    style={{ fontSize: '14px' }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    style={{ fontSize: '14px' }}
                  >
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