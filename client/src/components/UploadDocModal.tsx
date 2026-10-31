import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UploadCloud, FileText, Check } from 'lucide-react';
import { DocumentCategory, DocumentStatus } from '../types';
import { documentApi } from '../services/documentApi';

interface UploadDocModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadDocModal: React.FC<UploadDocModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Policy');
  const [category, setCategory] = useState<DocumentCategory>('Policies');
  const [department, setDepartment] = useState('All');
  const [version, setVersion] = useState('v1.0');
  const [status, setStatus] = useState<DocumentStatus>('published');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      addToast('A title and PDF file are required', 'error');
      return;
    }
    try {
      await documentApi.upload({
        file,
        title,
        description: summary,
        documentType: type.toUpperCase(),
        accessScope: 'ALL_EMPLOYEES',
      });
      addToast('Document uploaded as a draft', 'success');
      onClose();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to upload document', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(46, 125, 96, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(231, 215, 190, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e7d7be',
              }}
            >
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', color: '#f8fafc' }}>Upload New Document</h3>
              <p style={{ fontSize: '12px', color: '#8da498' }}>Add company policy or onboarding material</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Document Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Health & Safety Handbook 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                style={inputStyle}
              >
                <option value="Policies">Policies</option>
                <option value="Guides">Guides</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={inputStyle}
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">Human Resources</option>
                <option value="IT">IT & Security</option>
                <option value="Finance">Finance</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Version
              </label>
              <input
                type="text"
                placeholder="v1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                style={inputStyle}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Summary & Overview
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary explaining who this document applies to and key directives..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Simulated File Dropzone */}
          <div
            style={{
              border: '2px dashed rgba(46, 125, 96, 0.4)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: file ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              transition: 'all 0.2s',
            }}
          >
            <FileText size={28} color={file ? '#4ade80' : '#8da498'} style={{ margin: '0 auto 8px' }} />
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            {file ? (
              <p style={{ fontSize: '13px', color: '#4ade80', fontWeight: 600 }}>
                ✓ {file.name} attached
              </p>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#e7d7be', fontWeight: 500 }}>
                  Click to browse or drop PDF file here
                </p>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Supports PDF, DOCX up to 25MB</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Publish Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(10, 26, 19, 0.8)',
  border: '1px solid rgba(46, 125, 96, 0.3)',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '13px',
  outline: 'none',
};
