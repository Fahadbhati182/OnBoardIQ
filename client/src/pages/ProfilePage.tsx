import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BriefcaseBusiness, Building2, CalendarDays,
  Edit3, FileText, Mail, MessageCircle, ShieldCheck, Users, WalletCards,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { TaskProgress, taskApi } from '../services/taskApi';

export const ProfilePage: React.FC = () => {
  const { currentUser, tasks, setCurrentPage } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    taskApi.getMyProgress()
      .then(setProgress)
      .catch((error: unknown) => {
        setProgressError(error instanceof Error ? error.message : 'Unable to load onboarding progress');
      })
      .finally(() => setLoadingProgress(false));
  }, []);

  const derivedProgress = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'completed').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    notStarted: tasks.filter((task) => task.status === 'not_started').length,
  }), [tasks]);
  const counts = progress || derivedProgress;
  const percentage = progress?.completionPercentage
    ?? (counts.total ? Math.round((counts.completed / counts.total) * 100) : 0);
  const remaining = Math.max(counts.total - counts.completed, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;
  const profileDetails = [
    { icon: <BriefcaseBusiness />, label: 'Job Title', value: currentUser.jobTitle, tone: 'green' },
    { icon: <Building2 />, label: 'Department', value: currentUser.department, tone: 'gold' },
    { icon: <CalendarDays />, label: 'Joining Date', value: currentUser.joiningDate, tone: 'slate' },
    { icon: <Users />, label: 'Team', value: currentUser.teamName || '', tone: 'blue' },
    { icon: <ShieldCheck />, label: 'Role', value: currentUser.role.replace(/_/g, ' '), tone: 'gold' },
    {
      icon: <ShieldCheck />,
      label: 'Account Status',
      value: currentUser.isActive === undefined ? '' : currentUser.isActive ? 'Active' : 'Inactive',
      tone: 'green',
    },
  ].filter((detail) => detail.value);

  return (
    <div className="page-container profile-page">
      <div className="profile-heading">
        <div>
          <div className="profile-breadcrumb">Employee <span>/</span> Profile</div>
          <h1>My Profile</h1>
          <p>View your account details and onboarding progress.</p>
        </div>
        <button className="btn-secondary profile-edit-btn" onClick={() => setIsEditModalOpen(true)}>
          <Edit3 size={15} /> Edit Profile
        </button>
      </div>

      <section className="profile-hero glass-card">
        <div className="profile-avatar profile-avatar-large">{currentUser.initials}</div>
        <div className="profile-hero-main">
          <div className="profile-name-row">
            <div>
              <h2>{currentUser.name}</h2>
              {currentUser.jobTitle && <p>{currentUser.jobTitle}</p>}
            </div>
            {currentUser.isActive !== undefined && (
              <span className={`profile-active${currentUser.isActive ? '' : ' inactive'}`}>
                <span /> {currentUser.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
          <div className="profile-meta-grid">
            {currentUser.department && <span><Building2 size={15} /> {currentUser.department}</span>}
            {currentUser.joiningDate && <span><CalendarDays size={15} /> Joining: {currentUser.joiningDate}</span>}
            {currentUser.teamName && <span><Users size={15} /> {currentUser.teamName}</span>}
            <span><Mail size={15} /> {currentUser.email}</span>
          </div>
        </div>
        <div className="profile-welcome">
          <div className="profile-welcome-image" />
          <div>
            <h3>Welcome to the Northstar Technologies Pvt. Ltd. team!</h3>
            <em>“Learn. Build. Grow. Together.”</em>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <div className="profile-left-column">
          <section className="profile-panel glass-card">
            <div className="profile-panel-heading">
              <div><h3>Overview</h3><p>Key information about your role and account.</p></div>
              <span className="profile-id">Account ID: {currentUser.id}</span>
            </div>
            <div className="profile-overview-grid">
              {profileDetails.map((detail) => (
                <InfoTile
                  key={detail.label}
                  icon={detail.icon}
                  label={detail.label}
                  value={detail.value}
                  tone={detail.tone}
                  valueClass={detail.label === 'Account Status' ? 'profile-status-text' : ''}
                />
              ))}
            </div>
          </section>

          <section className="profile-panel glass-card">
            <div className="profile-panel-heading">
              <div><h3>Contact Information</h3><p>Required account contact details.</p></div>
              <button className="profile-small-action" onClick={() => setIsEditModalOpen(true)}><Edit3 size={14} /> Edit</button>
            </div>
            <div className="profile-contact-grid">
              <ContactItem icon={<Mail />} label="Email Address" value={currentUser.email} />
            </div>
          </section>
        </div>

        <div className="profile-right-column">
          <section className="profile-panel glass-card profile-progress-panel">
            <div className="profile-panel-heading">
              <div><h3>Onboarding Progress</h3><p>Complete your assigned tasks to finish induction.</p></div>
              <button className="profile-link-action" onClick={() => setCurrentPage('tasks')}>View all tasks <ArrowRight size={14} /></button>
            </div>
            <div className="profile-progress-body">
              <div className="profile-donut">
                {loadingProgress ? <span className="profile-spinner" /> : (
                  <>
                    <svg viewBox="0 0 110 110">
                      <circle cx="55" cy="55" r={radius} className="profile-donut-track" />
                      <circle cx="55" cy="55" r={radius} className="profile-donut-value" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
                    </svg>
                    <strong>{percentage}%<small>Completed</small></strong>
                  </>
                )}
              </div>
              <div className="profile-legend">
                <LegendItem color="green" label="Completed" value={counts.completed} />
                <LegendItem color="gold" label="In Progress" value={counts.inProgress} />
                <LegendItem color="blue" label="Pending" value={counts.notStarted} />
              </div>
            </div>
            <div className="profile-progress-note">
              <span>{progressError ? '!' : '🎉'}</span>
              {progressError || (remaining ? `Great progress! Finish ${remaining} more task${remaining === 1 ? '' : 's'} to complete your onboarding.` : 'You have completed your onboarding.')}
            </div>
          </section>

          <section className="profile-panel glass-card">
            <div className="profile-panel-heading"><div><h3>Quick Actions</h3><p>Common actions you might need.</p></div></div>
            <div className="profile-actions-grid">
              <ActionButton icon={<FileText />} title="View My Tasks" text="Track and complete assigned tasks." onClick={() => setCurrentPage('tasks')} tone="green" />
              <ActionButton icon={<WalletCards />} title="Browse Documents" text="Access company policies and guides." onClick={() => setCurrentPage('documents')} tone="gold" />
              <ActionButton icon={<BriefcaseBusiness />} title="IT Requests" text="Submit or track IT support requests." onClick={() => setCurrentPage('dashboard')} tone="blue" />
              <ActionButton icon={<MessageCircle />} title="Ask Northstar AI" text="Get answers to your questions." onClick={() => setCurrentPage('chat')} tone="purple" />
            </div>
          </section>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
};

const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: string; tone: string; valueClass?: string }> = ({ icon, label, value, tone, valueClass = '' }) => (
  <div className="profile-info-tile">
    <span className={`profile-tile-icon ${tone}`}>{icon}</span>
    <div><small>{label}</small><strong className={valueClass}>{value}</strong></div>
  </div>
);

const ContactItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="profile-contact-item"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>
);

const LegendItem: React.FC<{ color: string; label: string; value: number }> = ({ color, label, value }) => (
  <div><i className={`profile-legend-dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; title: string; text: string; onClick: () => void; tone: string }> = ({ icon, title, text, onClick, tone }) => (
  <button className="profile-action-card" onClick={onClick}>
    <span className={`profile-action-icon ${tone}`}>{icon}</span>
    <span className="profile-action-copy"><strong>{title}</strong><small>{text}</small></span>
    <ArrowRight size={16} />
  </button>
);
