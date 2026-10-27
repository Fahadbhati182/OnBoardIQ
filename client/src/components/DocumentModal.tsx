import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Download, FileText, CheckCircle2, Share2, Shield, Calendar } from 'lucide-react';

export const DocumentModal: React.FC = () => {
  const { activeDocModal, setActiveDocModal, addToast } = useApp();

  if (!activeDocModal) return null;

  const handleDownload = () => {
    addToast(`Downloading ${activeDocModal.title} (${activeDocModal.fileSize})...`, 'info');
  };

  return (
    <div className="modal-overlay" onClick={() => setActiveDocModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Cover */}
        <div
          style={{
            background: activeDocModal.coverGradient,
            padding: '28px',
            position: 'relative',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveDocModal(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#e7d7be',
                background: 'rgba(231, 215, 190, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {activeDocModal.category}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#4ade80',
                background: 'rgba(34, 197, 94, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {activeDocModal.version}
            </span>
          </div>

          <h2 style={{ fontSize: '22px', color: '#f8fafc', fontWeight: 700 }}>
            {activeDocModal.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#cbd5e1', fontSize: '12px', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={13} />
              Updated {activeDocModal.updatedAt}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={13} />
              {activeDocModal.fileSize}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={13} />
              {activeDocModal.department} Department
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Summary & Scope
            </h4>
            <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: 1.6 }}>
              {activeDocModal.summary}
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', color: '#e7d7be', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Key Policy Highlights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeDocModal.keyPoints.map((point, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(46, 125, 96, 0.2)',
                  }}
                >
                  <CheckCircle2 size={16} color="#4ade80" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => {
                navigator.clipboard?.writeText?.(window.location.href);
                addToast('Document link copied to clipboard', 'info');
              }}
              className="btn-secondary"
            >
              <Share2 size={15} />
              <span>Share Link</span>
            </button>

            <button onClick={handleDownload} className="btn-primary">
              <Download size={15} />
              <span>Download PDF ({activeDocModal.fileSize})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
