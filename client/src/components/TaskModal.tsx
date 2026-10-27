import React from 'react';
import { useApp } from '../context/AppContext';
import { X, CheckCircle, Clock, BookOpen, ExternalLink } from 'lucide-react';
import { TaskStatus } from '../types';

export const TaskModal: React.FC = () => {
  const { activeTaskModal, setActiveTaskModal, toggleChecklistItem, updateTaskStatus } = useApp();

  if (!activeTaskModal) return null;

  const completedCount = activeTaskModal.checklist.filter((c) => c.completed).length;
  const totalCount = activeTaskModal.checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={() => setActiveTaskModal(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Cover */}
        <div
          style={{
            height: '160px',
            backgroundImage: `url(${activeTaskModal.thumbnailUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(6, 17, 13, 0.4), rgba(13, 34, 26, 0.95))',
            }}
          />
          <button
            onClick={() => setActiveTaskModal(null)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(0, 0, 0, 0.6)',
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

          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '24px',
              right: '24px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#e7d7be',
                }}
              >
                {activeTaskModal.category}
              </span>
              <h2 style={{ fontSize: '20px', color: '#f8fafc', marginTop: '2px' }}>
                {activeTaskModal.title}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
              <Clock size={14} />
              <span>{activeTaskModal.timeEstimate}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            {activeTaskModal.description}
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(46, 125, 96, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                color: '#94a3b8',
                marginBottom: '8px',
              }}
            >
              <span>Checklist Progress</span>
              <span style={{ color: '#e7d7be', fontWeight: 600 }}>
                {completedCount} of {totalCount} completed ({progressPercent}%)
              </span>
            </div>
            <div
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4ade80, #e7d7be)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', color: '#e7d7be', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} />
              <span>Step-by-Step Items</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTaskModal.checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(activeTaskModal.id, item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: item.completed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${item.completed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      border: `2px solid ${item.completed ? '#4ade80' : '#64748b'}`,
                      background: item.completed ? '#4ade80' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0a1b14',
                    }}
                  >
                    {item.completed && <CheckCircle size={14} />}
                  </div>
                  <span
                    style={{
                      fontSize: '13.5px',
                      color: item.completed ? '#94a3b8' : '#f8fafc',
                      textDecoration: item.completed ? 'line-through' : 'none',
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Instructions & Guidance</h4>
            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {activeTaskModal.instructions}
            </p>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['completed', 'in_progress', 'not_started'] as TaskStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateTaskStatus(activeTaskModal.id, status)}
                  style={{
                    background: activeTaskModal.status === status ? 'rgba(231, 215, 190, 0.2)' : 'transparent',
                    border: `1px solid ${activeTaskModal.status === status ? 'rgba(231, 215, 190, 0.6)' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: activeTaskModal.status === status ? '#e7d7be' : '#94a3b8',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button onClick={() => setActiveTaskModal(null)} className="btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
