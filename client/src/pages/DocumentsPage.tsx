import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DocumentCategory, DocumentItem } from '../types';
import {
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { documents, setActiveDocModal, addToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: DocumentCategory[] = ['All', 'Policies', 'Guides', 'HR', 'IT', 'General'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    addToast(`Downloading ${doc.title} (${doc.fileSize})...`, 'info');
  };

  return (
    <div className="page-container">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading">
            Company Resources
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access policies, guides and resources relevant to you.
          </p>
        </div>

        {/* Search & Filter Trigger */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-10 pl-10 pr-4 bg-[#0a1b14]/80 border border-emerald-900/40 rounded-full text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-200/50 transition-all"
            />
          </div>

          <button
            onClick={() => addToast('Filter options active', 'info')}
            className="flex items-center gap-2 px-4 h-10 rounded-full bg-[#132d22] border border-emerald-800/40 text-xs font-semibold text-slate-200 hover:bg-[#1a3a2c] transition-all cursor-pointer"
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#e7d7be] text-[#0a1b14] shadow-md shadow-amber-200/20'
                  : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200 hover:bg-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid of Documents (Mockup 5 layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setActiveDocModal(doc)}
            className="glass-card group overflow-hidden cursor-pointer hover:-translate-y-1 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Visual Header / Cover Image */}
            <div
              className="h-36 relative overflow-hidden flex items-end p-4"
              style={{
                backgroundImage: doc.coverImage ? `url(${doc.coverImage})` : undefined,
                background: !doc.coverImage ? doc.coverGradient : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d221a] via-[#0d221a]/60 to-transparent" />

              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#e7d7be]/20 text-[#e7d7be] backdrop-blur-md border border-[#e7d7be]/30">
                  {doc.type} • {doc.version}
                </span>

                <span className="text-[11px] text-slate-300 flex items-center gap-1 backdrop-blur-sm px-2 py-1 rounded bg-black/30">
                  <Calendar size={11} />
                  {doc.updatedAt}
                </span>
              </div>
            </div>

            {/* Content & Metadata */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-100 group-hover:text-[#e7d7be] transition-colors flex items-center justify-between">
                  <span>{doc.title}</span>
                  <ArrowUpRight size={16} className="text-slate-500 group-hover:text-[#e7d7be] transition-colors" />
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-emerald-900/20">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <FileText size={12} />
                  {doc.fileSize}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDownload(e, doc)}
                    className="p-2 rounded-full bg-white/[0.04] text-[#e7d7be] hover:bg-[#e7d7be] hover:text-[#0a1b14] border border-emerald-800/30 transition-all cursor-pointer"
                    title="Download document"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
