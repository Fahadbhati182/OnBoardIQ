import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  FileText, Grid2X2, List, Loader2, MoreVertical, Search, Upload, UsersRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApiDocument, documentApi } from '../services/documentApi';

type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW';

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="document-check-cell"><div className="document-skeleton-dot" /></td>
    <td><div className="document-skeleton-line wide" /><div className="document-skeleton-line" /></td>
    <td><div className="document-skeleton-pill" /></td>
    <td><div className="document-skeleton-line" /></td>
    <td><div className="document-skeleton-line short" /></td>
    <td><div className="document-skeleton-line" /></td>
    <td><div className="document-skeleton-pill" /></td>
    <td><div className="document-skeleton-dot" /></td>
  </tr>
);

const MetricCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; tone: string }> = ({
  icon, value, label, tone,
}) => (
  <div className={`document-metric-card document-metric-${tone}`}>
    <div className="document-metric-icon">{icon}</div>
    <div><strong>{value}</strong><span>{label}</span></div>
  </div>
);

const normalizedStatus = (status: string): StatusFilter => {
  if (status === 'PUBLISHED' || status === 'DRAFT' || status === 'PENDING_REVIEW') return status;
  return 'DRAFT';
};

export const DocumentsPage: React.FC = () => {
  const { addToast, setActiveDocModal, setCurrentPage } = useApp();
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadDocuments = () => {
    setLoading(true);
    documentApi.list()
      .then(setDocuments)
      .catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Unable to load documents', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocuments(); }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach((document) => {
      const type = document.documentType.toUpperCase();
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()];
  }, [documents]);
  const departments = useMemo(
    () => [...new Set(documents.map((document) => document.departmentId).filter(Boolean))] as string[],
    [documents],
  );
  const filteredDocuments = useMemo(() => documents.filter((document) => (
    `${document.title} ${document.description || ''} ${document.documentType} ${document.departmentId || ''}`.toLowerCase().includes(search.toLowerCase())
    && (!department || document.departmentId === department)
    && (status === 'ALL' || normalizedStatus(document.status) === status)
    && (category === 'ALL' || document.documentType.toUpperCase() === category)
  )), [documents, search, department, status, category]);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));
  const pagedDocuments = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);
  const published = documents.filter((document) => document.status === 'PUBLISHED').length;
  const drafts = documents.filter((document) => document.status === 'DRAFT').length;
  const pending = documents.filter((document) => document.status === 'PENDING_REVIEW').length;

  useEffect(() => setPage(1), [search, department, status, category]);

  const openDocument = (document: ApiDocument) => {
    setActiveDocModal({
      id: document.id,
      title: document.title,
      type: document.documentType,
      category: 'General',
      department: document.departmentId || 'Company',
      version: document.currentVersion ? `v${document.currentVersion.versionNumber}` : 'Draft',
      status: document.status === 'PUBLISHED' ? 'published' : 'draft',
      updatedAt: new Date(document.updatedAt).toLocaleDateString(),
      fileSize: document.currentVersion ? `${Math.round(document.currentVersion.fileSizeBytes / 1024)} KB` : 'Unavailable',
      summary: document.description || '',
      keyPoints: [],
      coverGradient: 'linear-gradient(135deg, #163d2b, #0d221a)',
    });
  };

  return (
    <div className="page-container documents-page">
      <div className="documents-breadcrumb">HR Admin <span>/</span> Documents</div>
      <div className="documents-page-header">
        <div><h1>Document management</h1><p>Manage company policies, guides, and onboarding resources.</p></div>
        <button className="btn-primary" onClick={() => setCurrentPage('document-upload')}><Upload size={15} /> Upload document</button>
      </div>

      <div className="document-metrics-grid">
        <MetricCard icon={<FileText size={21} />} value={loading ? '—' : documents.length} label="Total documents" tone="green" />
        <MetricCard icon={<CheckCircle2 size={21} />} value={loading ? '—' : published} label="Published" tone="blue" />
        <MetricCard icon={<FileText size={21} />} value={loading ? '—' : drafts} label="Drafts" tone="gold" />
        <MetricCard icon={<CalendarDays size={21} />} value={loading ? '—' : pending} label="Pending review" tone="amber" />
      </div>

      <div className="document-library-card">
        <div className="document-library-heading">
          <div className="document-section-title"><div><FileText size={19} /></div><span><strong>Document library</strong><small>Browse, search, and manage all documents and resources.</small></span></div>
          <div className="document-toolbar">
            <label className="document-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents..." /></label>
            <label className="document-select"><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
            <label className="document-select"><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="ALL">All status</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="PENDING_REVIEW">Pending review</option></select><ChevronDown size={13} /></label>
            <div className="document-view-toggle"><button className="active" title="List view"><List size={15} /></button><button disabled title="Grid view"><Grid2X2 size={14} /></button></div>
          </div>
        </div>

        <div className="document-tabs">
          <button className={category === 'ALL' ? 'active' : ''} onClick={() => setCategory('ALL')}>All documents ({documents.length})</button>
          {categories.map(([type, count]) => <button key={type} className={category === type ? 'active' : ''} onClick={() => setCategory(type)}>{type.replace('_', ' ')} ({count})</button>)}
        </div>

        <div className="overflow-x-auto">
          <table className="document-data-table">
            <thead><tr><th className="document-check-cell"><input type="checkbox" disabled aria-label="Select all documents" /></th><th>Document</th><th>Type</th><th>Department</th><th>Version</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />) : pagedDocuments.map((document) => {
                const documentStatus = normalizedStatus(document.status);
                return <tr key={document.id} onClick={() => openDocument(document)}>
                  <td className="document-check-cell"><input type="checkbox" onClick={(event) => event.stopPropagation()} aria-label={`Select ${document.title}`} /></td>
                  <td><div className="document-name-cell"><span className={`document-type-icon ${documentStatus === 'DRAFT' ? 'draft' : 'published'}`}><FileText size={16} /></span><span><strong>{document.title}</strong><small>{document.description || 'No description provided'}</small></span></div></td>
                  <td><span className={`document-type-pill ${document.documentType.toLowerCase()}`}>{document.documentType}</span></td>
                  <td><span className="document-muted"><UsersRound size={14} />{document.departmentId || 'All employees'}</span></td>
                  <td><span className="document-muted">{document.currentVersion ? `v${document.currentVersion.versionNumber}` : 'Draft'}</span></td>
                  <td><span className="document-date"><CalendarDays size={14} />{new Date(document.updatedAt).toLocaleDateString()}</span></td>
                  <td><span className={`document-status ${documentStatus.toLowerCase()}`}><span />{documentStatus === 'PENDING_REVIEW' ? 'Pending review' : documentStatus.charAt(0) + documentStatus.slice(1).toLowerCase()}</span></td>
                  <td><div className="document-actions"><button title="More actions" onClick={(event) => event.stopPropagation()}><MoreVertical size={16} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
          {!loading && pagedDocuments.length === 0 && <div className="document-empty"><Archive size={28} /><p>No documents match your filters.</p></div>}
        </div>
        <div className="document-table-footer"><span>Showing {filteredDocuments.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredDocuments.length)} of {filteredDocuments.length} documents</span><div className="document-pagination"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => <button key={number} className={page === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>)}<button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}><ChevronRight size={15} /></button></div></div>
      </div>

      <div className="document-readiness-card"><div className="document-readiness-icon"><Archive size={21} /></div><div className="document-readiness-copy"><strong>Knowledge base readiness</strong><span>{loading ? 'Loading document readiness...' : `${published} of ${documents.length} documents published`}</span><small>{documents.length ? 'Published documents are available to authorized users in the AI assistant.' : 'No documents are available yet.'}</small></div><div className="document-readiness-progress"><div><span style={{ width: `${documents.length ? Math.round((published / documents.length) * 100) : 0}%` }} /></div><strong>{documents.length ? `${Math.round((published / documents.length) * 100)}%` : '—'}</strong></div><button className="btn-secondary" disabled={!published}>View in AI knowledge base <ChevronRight size={15} /></button></div>
    </div>
  );
};
