import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AccessStatus, AccessRequestItem } from '../types';
import {
  Check,
  X,
  Search,
  KeyRound,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Filter,
} from 'lucide-react';

export const ITAdminAccessPage: React.FC = () => {
  const { accessRequests, updateAccessRequest, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | AccessStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = accessRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = accessRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = accessRequests.filter((r) => r.status === 'rejected').length;

  const filteredRequests = accessRequests.filter((req) => {
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.systemTool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading">
              Access Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-[#e7d7be] border border-[#e7d7be]/30">
              IT SECOPS
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage employee access requests for systems and tools.
          </p>
        </div>

        {/* Quick Stat Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold self-start">
          <Clock size={14} />
          <span>{pendingCount} Pending Approval</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[#e7d7be] text-[#0a1b14] shadow-md shadow-amber-200/20'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#e7d7be] text-[#0a1b14]'
                : 'bg-white/[0.03] text-slate-400 border border-emerald-900/30 hover:text-slate-200'
            }`}
          >
            All ({accessRequests.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employee or tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 h-9 pl-9 pr-4 bg-[#0a1b14]/80 border border-emerald-900/40 rounded-full text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-200/50"
          />
        </div>
      </div>

      {/* Requests Table matching Mockup 8 */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-900/30 bg-emerald-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-4">System / Tool</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Requested At</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/20 text-xs">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 shadow-sm">
                        {req.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">
                          {req.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {req.employeeEmail}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-[#e7d7be]" />
                      <span className="font-medium text-slate-200">
                        {req.systemTool}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-slate-300 max-w-xs truncate">
                    {req.reason}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`status-pill ${
                        req.status === 'approved'
                          ? 'completed'
                          : req.status === 'rejected'
                          ? 'rejected'
                          : 'in_progress'
                      }`}
                    >
                      {req.status === 'approved'
                        ? 'Approved'
                        : req.status === 'rejected'
                        ? 'Rejected'
                        : 'Pending'}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-slate-400 text-[11px]">
                    {req.requestedAt}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve Button */}
                      <button
                        onClick={() => updateAccessRequest(req.id, 'approved')}
                        disabled={req.status === 'approved'}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 opacity-70 cursor-default'
                            : 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-slate-950'
                        }`}
                        title="Approve access"
                      >
                        <Check size={14} />
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => updateAccessRequest(req.id, 'rejected')}
                        disabled={req.status === 'rejected'}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          req.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 opacity-70 cursor-default'
                            : 'bg-red-600/30 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                        }`}
                        title="Reject access"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
