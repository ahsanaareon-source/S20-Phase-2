import { useState, useEffect, useMemo } from 'react';
import { Lock, Search } from 'lucide-react';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import EmptyState from './components/EmptyState';
import MajorWorksForm from './components/MajorWorksForm';
import MajorWorksList from './components/MajorWorksList';
import MajorWorksDetail from './components/MajorWorksDetail';
import ConfirmationModal from './components/ConfirmationModal';
import { MajorWork, MajorWorkFormData } from '@/types';
import { formatDateTime, calculateAgentFee, getPropertyLabel } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { CONSULTATION_STAGE_LABELS } from '@/types';

// Generate realistic dates for sample data
const generatePastDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateTime(date);
};

const PROTOTYPE_ACCESS_PASSWORD = 'majorworks-demo';
const PROTOTYPE_SESSION_KEY = 'majorWorksPhase2PrototypeAuthenticated';

export default function App() {
  // Load sidebar collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [currentView, setCurrentView] = useState<'list' | 'empty' | 'form' | 'detail'>('list');
  const [formData, setFormData] = useState<MajorWorkFormData | null>(null);
  const [selectedWork, setSelectedWork] = useState<MajorWork | null>(null);
  const [activePage, setActivePage] = useState('major-works');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardChangesModal, setShowDiscardChangesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(PROTOTYPE_SESSION_KEY) === 'true');
  const [accessPassword, setAccessPassword] = useState('');
  const [accessError, setAccessError] = useState('');
  
  // Major works data state with realistic dates
  const [majorWorks, setMajorWorks] = useState<MajorWork[]>([
    {
      id: '1',
      title: 'Riverside Roof',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(45),
      stage: 'Notice of intention',
      status: 'In progress',
      agentFee: 40500,
      propertyManager: 'Sarah Johnson',
      formData: {
        title: 'Riverside Roof',
        description: 'Comprehensive roof replacement and waterproofing works for Riverside Apartments',
        workType: 'major-works',
        workCategory: 'roof-repairs',
        urgencyLevel: 'standard',
        estate: 'burns-court',
        building: 'riverside-block',
        estimatedBudget: '85000',
        agentFeeType: 'percentage',
        agentFeeValue: '10',
        surveyorFeeType: 'percentage',
        surveyorFeeValue: '5',
        unitsAffected: '24',
        startDate: '2025-03-01',
        completionDate: '2025-06-30',
        consultationStage: 'notice-of-intention',
        consultationStartDate: '2025-02-01',
        consultationEndDate: '2025-03-03'
      }
    },
    {
      id: '2',
      title: 'Developer Cladding Project Tracking Eastside',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(60),
      stage: 'Statement of estimate',
      status: 'On hold',
      agentFee: 28000,
      propertyManager: 'James Mitchell'
    },
    {
      id: '3',
      title: 'RSF Project Tracking Legacy House',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(30),
      stage: 'Notice of reasons',
      status: 'In progress',
      agentFee: 52000,
      propertyManager: 'Sarah Johnson'
    },
    {
      id: '4',
      title: 'Cladding Project Dockside',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(90),
      stage: 'Tender',
      status: 'Delayed',
      agentFee: 18500,
      propertyManager: 'Emily Roberts'
    },
    {
      id: '5',
      title: 'Envelope Project Harbourview Towers',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(15),
      stage: 'Ongoing works',
      status: 'In progress',
      agentFee: 75000,
      propertyManager: 'Sarah Johnson'
    },
    {
      id: '6',
      title: 'Car Lift A - Refurbishment',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(120),
      stage: 'Completion',
      status: 'Completed',
      agentFee: 12000,
      propertyManager: 'Michael Chen'
    },
    {
      id: '7',
      title: 'Developer Cladding Project Tracking Eastside',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(150),
      stage: 'First notice',
      status: 'Cancelled',
      agentFee: 8000,
      propertyManager: 'James Mitchell'
    },
    {
      id: '8',
      title: 'Parkside Fire Safety Works',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(75),
      stage: 'Statement of estimate',
      status: 'On hold',
      agentFee: 35000,
      propertyManager: 'Emily Roberts'
    },
    {
      id: '9',
      title: 'Westside Balcony Restoration',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(20),
      stage: 'Notice of intention',
      status: 'In progress',
      agentFee: 42000,
      propertyManager: 'Sarah Johnson'
    },
    {
      id: '10',
      title: 'Central Heating System Upgrade',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(100),
      stage: 'Statement of estimate',
      status: 'On hold',
      agentFee: 25000,
      propertyManager: 'Michael Chen'
    },
    {
      id: '11',
      title: 'External Rendering Project',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(50),
      stage: 'Notice of reasons',
      status: 'In progress',
      agentFee: 48000,
      propertyManager: 'Sarah Johnson'
    },
    {
      id: '12',
      title: 'Window Replacement Programme',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(65),
      stage: 'Tender',
      status: 'Delayed',
      agentFee: 31000,
      propertyManager: 'Emily Roberts'
    },
    {
      id: '13',
      title: 'Communal Area Refurbishment',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(25),
      stage: 'Ongoing works',
      status: 'In progress',
      agentFee: 22000,
      propertyManager: 'James Mitchell'
    },
    {
      id: '14',
      title: 'Lift Modernisation Project',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(180),
      stage: 'Completion',
      status: 'Completed',
      agentFee: 15000,
      propertyManager: 'Michael Chen'
    },
    {
      id: '15',
      title: 'Drainage System Overhaul',
      location: 'Riverside Apartments - 45 Thames Street, London, SE1 9RY',
      createdOn: generatePastDate(35),
      stage: 'Notice of intention',
      status: 'In progress',
      agentFee: 38000,
      propertyManager: 'Sarah Johnson'
    }
  ]);

  // Determine initial view based on data
  useEffect(() => {
    if (majorWorks.length === 0 && currentView === 'list') {
      setCurrentView('empty');
    } else if (majorWorks.length > 0 && currentView === 'empty') {
      setCurrentView('list');
    }
  }, [majorWorks.length]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleAuthenticate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (accessPassword === PROTOTYPE_ACCESS_PASSWORD) {
      sessionStorage.setItem(PROTOTYPE_SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setAccessPassword('');
      setAccessError('');
      return;
    }

    setAccessError('Incorrect password. Try again.');
  };

  const handleCreateClick = () => {
    setFormData(null);
    setIsEditMode(false);
    setIsFormDirty(false);
    setCurrentView('form');
  };

  const handleFormCancel = () => {
    setCurrentView(majorWorks.length === 0 ? 'empty' : 'list');
    setIsEditMode(false);
    setIsFormDirty(false);
  };

  const handleFormSubmit = (data: MajorWorkFormData) => {
    const now = new Date();
    
    // Calculate agent fee correctly based on type
    const agentFee = calculateAgentFee(
      data.estimatedBudget,
      data.agentFeeType,
      data.agentFeeValue
    );
    
    if (isEditMode && selectedWork) {
      // Update existing work
      const updatedWork: MajorWork = {
        ...selectedWork,
        title: data.title || 'Untitled Major Works',
        location: getPropertyLabel(data.estate, data.building),
        stage: CONSULTATION_STAGE_LABELS[data.consultationStage] || 'Notice of intention',
        status: data.projectStatus || selectedWork.status,
        agentFee,
        formData: data
      };
      
      setMajorWorks(prevWorks => 
        prevWorks.map(work => work.id === selectedWork.id ? updatedWork : work)
      );
      
      setSelectedWork(updatedWork);
      setCurrentView('detail');
      setIsEditMode(false);
      setIsFormDirty(false);
      toast.success('Major work updated successfully');
    } else {
      // Create new work
      const newWork: MajorWork = {
        id: 'new-' + Date.now(),
        title: data.title || 'Untitled Major Works',
        location: getPropertyLabel(data.estate, data.building),
        createdOn: formatDateTime(now),
        stage: CONSULTATION_STAGE_LABELS[data.consultationStage] || 'Notice of intention',
        status: data.projectStatus || 'In progress',
        agentFee,
        propertyManager: 'Current User',
        formData: data,
        isNew: true,
        createdAt: now.toISOString()
      };
      
      setMajorWorks([newWork, ...majorWorks]);
      setSelectedWork(newWork);
      setCurrentView('detail');
      setIsFormDirty(false);
      toast.success('Major work created successfully');
    }
  };

  const handleUpdateWork = (workId: string, updatedData: Partial<MajorWork>) => {
    setMajorWorks(prevWorks => 
      prevWorks.map(work => 
        work.id === workId 
          ? { 
              ...work, 
              ...updatedData,
              title: updatedData.title ?? work.title,
              status: updatedData.status ?? work.status,
              formData: updatedData.formData ?? work.formData
            }
          : work
      )
    );
    
    if (selectedWork?.id === workId) {
      setSelectedWork(prev => prev ? {
        ...prev,
        ...updatedData,
        title: updatedData.title ?? prev.title,
        status: updatedData.status ?? prev.status,
        formData: updatedData.formData ?? prev.formData
      } : null);
    }
  };

  const handleBackToList = () => {
    setCurrentView(majorWorks.length === 0 ? 'empty' : 'list');
    setSelectedWork(null);
    setIsEditMode(false);
    setIsFormDirty(false);
  };

  const handleBackClick = () => {
    if (isEditMode) {
      if (isFormDirty) {
        setShowDiscardChangesModal(true);
      } else {
        setIsEditMode(false);
        setFormData(null);
      }
    } else {
      handleBackToList();
    }
  };

  const handleViewDetail = (work: MajorWork) => {
    setSelectedWork(work);
    setCurrentView('detail');
  };

  const handleEditWork = (work: MajorWork) => {
    setSelectedWork(work);
    setFormData(work.formData || null);
    setIsEditMode(true);
    setIsFormDirty(false);
    setCurrentView('form');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigate = (page: string) => {
    if (page === 'major-works') {
      setCurrentView(majorWorks.length === 0 ? 'empty' : 'list');
      setSelectedWork(null);
      setActivePage('major-works');
      setIsEditMode(false);
    }
  };

  // Filter major works based on search query
  const filteredMajorWorks = useMemo(() => {
    if (!searchQuery.trim()) return majorWorks;
    
    const query = searchQuery.toLowerCase();
    return majorWorks.filter(work => 
      work.title.toLowerCase().includes(query) ||
      work.location.toLowerCase().includes(query) ||
      work.propertyManager.toLowerCase().includes(query) ||
      work.status.toLowerCase().includes(query) ||
      work.stage.toLowerCase().includes(query)
    );
  }, [majorWorks, searchQuery]);

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div
          className="min-vh-100 d-flex align-items-center justify-content-center px-3"
          style={{
            background:
              'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,41,59,0.92) 45%, rgba(51,65,85,0.9) 100%)'
          }}
        >
          <div className="w-100" style={{ maxWidth: '440px' }}>
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-4 p-lg-5">
                <div className="d-flex align-items-center justify-content-center mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: '64px', height: '64px', backgroundColor: '#eef2ff', color: '#4338ca' }}
                  >
                    <Lock size={28} />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center gap-2 mb-3">
                    <h3 className="mb-0">Major works</h3>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'transparent',
                        color: '#8a3ffc',
                        border: '1px solid #c7a6ff',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '0.2rem 0.45rem',
                        lineHeight: 1,
                        textTransform: 'uppercase'
                      }}
                    >
                      PHASE 2
                    </span>
                  </div>
                  <p className="text-muted mb-0">Enter the shared password to access this prototype.</p>
                </div>

                <form onSubmit={handleAuthenticate}>
                  <div className="mb-3">
                    <label htmlFor="phase2-prototype-password" className="form-label fw-medium">
                      Password
                    </label>
                    <input
                      id="phase2-prototype-password"
                      type="password"
                      className={`form-control ${accessError ? 'is-invalid' : ''}`}
                      value={accessPassword}
                      onChange={(event) => {
                        setAccessPassword(event.target.value);
                        if (accessError) setAccessError('');
                      }}
                      placeholder="Enter password"
                      autoFocus
                    />
                    {accessError && <div className="invalid-feedback">{accessError}</div>}
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Enter prototype
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="d-flex vh-100 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activePage={activePage}
          onNavigate={handleNavigate} 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          onCreateMajorWorks={handleCreateClick}
        />

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden">
          {/* Header */}
          <div className="bg-white border-bottom p-3">
            <div className="container-fluid">
              <div className="row align-items-center">
                <div className="col">
                  <div className="d-flex align-items-center gap-3">
                    {currentView !== 'list' && currentView !== 'empty' && (
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleBackClick}
                      >
                        ← Back
                      </button>
                    )}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">Major works</h4>
                      <span
                        className="badge text-uppercase"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#B45309',
                          letterSpacing: '0.08em',
                          fontSize: '0.58rem',
                          padding: '0.18rem 0.42rem',
                          border: '1px dotted #D97706',
                          fontWeight: 700
                        }}
                      >
                        Phase 2
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="d-flex align-items-center gap-2">
                    <div className="input-group" style={{ width: '400px' }}>
                      <span className="input-group-text bg-white">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search for issues, places or people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button 
                          className="btn btn-outline-secondary"
                          onClick={() => setSearchQuery('')}
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-grow-1 overflow-auto bg-light">
            {currentView === 'list' && (
              <MajorWorksList 
                majorWorks={filteredMajorWorks}
                onCreateNew={handleCreateClick} 
                onViewDetail={handleViewDetail}
                onUpdateWork={handleUpdateWork}
              />
            )}
            
            {currentView === 'empty' && <EmptyState onCreateClick={handleCreateClick} />}
            
            {currentView === 'form' && (
              <MajorWorksForm 
                onCancel={handleFormCancel} 
                onSubmit={handleFormSubmit}
                initialData={formData}
                mode={isEditMode ? 'edit' : 'create'}
                onDirtyChange={setIsFormDirty}
              />
            )}
            
            {currentView === 'detail' && selectedWork && (
              <MajorWorksDetail 
                work={selectedWork}
                onBack={handleBackToList}
                onUpdateWork={handleUpdateWork}
                isEditMode={isEditMode}
                onEditModeChange={(isEditing) => {
                  if (isEditing) {
                    handleEditWork(selectedWork);
                    return;
                  }
                  setIsEditMode(false);
                }}
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        show={showDiscardChangesModal}
        title="Discard changes?"
        message="You have unsaved edits in this major works form. Leaving now will discard those changes."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        variant="warning"
        onCancel={() => setShowDiscardChangesModal(false)}
        onConfirm={() => {
          setShowDiscardChangesModal(false);
          setIsEditMode(false);
          setFormData(null);
          setIsFormDirty(false);
        }}
      />
    </>
  );
}
