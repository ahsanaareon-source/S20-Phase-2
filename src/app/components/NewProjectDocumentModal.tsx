import { useState } from 'react';
import { Upload, FileText, Calendar, HardHat, Award, File, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface NewProjectDocumentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const getDocumentIcon = (type: string) => {
  const iconMap: { [key: string]: any } = {
    'Contracts': FileText,
    'Site meeting minutes': Calendar,
    'F10 / CDM docs': HardHat,
    'Certificates of payment': Award,
    'Other': File
  };
  return iconMap[type] || File;
};

export default function NewProjectDocumentModal({ show, onClose, onSubmit }: NewProjectDocumentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    documentType: '',
    documentName: '',
    description: '',
    uploadedFile: null as File | null,
    visibility: 'visible-to-all' as 'visible-to-all' | 'internal-only'
  });

  const documentTypes = [
    { 
      id: 'Contracts', 
      label: 'Contracts', 
      description: 'Contractor agreements and legal documents'
    },
    { 
      id: 'Site meeting minutes', 
      label: 'Site meeting minutes', 
      description: 'Meeting notes and action items'
    },
    { 
      id: 'F10 / CDM docs', 
      label: 'F10 / CDM docs', 
      description: 'Health & safety notifications and CDM regulations'
    },
    { 
      id: 'Certificates of payment', 
      label: 'Certificates of payment', 
      description: 'Payment certificates and invoices'
    },
    { 
      id: 'Other', 
      label: 'Other', 
      description: 'Other document types'
    }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 2) {
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
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      documentType: '',
      documentName: '',
      description: '',
      uploadedFile: null,
      visibility: 'visible-to-all'
    });
    onClose();
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
                  New project document
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleClose}
                  aria-label="Close"
                />
              </div>

              {/* Progress Indicator */}
              <div className="d-flex align-items-center mb-3" style={{ gap: '8px' }}>
                {[1, 2].map((step, index) => {
                  const isLastStep = step === 2;
                  
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
                          className="flex-grow-1 mx-2" 
                          style={{ 
                            height: '2px',
                            backgroundColor: currentStep > step ? '#198754' : '#e5e7eb',
                            transition: 'background-color 0.3s ease'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step Descriptions */}
              <div className="d-flex justify-content-between" style={{ fontSize: '11px', color: '#6c757d' }}>
                <span style={{ 
                  fontWeight: currentStep === 1 ? '600' : '400',
                  color: currentStep === 1 ? '#0b81c5' : '#6c757d'
                }}>
                  Document type
                </span>
                <span style={{ 
                  fontWeight: currentStep === 2 ? '600' : '400',
                  color: currentStep === 2 ? '#0b81c5' : '#6c757d'
                }}>
                  Details
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body px-4" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
            {/* Step 1: Document Type Selection */}
            {currentStep === 1 && (
              <div className="mb-4">
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Select document type
                </h6>
                <div className="d-flex flex-column gap-2">
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
                            backgroundColor: formData.documentType === type.id ? '#0b81c5' : '#f8f9fa',
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
              </div>
            )}

            {/* Step 2: Document Details */}
            {currentStep === 2 && (
              <>
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

                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Internal description
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add notes or description for internal use"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium d-block mb-2" style={{ fontSize: '14px' }}>
                    Document visibility
                  </label>
                  <div className="d-flex gap-2">
                    <div 
                      className={`border rounded-3 p-2 d-flex align-items-start gap-2 flex-grow-1 ${formData.visibility === 'visible-to-all' ? 'border-primary border-2 bg-light' : ''}`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => updateFormData('visibility', 'visible-to-all')}
                    >
                      <input
                        type="radio"
                        className="form-check-input mt-0"
                        name="visibility"
                        checked={formData.visibility === 'visible-to-all'}
                        onChange={() => updateFormData('visibility', 'visible-to-all')}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold mb-1" style={{ fontSize: '13px' }}>
                          Visible to all
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                          Anyone can see this document
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`border rounded-3 p-2 d-flex align-items-start gap-2 flex-grow-1 ${formData.visibility === 'internal-only' ? 'border-primary border-2 bg-light' : ''}`}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => updateFormData('visibility', 'internal-only')}
                    >
                      <input
                        type="radio"
                        className="form-check-input mt-0"
                        name="visibility"
                        checked={formData.visibility === 'internal-only'}
                        onChange={() => updateFormData('visibility', 'internal-only')}
                        style={{ cursor: 'pointer', flexShrink: 0 }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold mb-1" style={{ fontSize: '13px' }}>
                          Internal only
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px', lineHeight: '1.3' }}>
                          Only visible to business team
                        </div>
                      </div>
                    </div>
                  </div>
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
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 px-4 pb-4 pt-3">
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
                  onClick={handleClose}
                  style={{ fontSize: '14px' }}
                >
                  Cancel
                </button>
              )}
              <div className="ms-auto">
                {currentStep < 2 ? (
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
