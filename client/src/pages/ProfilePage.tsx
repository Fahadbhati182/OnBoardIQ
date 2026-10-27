import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EditProfileModal } from '../components/EditProfileModal';
import {
  User,
  Edit3,
  Mail,
  Briefcase,
  Building,
  Calendar,
  MapPin,
  BadgeCheck,
  Phone,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, tasks } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'not_started').length;
  const totalCount = tasks.length;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // SVG Circular progress math
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentCompleted / 100) * circumference;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading">
            My Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View and manage your information.
          </p>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <Edit3 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Top Two Cards (Profile Info + Onboarding Progress Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Card (Left - 2 Cols) */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-black/40 border-2 border-[#e7d7be]/40 shrink-0">
            {currentUser.initials}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
                  <span>{currentUser.name}</span>
                  <BadgeCheck size={18} className="text-emerald-400" />
                </h2>
                <p className="text-sm text-[#e7d7be] font-medium mt-0.5">
                  {currentUser.jobTitle}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 self-center sm:self-start">
                Active Employee
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-emerald-900/30 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Building size={14} className="text-slate-400" />
                <span>{currentUser.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span>Joining: {currentUser.joiningDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>{currentUser.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding Progress Gauge Card (Right - 1 Col) */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Onboarding Progress</h3>
            <span className="text-xs text-emerald-400 font-semibold">{completedCount} of {totalCount} completed</span>
          </div>

          <div className="flex items-center justify-around py-3">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                {/* Background Track */}
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Progress Fill */}
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  stroke="url(#progressGradient)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#e7d7be" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-100 font-heading">
                  {percentCompleted}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">DONE</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-slate-300">Completed:</span>
                <span className="font-semibold text-slate-100">{completedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                <span className="text-slate-300">In Progress:</span>
                <span className="font-semibold text-slate-100">{inProgressCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-slate-300">Pending:</span>
                <span className="font-semibold text-slate-100">{pendingCount}</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-white/[0.04] p-2.5 rounded-lg text-center text-[11px] text-[#e7d7be]">
            🎉 Great progress! Finish 2 more tasks to complete induction.
          </div>
        </div>
      </div>

      {/* Bottom Two Cards (Personal Information Details + Welcome Family Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-emerald-900/30">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <User size={16} className="text-[#e7d7be]" />
              <span>Personal Information</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">ID: {currentUser.employeeId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="block text-xs text-slate-400 mb-1">Job Title</span>
              <p className="font-medium text-slate-200">{currentUser.jobTitle}</p>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1">Department</span>
              <p className="font-medium text-slate-200">{currentUser.department}</p>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1">Email Address</span>
              <p className="font-medium text-slate-200 font-mono text-xs">{currentUser.email}</p>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1">Joining Date</span>
              <p className="font-medium text-slate-200">{currentUser.joiningDate}</p>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1">Reporting Manager</span>
              <p className="font-medium text-slate-200">{currentUser.manager}</p>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-1">Phone Contact</span>
              <p className="font-medium text-slate-200">{currentUser.phone}</p>
            </div>
          </div>
        </div>

        {/* Welcome to ISS Family Card (Mockup 6 visual) */}
        <div
          className="glass-card relative overflow-hidden p-8 flex flex-col justify-end min-h-[220px]"
          style={{
            backgroundImage: `url(/assets/images/welcome-bg.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06110d] via-[#06110d]/75 to-transparent z-0" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="brand-iss text-2xl font-bold">iss</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e7d7be]/20 text-[#e7d7be] border border-[#e7d7be]/30">
                GLOBAL CULTURE
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white font-heading">
              Welcome to ISS Family!
            </h2>

            <p className="text-sm text-[#e7d7be] italic font-medium mt-1">
              "Learn. Build. Grow. Together."
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};
