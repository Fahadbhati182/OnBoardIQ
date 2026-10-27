import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageType, UserRole } from '../types';
import { Layers, ChevronUp, ChevronDown } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { currentPage, setCurrentPage, setCurrentUserRole } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const pages: { id: PageType; label: string; role?: UserRole }[] = [
    { id: 'login', label: '1. Login' },
    { id: 'dashboard', label: '2. Dashboard', role: 'employee' },
    { id: 'chat', label: '3. AI Assistant', role: 'employee' },
    { id: 'tasks', label: '4. My Tasks', role: 'employee' },
    { id: 'documents', label: '5. Documents', role: 'employee' },
    { id: 'profile', label: '6. Profile', role: 'employee' },
    { id: 'hr-docs', label: '7. HR Admin', role: 'hr_admin' },
    { id: 'it-access', label: '8. IT Admin', role: 'it_admin' },
    { id: 'company', label: '9. Company Info' },
  ];

  const handleSelect = (pageId: PageType, role?: UserRole) => {
    if (role) {
      setCurrentUserRole(role);
    }
    setCurrentPage(pageId);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(10, 26, 19, 0.95)',
          border: '1px solid rgba(231, 215, 190, 0.4)',
          borderRadius: '9999px',
          padding: '8px 14px',
          color: '#e7d7be',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <Layers size={14} />
        <span>Pages (9)</span>
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div className="demo-switcher-banner">
      <div className="demo-switcher-label">
        <Layers size={13} />
        <span>All 9 Pages:</span>
      </div>

      {pages.map((p) => {
        const isActive = currentPage === p.id;
        return (
          <button
            key={p.id}
            onClick={() => handleSelect(p.id, p.role)}
            className={`demo-switcher-btn ${isActive ? 'active' : ''}`}
          >
            {p.label}
          </button>
        );
      })}

      <button
        onClick={() => setCollapsed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Minimize Bar"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
};
