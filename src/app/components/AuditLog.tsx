import { Clock, FileText, Link as LinkIcon, Upload, Plus, CheckCircle, Edit, UserPlus } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  user: string;
  dataSource: 'manual' | 'imported';
}

export default function AuditLog() {
  const auditEntries: AuditLogEntry[] = [
    {
      id: '12',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Document Uploaded',
      description: 'Uploaded "Contractor Quote - Emergency Repairs.pdf"',
      user: 'James Cooper',
      dataSource: 'manual'
    },
    {
      id: '11',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Issue Linked',
      description: 'Linked issue #2547 "Water damage in Flat 12A" to Section 20',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Stage Completed',
      description: 'Marked "Notice of Intention" stage as complete',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Document Uploaded',
      description: 'Uploaded "Section 20 Notice - Residents.pdf"',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Section 20 Updated',
      description: 'Updated budget to £285,000',
      user: 'Michael Chen',
      dataSource: 'manual'
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Issue Linked',
      description: 'Linked issue #2498 "Structural assessment required" to Section 20',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Document Uploaded',
      description: 'Uploaded "Surveyor Report - March 2025.pdf"',
      user: 'Emma Wilson',
      dataSource: 'manual'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Team Member Added',
      description: 'Added David Brown as Section 20 Surveyor',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Section 20 Updated',
      description: 'Updated property details and consultation stage',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Document Imported',
      description: 'Imported 3 documents from "Riverside Renovation 2024"',
      user: 'Sarah Mitchell',
      dataSource: 'imported'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Timeline Created',
      description: 'Generated Section 20 timeline with 6 stages',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    },
    {
      id: '1',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000 - 5 * 60 * 1000).toLocaleString('en-GB'),
      action: 'Section 20 Created',
      description: 'Section 20 created for Riverside Heights',
      user: 'Sarah Mitchell',
      dataSource: 'manual'
    }
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('Created')) return <Plus size={16} />;
    if (action.includes('Stage') || action.includes('Timeline')) return <Clock size={16} />;
    if (action.includes('Issue') || action.includes('Linked')) return <LinkIcon size={16} />;
    if (action.includes('Uploaded') || action.includes('Imported')) return <Upload size={16} />;
    if (action.includes('Completed')) return <CheckCircle size={16} />;
    if (action.includes('Updated')) return <Edit size={16} />;
    if (action.includes('Team') || action.includes('Added')) return <UserPlus size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-4">Audit Trail</h5>

        {auditEntries.length === 0 ? (
          <div className="text-center text-muted py-4">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="small">No activity recorded yet</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="list-group-item px-0">
                <div className="d-flex gap-3">
                  <div className="text-muted mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="mb-1">
                      <strong className="small">{entry.action}</strong>
                    </div>
                    <div className="text-muted small">{entry.description}</div>
                    <div className="text-muted small mt-1">
                      {entry.user} • {entry.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
