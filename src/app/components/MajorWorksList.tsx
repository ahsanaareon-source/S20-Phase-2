import { useState, useRef, useEffect, useMemo } from 'react';
import { Clipboard, TrendingUp, CheckCircle, PoundSterling, Archive, ArchiveRestore, Search, Download, ChevronLeft, ChevronRight, Plus, ArrowUpDown, ArrowUp, ArrowDown, Filter, Info } from 'lucide-react';
import AIChatBubble from './AIChatBubble';
import ConfirmationModal from './ConfirmationModal';
import { generateMajorWorksListPDF } from '@/utils/pdfGenerator';
import { MajorWork, STATUS_BADGE_CLASSES } from '@/types';
import { formatCurrency, formatCurrencyShort } from '@/utils/formatters';

interface MajorWorksListProps {
  majorWorks: MajorWork[];
  onCreateNew: () => void;
  onViewDetail: (work: MajorWork) => void;
  onUpdateWork: (workId: string, updatedData: Partial<MajorWork>) => void;
}

type SortField = 'title' | 'createdOn' | 'stage' | 'status' | 'agentFee';
type SortDirection = 'asc' | 'desc' | null;

export default function MajorWorksList({ majorWorks, onCreateNew, onViewDetail, onUpdateWork }: MajorWorksListProps) {
  const [estateFilter, setEstateFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [propertyManagerFilter, setPropertyManagerFilter] = useState('all');
  const [showArchivedWorks, setShowArchivedWorks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPageState, setItemsPerPageState] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [pendingArchiveAction, setPendingArchiveAction] = useState<null | { workId: string; mode: 'archive' | 'unarchive' }>(null);
  
  // Column visibility state - load from localStorage
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('columnVisibility');
    return saved ? JSON.parse(saved) : {
      location: true,
      createdOn: true,
      stage: true,
      managementFee: true,
      status: true
    };
  });
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('columnVisibility', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (columnName: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
  };

  const getStatusBadgeClass = (status: MajorWork['status']) => {
    return STATUS_BADGE_CLASSES[status] || 'bg-secondary';
  };

  const getStatusLabel = (status: MajorWork['status']) => {
    if (status === 'In progress') return 'Active';
    if (status === 'On hold') return 'On Hold';
    return status;
  };

  const getMajorWorksDescription = (work: MajorWork) =>
    work.formData?.description || 'No description available';

  // Calculate dynamic statistics
  const stats = useMemo(() => {
    const activeWorks = majorWorks.filter(w => w.status !== 'Archived');
    const inProgress = activeWorks.filter(w => w.status === 'In progress').length;
    const completed = activeWorks.filter(w => w.status === 'Completed').length;
    const totalFee = activeWorks.reduce((sum, w) => sum + (w.agentFee || 0), 0);
    
    return {
      total: activeWorks.length,
      inProgress,
      completed,
      totalCost: formatCurrencyShort(totalFee * 5), // Estimate total cost as 5x fee
      totalFee: formatCurrencyShort(totalFee)
    };
  }, [majorWorks]);

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or reset
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique values for filters
  const uniqueEstates = useMemo(() => {
    const estates = new Set<string>();
    majorWorks.forEach(work => {
      const estate = work.location.split(' - ')[0];
      if (estate) estates.add(estate);
    });
    return Array.from(estates).sort();
  }, [majorWorks]);

  const uniqueBuildings = useMemo(() => {
    const buildings = new Set<string>();
    majorWorks.forEach(work => {
      const parts = work.location.split(' - ');
      if (parts.length > 1) {
        const building = parts[1].split(',')[0];
        if (building) buildings.add(building);
      }
    });
    return Array.from(buildings).sort();
  }, [majorWorks]);

  const uniquePropertyManagers = useMemo(() => {
    const managers = new Set<string>();
    majorWorks.forEach(work => {
      if (work.propertyManager) managers.add(work.propertyManager);
    });
    return Array.from(managers).sort();
  }, [majorWorks]);

  // Filter the data
  const filteredWorks = useMemo(() => {
    return majorWorks.filter(work => {
      // Estate filter
      if (estateFilter !== 'all') {
        const workEstate = work.location.split(' - ')[0];
        if (workEstate !== estateFilter) return false;
      }
      
      // Building filter
      if (buildingFilter !== 'all') {
        const parts = work.location.split(' - ');
        const workBuilding = parts.length > 1 ? parts[1].split(',')[0] : '';
        if (workBuilding !== buildingFilter) return false;
      }
      
      // Property manager filter
      if (propertyManagerFilter !== 'all' && work.propertyManager !== propertyManagerFilter) {
        return false;
      }

      if (!showArchivedWorks && work.status === 'Archived') {
        return false;
      }
      
      return true;
    });
  }, [majorWorks, estateFilter, buildingFilter, propertyManagerFilter, showArchivedWorks]);

  // Sort the data
  const sortedWorks = useMemo(() => {
    if (!sortField || !sortDirection) return filteredWorks;

    return [...filteredWorks].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [filteredWorks, sortField, sortDirection]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [estateFilter, buildingFilter, propertyManagerFilter, showArchivedWorks]);

  const totalPages = Math.ceil(sortedWorks.length / itemsPerPageState);
  const startIndex = (currentPage - 1) * itemsPerPageState;
  const endIndex = startIndex + itemsPerPageState;
  const currentItems = sortedWorks.slice(startIndex, endIndex);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="ms-1 text-muted" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} className="ms-1" />;
    }
    return <ArrowDown size={14} className="ms-1" />;
  };

  const handleClearFilters = () => {
    setEstateFilter('all');
    setBuildingFilter('all');
    setPropertyManagerFilter('all');
  };

  const hasActiveFilters = estateFilter !== 'all' || buildingFilter !== 'all' || propertyManagerFilter !== 'all';

  const handleConfirmArchiveAction = () => {
    if (!pendingArchiveAction) {
      return;
    }

    onUpdateWork(
      pendingArchiveAction.workId,
      { status: pendingArchiveAction.mode === 'archive' ? 'Archived' : 'On hold' }
    );
    setPendingArchiveAction(null);
  };

  return (
    <div className="container-fluid p-4">
      {/* Action Buttons */}
      <div className="d-flex justify-content-end gap-2 mb-4">
        <button 
          className="btn btn-outline-primary d-flex align-items-center gap-2"
          onClick={() => {
            // Convert data to format expected by PDF generator
            const pdfData = sortedWorks.map(work => ({
              id: work.id,
              title: work.title,
              estate: work.location.split(' - ')[0] || 'N/A',
              status: work.status,
              budget: work.agentFee,
              progress: work.status === 'Completed' ? 100 : work.status === 'In progress' ? 65 : 25,
              startDate: work.createdOn
            }));
            generateMajorWorksListPDF(pdfData);
          }}
        >
          <Download size={18} />
          Download report
        </button>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={onCreateNew}
        >
          <Plus size={18} />
          New Section 20
        </button>
      </div>

      {/* Header with stats */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body" style={{ paddingBottom: '1rem' }}>
              <div className="d-flex justify-content-between align-items-start mb-2" style={{ height: '50px' }}>
                <div className="text-muted small">Section 20</div>
                <Clipboard size={40} className="text-primary" />
              </div>
              <div className="row" style={{ marginTop: '8px', marginBottom: '0' }}>
                <div className="col-4">
                  <h3 className="mb-1" style={{ height: '38px', display: 'flex', alignItems: 'center' }}>{stats.total}</h3>
                  <div className="text-muted small" style={{ height: '32px', marginBottom: '0' }}>Total</div>
                </div>
                <div className="col-4">
                  <h3 className="mb-1" style={{ height: '38px', display: 'flex', alignItems: 'center' }}>{stats.inProgress}</h3>
                  <div className="text-muted small" style={{ height: '32px', marginBottom: '0' }}>Active</div>
                </div>
                <div className="col-4">
                  <h3 className="mb-1" style={{ height: '38px', display: 'flex', alignItems: 'center' }}>{stats.completed}</h3>
                  <div className="text-muted small" style={{ height: '32px', marginBottom: '0' }}>Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body" style={{ paddingBottom: '1rem' }}>
              <div className="d-flex justify-content-between align-items-start mb-2" style={{ height: '50px' }}>
                <div className="text-muted small">Total Estimated Cost</div>
                <PoundSterling size={40} className="text-success" />
              </div>
              <h3 className="mb-1" style={{ height: '38px', display: 'flex', alignItems: 'center', marginTop: '8px', marginBottom: '8px' }}>
                {stats.totalCost} <span style={{ fontSize: '0.6em', fontWeight: 'normal', color: '#6c757d' }}>(inc. VAT)</span>
              </h3>
              <div className="text-muted small" style={{ height: '32px', marginBottom: '0' }}>Across all projects</div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body" style={{ paddingBottom: '1rem' }}>
              <div className="d-flex justify-content-between align-items-start mb-2" style={{ height: '50px' }}>
                <div className="text-muted small">Total Estimated Fee</div>
                <PoundSterling size={40} className="text-success" />
              </div>
              <h3 className="mb-1" style={{ height: '38px', display: 'flex', alignItems: 'center', marginTop: '8px', marginBottom: '8px' }}>
                {stats.totalFee} <span style={{ fontSize: '0.6em', fontWeight: 'normal', color: '#6c757d' }}>(inc. VAT)</span>
              </h3>
              <div className="text-muted small" style={{ height: '32px', marginBottom: '0' }}>Across all projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <select 
                className="form-select"
                value={estateFilter}
                onChange={(e) => setEstateFilter(e.target.value)}
              >
                <option value="all">All estates</option>
                {uniqueEstates.map(estate => (
                  <option key={estate} value={estate}>{estate}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select 
                className="form-select"
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
              >
                <option value="all">All buildings</option>
                {uniqueBuildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <select 
                className="form-select"
                value={propertyManagerFilter}
                onChange={(e) => setPropertyManagerFilter(e.target.value)}
              >
                <option value="all">All property managers</option>
                {uniquePropertyManagers.map(manager => (
                  <option key={manager} value={manager}>{manager}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <div className="d-flex justify-content-end">
                <div className="position-relative" ref={columnDropdownRef}>
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                    type="button"
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                    aria-label="Column filter"
                    style={{ height: '32px', width: '32px', padding: 0 }}
                  >
                    <Filter size={16} />
                  </button>
                  {showColumnDropdown && (
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
                            id="col-location"
                            checked={visibleColumns.location}
                            onChange={() => toggleColumn('location')}
                          />
                          <label className="form-check-label" htmlFor="col-location" style={{ color: '#4a5565' }}>
                            Block / Estate
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="col-createdOn"
                            checked={visibleColumns.createdOn}
                            onChange={() => toggleColumn('createdOn')}
                          />
                          <label className="form-check-label" htmlFor="col-createdOn" style={{ color: '#4a5565' }}>
                            Expected start date
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="col-stage"
                            checked={visibleColumns.stage}
                            onChange={() => toggleColumn('stage')}
                          />
                          <label className="form-check-label" htmlFor="col-stage" style={{ color: '#4a5565' }}>
                            Stage
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="col-managementFee"
                            checked={visibleColumns.managementFee}
                            onChange={() => toggleColumn('managementFee')}
                          />
                          <label className="form-check-label" htmlFor="col-managementFee" style={{ color: '#4a5565' }}>
                            Management Fee
                          </label>
                        </div>
                        <div className="form-check mb-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="col-status"
                            checked={visibleColumns.status}
                            onChange={() => toggleColumn('status')}
                          />
                          <label className="form-check-label" htmlFor="col-status" style={{ color: '#4a5565' }}>
                            Status
                          </label>
                        </div>
                      </div>
                      <hr className="dropdown-divider my-2" />
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="show-archived"
                          checked={showArchivedWorks}
                          onChange={(e) => setShowArchivedWorks(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="show-archived" style={{ color: '#4a5565' }}>
                          Show archived works
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div>
        {/* Table Header */}
        <div className="row g-0 align-items-center py-3 px-3" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="col" style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }} onClick={() => handleSort('title')}>
            <span className="d-flex align-items-center">
              Section 20
              {renderSortIcon('title')}
            </span>
          </div>
          {visibleColumns.createdOn && (
            <div className="col-2" style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }} onClick={() => handleSort('createdOn')}>
              <span className="d-flex align-items-center">
                Created on
                {renderSortIcon('createdOn')}
              </span>
            </div>
          )}
          {visibleColumns.stage && (
            <div className="col-2" style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }} onClick={() => handleSort('stage')}>
              <span className="d-flex align-items-center">
                Stage
                {renderSortIcon('stage')}
              </span>
            </div>
          )}
          {visibleColumns.managementFee && (
            <div className="col-1" style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }} onClick={() => handleSort('agentFee')}>
              <span className="d-flex align-items-center">
                Fee
                {renderSortIcon('agentFee')}
              </span>
            </div>
          )}
          {visibleColumns.status && (
            <div className="col-2" style={{ cursor: 'pointer', fontWeight: '600', userSelect: 'none' }} onClick={() => handleSort('status')}>
              <span className="d-flex align-items-center">
                Status
                {renderSortIcon('status')}
              </span>
            </div>
          )}
          <div className="col-1"></div>
        </div>
        
        {/* Card Rows */}
        <div>
          {currentItems.map((work) => (
            <div 
              key={work.id}
              className="card mb-2 shadow-sm border"
              style={{
                cursor: work.status === 'Archived' ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                backgroundColor: work.status === 'Archived' ? '#f3f4f6' : '#ffffff',
                opacity: work.status === 'Archived' ? 0.68 : 1
              }}
              onClick={() => {
                if (work.status === 'Archived') {
                  return;
                }
                onViewDetail(work);
              }}
              onMouseEnter={(e) => {
                if (work.status === 'Archived') {
                  return;
                }
                e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = work.status === 'Archived'
                  ? '0 0.125rem 0.25rem rgba(0,0,0,0.075)'
                  : '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
              }}
            >
              <div className="card-body py-3">
                <div className="row g-0 align-items-center">
                  <div className="col">
                    <div
                      className="fw-medium mb-1"
                      style={{ color: work.status === 'Archived' ? '#6b7280' : undefined }}
                    >
                      <span className="d-inline-flex align-items-center gap-2">
                        <span>{work.title}</span>
                        <span
                          className="d-inline-flex align-items-center text-muted"
                          title={getMajorWorksDescription(work)}
                          aria-label={`Description for ${work.title}`}
                          style={{ cursor: 'help' }}
                        >
                          <Info size={14} />
                        </span>
                      </span>
                    </div>
                    <div
                      className="small"
                      style={{ color: work.status === 'Archived' ? '#9ca3af' : undefined }}
                    >
                      {work.location}
                    </div>
                  </div>
                  {visibleColumns.createdOn && (
                    <div className="col-2" style={{ color: work.status === 'Archived' ? '#9ca3af' : '#6c757d' }}>{work.createdOn}</div>
                  )}
                  {visibleColumns.stage && (
                    <div className="col-2" style={{ color: work.status === 'Archived' ? '#6b7280' : undefined }}>{work.stage}</div>
                  )}
                  {visibleColumns.managementFee && (
                    <div className="col-1">
                      <span
                        className="fw-semibold"
                        style={{ color: work.status === 'Archived' ? '#9ca3af' : '#198754' }}
                      >
                        {formatCurrency(work.agentFee)}
                      </span>
                    </div>
                  )}
                  {visibleColumns.status && (
                    <div className="col-2">
                      <span className={`badge ${getStatusBadgeClass(work.status)} rounded-pill`}>
                        {getStatusLabel(work.status)}
                      </span>
                    </div>
                  )}
                  <div className="col-1 text-end">
                    <button 
                      className="btn btn-sm btn-outline-secondary border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingArchiveAction({
                          workId: work.id,
                          mode: work.status === 'Archived' ? 'unarchive' : 'archive'
                        });
                      }}
                      title={work.status === 'Archived' ? 'Unarchive major work' : 'Archive major work'}
                    >
                      {work.status === 'Archived' ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="card bg-white border shadow-sm rounded mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted" style={{ fontSize: '14px' }}>
                Total <strong>{filteredWorks.length}</strong> items
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
                    
                    {/* Current page button */}
                    <li className="page-item active">
                      <button 
                        className="page-link" 
                        style={{ 
                          padding: '6px 12px',
                          height: '34px',
                          minWidth: '40px',
                          backgroundColor: '#3b82c4',
                          borderColor: '#3b82c4',
                          color: '#fff'
                        }}
                      >
                        {currentPage}
                      </button>
                    </li>
                    
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
                  value={itemsPerPageState}
                  onChange={(e) => {
                    setItemsPerPageState(Number(e.target.value));
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
      </div>
      <ConfirmationModal
        show={pendingArchiveAction !== null}
        title={pendingArchiveAction?.mode === 'unarchive' ? 'Unarchive major work?' : 'Archive major work?'}
        message={
          pendingArchiveAction?.mode === 'unarchive'
            ? 'This major work will return to the active list and its status will change to On Hold.'
            : 'This major work will be archived, its status will change to Archived, and it will be hidden from the default list view.'
        }
        confirmLabel={pendingArchiveAction?.mode === 'unarchive' ? 'Unarchive major work' : 'Archive major work'}
        variant="warning"
        onCancel={() => setPendingArchiveAction(null)}
        onConfirm={handleConfirmArchiveAction}
      />
      
      {/* AI Chat Bubble */}
      <AIChatBubble onOpenProject={(projectId) => {
        const project = majorWorks.find(w => w.id === projectId);
        if (project) {
          onViewDetail(project);
        }
      }} />
    </div>
  );
}
