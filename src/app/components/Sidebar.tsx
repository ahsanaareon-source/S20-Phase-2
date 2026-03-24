import { useState } from 'react';
import { 
  Menu, 
  MessageCircle, 
  Bell, 
  ChevronDown, 
  LayoutDashboard, 
  Globe,
  FileText,
  Wrench,
  Users,
  Home,
  Calendar,
  FileBarChart,
  Settings,
  Repeat,
  Share2,
  User,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCreateMajorWorks?: () => void;
}

export default function Sidebar({ activePage, onNavigate, isCollapsed, onToggleCollapse, onCreateMajorWorks }: SidebarProps) {
  const [issuesExpanded, setIssuesExpanded] = useState(true);
  const [createIssueExpanded, setCreateIssueExpanded] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const handleToggleCreateIssue = () => {
    if (!createIssueExpanded) {
      setIssuesExpanded(false);
    }
    setCreateIssueExpanded(!createIssueExpanded);
  };

  const handleToggleIssues = () => {
    if (!issuesExpanded) {
      setCreateIssueExpanded(false);
    }
    setIssuesExpanded(!issuesExpanded);
  };

  return (
    <div 
      className="d-flex flex-column vh-100 bg-white border-end position-relative" 
      style={{ 
        width: isCollapsed ? '60px' : '270px',
        transition: 'width 0.3s ease',
        minWidth: isCollapsed ? '60px' : '270px',
        maxWidth: isCollapsed ? '60px' : '270px',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <div className="p-3 border-bottom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
          {!isCollapsed && (
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary position-relative">
                <MessageCircle size={18} />
              </button>
              <div className="position-relative">
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                >
                  <Bell size={18} />
                </button>
                {notificationDropdownOpen && (
                  <div 
                    className="position-absolute bg-white border rounded shadow-sm" 
                    style={{ 
                      top: '40px', 
                      right: '0', 
                      width: '200px', 
                      zIndex: 1000 
                    }}
                  >
                    <div className="p-2">
                      <div className="text-muted text-center py-3" style={{ fontSize: '14px' }}>
                        No notifications
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-sm btn-outline-secondary">
                <ChevronDown size={18} />
              </button>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Logo & User */}
            <h4 className="text-primary mb-3" style={{ fontSize: '24px' }}>Fixflo</h4>
            <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                AJ
              </div>
              <div className="flex-grow-1">
                <div className="fw-medium" style={{ fontSize: '14px' }}>Ahsan Jalil</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>Agent</div>
              </div>
              <button className="btn btn-sm">
                <ChevronDown size={16} />
              </button>
            </div>
          </>
        )}
        
        {isCollapsed && (
          <div className="d-flex justify-content-center">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-medium" style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', fontSize: '12px', flexShrink: 0 }}>
              AJ
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-grow-1 overflow-auto p-2">
        <nav className="nav flex-column" style={{ gap: isCollapsed ? '8px' : '0' }}>
          <a 
            className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`}
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              if (isCollapsed) onToggleCollapse();
              onNavigate('dashboard'); 
            }}
            title="Dashboard"
          >
            <LayoutDashboard size={18} />
            {!isCollapsed && 'Dashboard'}
          </a>
          
          <a 
            className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`}
            href="#" 
            onClick={(e) => { 
              e.preventDefault(); 
              if (isCollapsed) onToggleCollapse();
              onNavigate('marketplace'); 
            }}
            title="Contractor marketplace"
          >
            <Globe size={18} />
            {!isCollapsed && 'Contractor marketplace'}
          </a>

          {/* Create Issue Section */}
          <div className="mt-1">
            <button 
              className={`nav-link d-flex align-items-center justify-content-between w-100 rounded text-dark border-0 bg-transparent ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`}
              onClick={() => {
                if (isCollapsed) {
                  onToggleCollapse();
                } else {
                  handleToggleCreateIssue();
                }
              }}
              title="Create issue"
            >
              <div className="d-flex align-items-center gap-2">
                <PlusCircle size={18} />
                {!isCollapsed && 'Create issue'}
              </div>
              {!isCollapsed && (
                <ChevronDown 
                  size={16} 
                  style={{ transform: createIssueExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} 
                />
              )}
            </button>
            
            {createIssueExpanded && !isCollapsed && (
              <div className="ms-3">
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Enter as you go
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Create on behalf of
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Send issue creation link
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>From another issue
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Batch create issues
                </a>
                <a 
                  className="nav-link py-2 px-3 text-dark d-flex align-items-center" 
                  href="#" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (onCreateMajorWorks) {
                      onCreateMajorWorks();
                    }
                  }}
                >
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Major works
                  <span className="badge bg-primary ms-2" style={{ fontSize: '10px' }}>New</span>
                </a>
              </div>
            )}
          </div>

          {/* Issues Section */}
          <div className="mt-1">
            <button 
              className={`nav-link d-flex align-items-center justify-content-between w-100 rounded text-dark border-0 bg-transparent ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`}
              onClick={() => {
                if (isCollapsed) {
                  onToggleCollapse();
                } else {
                  handleToggleIssues();
                }
              }}
              title="Issues"
            >
              <div className="d-flex align-items-center gap-2">
                <Wrench size={18} />
                {!isCollapsed && 'Issues'}
              </div>
              {!isCollapsed && (
                <ChevronDown 
                  size={16} 
                  style={{ transform: issuesExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} 
                />
              )}
            </button>
            
            {issuesExpanded && !isCollapsed && (
              <div className="ms-3">
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Issue search
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Issue assignment
                </a>
                <a className="nav-link py-2 px-3 text-dark" href="#" onClick={(e) => e.preventDefault()}>
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Projects
                </a>
                <a 
                  className={`nav-link py-2 px-3 text-dark rounded d-flex align-items-center ${activePage === 'major-works' ? 'bg-light' : ''}`}
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate('major-works'); }}
                >
                  <span className="me-2" style={{ fontSize: '10px' }}>○</span>Major works
                  <span className="badge bg-primary ms-2" style={{ fontSize: '10px' }}>New</span>
                </a>
              </div>
            )}
          </div>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Planned maintenance">
            <Users size={18} />
            {!isCollapsed && 'Planned maintenance'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="People">
            <User size={18} />
            {!isCollapsed && 'People'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Properties">
            <Home size={18} />
            {!isCollapsed && 'Properties'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Calendar">
            <Calendar size={18} />
            {!isCollapsed && 'Calendar'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Reports">
            <FileBarChart size={18} />
            {!isCollapsed && 'Reports'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Setup">
            <Settings size={18} />
            {!isCollapsed && 'Setup'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Integrations">
            <Repeat size={18} />
            {!isCollapsed && 'Integrations'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Promote">
            <Share2 size={18} />
            {!isCollapsed && 'Promote'}
          </a>

          <a className={`nav-link d-flex align-items-center gap-2 rounded text-dark ${isCollapsed ? 'justify-content-center py-3' : 'py-2 px-3'}`} href="#" onClick={(e) => { e.preventDefault(); if (isCollapsed) onToggleCollapse(); }} title="Co-pilot">
            <User size={18} />
            {!isCollapsed && 'Co-pilot'}
          </a>
        </nav>
      </div>
    </div>
  );
}
