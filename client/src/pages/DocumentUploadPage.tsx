import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Building2, CalendarDays, Check, FilePlus2, FileText, FolderOpen,
  Info, Lightbulb, Loader2, Tag, UploadCloud, UsersRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccessScope, documentApi } from '../services/documentApi';
import { authApi, TeamSummary } from '../services/authApi';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const documentTypeOptions = ['POLICY', 'GUIDE', 'HANDBOOK', 'FORM', 'OTHER'];
const accessScopeOptions = [
  { value: 'ALL_EMPLOYEES', label: 'All Employees', description: 'Accessible to all employees.' },
  { value: 'TEAM_ONLY', label: 'Specific Team Only', description: 'Accessible only to the selected team.' },
  { value: 'ADMIN_ONLY', label: 'Admins Only', description: 'Accessible only to Engineering Admins.' },
] as const;

export const DocumentUploadPage: React.FC = () => {
  const { addToast, setCurrentPage } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [accessScope, setAccessScope] = useState<AccessScope>('ALL_EMPLOYEES');
  const [teamId, setTeamId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [teamError, setTeamError] = useState('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);

  useEffect(() => {
    authApi.teams()
      .then(setTeams)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unable to load teams';
        setTeamError(message);
        addToast(message, 'error');
      })
      .finally(() => setLoadingTeams(false));
  }, []);

  const selectedTeam = teams.find((team) => team.id === teamId);
  const selectedScope = accessScopeOptions.find((scope) => scope.value === accessScope);

  const chooseFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (candidate.type !== 'application/pdf' || !candidate.name.toLowerCase().endsWith('.pdf')) {
      addToast('Only PDF files are accepted', 'error');
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      addToast('The PDF must be 10 MB or smaller', 'error');
      return;
    }
    setFile(candidate);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      addToast('Choose a PDF file before uploading', 'error');
      return;
    }
    if (!documentType) {
      addToast('Select a document type', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('Enter a document title', 'error');
      return;
    }
    if (!description.trim()) {
      addToast('Enter a document description', 'error');
      return;
    }
    if (!accessScope) {
      addToast('Select an access scope', 'error');
      return;
    }
    if (loadingTeams) {
      addToast('Wait for teams to finish loading', 'error');
      return;
    }
    if (accessScope === 'TEAM_ONLY' && !teamId) {
      addToast('Select a team for team-only access', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await documentApi.upload({
        file,
        title: title.trim(),
        description: description.trim(),
        documentType,
        accessScope,
        teamId: accessScope === 'TEAM_ONLY' ? teamId : null,
      });
      addToast('Document uploaded as a draft', 'success');
      setCurrentPage('documents');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to upload document', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container document-upload-page">
      <div className="document-upload-breadcrumb">HR Admin <span>/</span> Documents <span>/</span> <b>Upload document</b></div>
      <button type="button" className="document-upload-back" onClick={() => setCurrentPage('documents')}><ArrowLeft size={16} /> Back to documents</button>

      <div className="document-upload-heading">
        <div><FilePlus2 size={28} /></div>
        <span><h1>Upload document</h1><p>Add a new company policy, guide, or onboarding resource to the knowledge base.</p></span>
      </div>

      <div className="document-upload-layout">
        <form className="document-upload-form" onSubmit={(event) => void submit(event)}>
          <div className="document-upload-form-title"><div><FileText size={18} /></div><span><strong>Document details</strong><small>Provide the necessary information about the document.</small></span></div>
          <div className="document-upload-grid">
            <label className="document-upload-field document-upload-file-field">
              <span>File (PDF) <b>*</b></span>
              <button type="button" className={`document-dropzone ${file ? 'selected' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}>
                <UploadCloud size={28} />
                <strong>{file ? file.name : 'Click to upload or drag and drop'}</strong>
                <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Only PDF files are allowed (Max 10 MB)'}</small>
              </button>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={(event) => chooseFile(event.target.files?.[0])} hidden />
            </label>

            <label className="document-upload-field"><span>Title <b>*</b></span><div className="document-input-icon"><FileText size={15} /><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Enter document title" /></div><small>e.g. Employee Handbook</small></label>
            <label className="document-upload-field"><span>Document type <b>*</b></span><div className="document-input-icon"><Tag size={15} /><input required value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Enter document type" /></div><div className="document-option-list" aria-label="Document type suggestions">{documentTypeOptions.map((type) => <button type="button" className={`document-option ${documentType === type ? 'selected' : ''}`} key={type} onClick={() => setDocumentType(type)}>{type}</button>)}</div><small>Enter a type or choose one of the options.</small></label>
            <label className="document-upload-field"><span>Access scope <b>*</b></span><div className="document-input-icon"><UsersRound size={15} /><select required value={accessScope} onChange={(event) => { const nextScope = event.target.value as typeof accessScope; setAccessScope(nextScope); if (nextScope !== 'TEAM_ONLY') setTeamId(''); }}><option value="">---</option>{accessScopeOptions.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}</select></div><small>{selectedScope?.description || 'Choose who can access this document.'}</small></label>
            {accessScope === 'TEAM_ONLY' && <label className="document-upload-field"><span>Team <b>*</b></span><div className="document-input-icon"><Building2 size={15} /><select required value={teamId} onChange={(event) => setTeamId(event.target.value)} disabled={loadingTeams || Boolean(teamError) || teams.length === 0}><option value="">{loadingTeams ? 'Loading teams...' : teamError ? 'Unable to load teams' : teams.length === 0 ? 'No teams available' : 'Select a team'}</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div><small>{teamError || selectedTeam?.description || (teams.length === 0 && !loadingTeams ? 'No teams are available.' : 'Select the team this document is intended for.')}</small></label>}
            <label className="document-upload-field"><span>Version <b>*</b></span><div className="document-input-icon"><CalendarDays size={15} /><input value="1.0" readOnly /></div><small>Initial version will be 1.0</small></label>
            <label className="document-upload-field document-upload-full"><span>Description <b>*</b></span><textarea required maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Briefly describe what this document is about..." /><small>Explain the purpose of this document, key topics, and who should read it.</small><em>{description.length}/500</em></label>
          </div>
          <div className="document-upload-actions"><small>Documents are initially saved as drafts. You can review and publish them later.</small><button type="button" className="btn-secondary" onClick={() => setCurrentPage('documents')} disabled={submitting}>Cancel</button><button type="submit" className="btn-primary" disabled={submitting || loadingTeams}>{submitting ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={15} />}{submitting ? 'Uploading...' : 'Upload document'}</button></div>
        </form>

        <aside className="document-upload-guidelines">
          <div className="document-guidelines-heading"><div><Lightbulb size={20} /></div><span><strong>Upload guidelines</strong><small>Follow these guidelines to ensure your document is properly processed.</small></span></div>
          <div className="document-guideline-list">
            {[
              [<FileText size={18} />, 'File format', 'Only PDF files are allowed.'],
              [<Info size={18} />, 'File size limit', 'Maximum file size is 10 MB.'],
              [<FileText size={18} />, 'Clear and descriptive title', 'Use a concise title that clearly identifies the document.'],
              [<FileText size={18} />, 'Add detailed description', 'Help employees understand what the document contains.'],
              [<Building2 size={18} />, 'Select appropriate team', 'Select the appropriate team if the document is intended for a specific team.'],
              [<UsersRound size={18} />, 'Choose access scope', 'Control whether the document is available to all employees, a specific team, or admins only.'],
              [<Tag size={18} />, 'Choose correct document type', 'Select whether this is a policy, guide, handbook, form, or other document.'],
            ].map(([icon, heading, text]) => <div className="document-guideline" key={heading as string}><div>{icon}</div><span><strong>{heading}</strong><small>{text}</small></span></div>)}
          </div>
          <div className="document-next"><strong>What happens next?</strong><p><span>1</span>The document will be uploaded and stored securely.</p><p><span>2</span>A new document record will be created with status “Draft”.</p><p><span>3</span>You can review and publish the document later.</p><p><span>4</span>Once published, it will be available to authorized users and the AI assistant.</p></div>
        </aside>
      </div>
    </div>
  );
};
