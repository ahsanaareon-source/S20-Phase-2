import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, Upload } from 'lucide-react';

interface NewDocumentModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  existingDocuments?: any[];
}

interface FormData {
  documentType: string;
  documentName: string;
  stage: string;
  description: string;
  dueDate: string;
  uploadedFile: File | null;
}

const consultationStages = [
  'Notice of intention',
  'Tenders',
  'Statement of estimate',
  'Notice of reasons',
  'Notice of award',
  'Completion'
];

const consultationTypes = ['Notice', 'Letter', 'Quote', 'Certificate', 'Email', 'Other'];
const projectTypes = ['Contracts', 'Site meeting minutes', 'F10 / CDM docs', 'Certificates of payment', 'Other'];
const typeOptions = [...consultationTypes, ...projectTypes];

const initialFormData: FormData = {
  documentType: 'Notice',
  documentName: '',
  stage: '',
  description: '',
  dueDate: '',
  uploadedFile: null
};

export default function NewDocumentModal({ show, onClose, onSubmit }: NewDocumentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isConsultationType = (documentType: string) => consultationTypes.includes(documentType);

  const resetAndClose = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    onClose();
  };

  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canContinue = () => {
    if (currentStep === 1) {
      return Boolean(formData.documentName.trim()) && Boolean(formData.documentType);
    }

    if (currentStep === 2) {
      return !isConsultationType(formData.documentType) || Boolean(formData.stage);
    }

    return true;
  };

  const handleSubmit = () => {
    const category = isConsultationType(formData.documentType) ? 'consultation' : 'project';
    const payload: any = {
      category,
      documentType: formData.documentType.toLowerCase(),
      documentName: formData.documentName.trim(),
      stage: category === 'consultation' ? formData.stage || 'Not set' : '',
      description: formData.description,
      dueDate: formData.dueDate,
      uploadedFile: formData.uploadedFile
    };

    onSubmit(payload);
    resetAndClose();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '10px' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-3">
            <div className="w-100">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h5 className="modal-title fw-semibold mb-0" style={{ fontSize: '18px', letterSpacing: '-0.44px' }}>
                  Create document
                </h5>
                <button type="button" className="btn-close" onClick={resetAndClose} aria-label="Close" />
              </div>

              <div className="d-flex align-items-center mb-3" style={{ gap: '8px' }}>
                {[1, 2, 3].map(step => {
                  const isLastStep = step === 3;
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
            </div>
          </div>

          <div className="modal-body px-4 py-3">
            {currentStep === 1 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Document details
                </h6>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Document name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter document name"
                    value={formData.documentName}
                    onChange={event => updateFormData('documentName', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Type</label>
                  <select
                    className="form-select"
                    value={formData.documentType}
                    onChange={event => updateFormData('documentType', event.target.value)}
                    style={{ fontSize: '14px' }}
                  >
                    {typeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Internal description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add notes for internal use"
                    value={formData.description}
                    onChange={event => updateFormData('description', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Additional details
                </h6>
                {isConsultationType(formData.documentType) && (
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontSize: '14px' }}>Section 20 stage</label>
                    <select
                      className="form-select"
                      value={formData.stage}
                      onChange={event => updateFormData('stage', event.target.value)}
                      style={{ fontSize: '14px' }}
                    >
                      <option value="">Select stage</option>
                      {consultationStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Due to send on <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dueDate}
                    onChange={event => updateFormData('dueDate', event.target.value)}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label className="form-label fw-medium" style={{ fontSize: '14px' }}>
                    Upload file <span className="text-muted fw-normal">(optional)</span>
                  </label>
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
                      onChange={event => updateFormData('uploadedFile', event.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h6 className="mb-3 fw-semibold" style={{ fontSize: '16px', letterSpacing: '-0.3125px' }}>
                  Review and create
                </h6>
                <div className="border rounded-3 p-3" style={{ backgroundColor: 'white', borderColor: '#e9ecef' }}>
                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Classification
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {isConsultationType(formData.documentType) ? 'Consultation document' : 'Project document'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Type
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.documentType}
                      </div>
                    </div>
                  </div>
                  <div className="row g-3 mb-2">
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Document name
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.documentName}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                        Stage
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {isConsultationType(formData.documentType) ? formData.stage || 'To be assigned later' : '—'}
                      </div>
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
                        Upload
                      </div>
                      <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        {formData.uploadedFile?.name || 'No file uploaded'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1" style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                      Status on create
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {isConsultationType(formData.documentType) ? 'Draft' : 'Available'}
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
                  onClick={() => setCurrentStep(prev => prev - 1)}
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
                {currentStep < 3 ? (
                  <button
                    type="button"
                    className={`btn d-flex align-items-center gap-1 ${canContinue() ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentStep(prev => prev + 1)}
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
