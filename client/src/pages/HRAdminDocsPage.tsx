import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UploadDocModal } from '../components/UploadDocModal';
import { DocumentCategory, DocumentItem } from '../types';
import {
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';

export const HRAdminDocsPage: React.FC = () => {
  const { documents, toggleDocumentStatus, deleteDocument, setActiveDocModal, addToast } = useApp();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const policiesCount = documents.filter((d) => d.category === 'Policies').length;
  const guidesCount = documents.filter((d) => d.category === 'Guides').length;
  const hrCount = documents.filter((d) => d.category === 'HR').length;
  const itCount = documents.filter((d) => d.category === 'IT').length;
  const draftsCount = documents.filter((d) => d.status === 'draft').length;
  const totalCount = documents.length;

  const filteredDocs = documents.filter((doc) => {
    let matchesTab = true;
    if (selectedTab === 'policies') matchesTab = doc.category === 'Policies';
    else if (selectedTab === 'guides') matchesTab = doc.category === 'Guides';
    else if (selectedTab === 'hr') matchesTab = doc.category === 'HR';
    else if (selectedTab === 'it') matchesTab = doc.category === 'IT';
    else if (selectedTab === 'drafts') matchesTab = doc.status === 'draft';

    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading">
              Document Management
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-[#e7d7be] border border-[#e7d7be]/30">
              HR PORTAL
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Upload and manage company policies and onboarding content.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-md shadow-amber-200/20'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            All Documents ({totalCount})
          </button>
          <button
            onClick={() => setSelectedTab('policies')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'policies'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Policies ({policiesCount})
          </button>
          <button
            onClick={() => setSelectedTab('guides')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'guides'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Guides ({guidesCount})
          </button>
          <button
            onClick={() => setSelectedTab('hr')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'hr'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            HR ({hrCount})
          </button>
          <button
            onClick={() => setSelectedTab('it')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'it'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            IT ({itCount})
          </button>
          <button
            onClick={() => setSelectedTab('drafts')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedTab === 'drafts'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Drafts ({draftsCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 h-9 pl-9 pr-4 bg-[#0a1b14]/80 border border-emerald-900/40 rounded-full text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-200/50"
          />
        </div>
      </div>

      {/* Data Table matching Mockup 7 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-900/30 bg-emerald-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated At</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 text-xs">
              {filteredDocs.map((doc) => {
                const isPublished = doc.status === 'published';

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setActiveDocModal(doc)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-800/30 flex items-center justify-center text-[#e7d7be] shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-[#e7d7be] transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-slate-500">{doc.fileSize}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[11px]">
                        {doc.type}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-300">
                      {doc.department}
                    </td>

                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {doc.version}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDocumentStatus(doc.id);
                        }}
                        className={`status-pill ${isPublished ? 'published' : 'draft'} cursor-pointer hover:opacity-80`}
                        title="Click to toggle status"
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {doc.updatedAt}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDocModal(doc)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            addToast(`Downloading ${doc.title}...`, 'info');
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <UploadDocModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};
