import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  CloudUpload,
  FileText,
  ListChecks,
  Laptop,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import {
  AdminDashboardSummary,
  TaskDefinition,
  taskApi,
} from '../services/taskApi';

export const DashboardPage: React.FC = () => {
  const { currentUserRole } = useApp();

  return currentUserRole === 'engineering_admin'
    ? <AdminDashboard />
    : <EmployeeDashboard />;
};

const AdminDashboard: React.FC = () => {
  const { currentUser, setCurrentPage } = useApp();
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      taskApi.getAdminDashboardSummary(),
      taskApi.listDefinitions('?active=true'),
    ])
      .then(([nextSummary, taskDefinitions]) => {
        if (!active) return;
        setSummary(nextSummary);
        setActiveTasks(taskDefinitions.slice(0, 5));
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        const message = loadError instanceof Error
          ? loadError.message
          : 'Unable to load dashboard data';
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const completed = summary?.completedAssignments ?? 0;
  const inProgress = summary?.inProgressAssignments ?? 0;
  const pending = summary?.pendingAssignments ?? 0;
  const assignmentTotal = summary?.totalAssignments ?? 0;
  const completedPercent = assignmentTotal
    ? Math.round((completed / assignmentTotal) * 100)
    : 0;
  const inProgressPercent = assignmentTotal
    ? Math.round((inProgress / assignmentTotal) * 100)
    : 0;
  const greeting = new Date().getHours() < 12
    ? 'Good morning'
    : new Date().getHours() < 18
      ? 'Good afternoon'
      : 'Good evening';

  const metricValue = (value: number | undefined) =>
    loading || !summary ? '—' : (value ?? 0).toLocaleString();

  return (
    <div className="page-container admin-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <span className="admin-dashboard-eyebrow">Admin dashboard</span>
          <h1>{greeting}, {currentUser.name.split(' ')[0]}!</h1>
          <p>Manage employees, onboarding tasks, and company documents.</p>
        </div>
        <div className="admin-dashboard-date">
          <CalendarDays size={17} />
          {new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date())}
        </div>
      </div>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      )}

      <div className="admin-dashboard-metrics">
        <AdminMetric icon={<Users size={20} />} value={metricValue(summary?.totalEmployees)} label="Total employees" detail={`${metricValue(summary?.activeEmployees)} active`} tone="green" />
        <AdminMetric icon={<ListChecks size={20} />} value={metricValue(summary?.activeTasks)} label="Active tasks" detail="Onboarding task definitions" tone="gold" />
        <AdminMetric icon={<Activity size={20} />} value={metricValue(summary?.inProgressAssignments)} label="In progress" detail="Task assignments" tone="blue" />
        <AdminMetric icon={<ClipboardList size={20} />} value={metricValue(summary?.pendingAssignments)} label="Pending tasks" detail="Not started" tone="muted" />
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-dashboard-card admin-progress-card">
          <div className="admin-dashboard-card-heading">
            <h2><CheckCircle2 size={18} /> Onboarding progress</h2>
          </div>
          {loading ? (
            <div className="admin-dashboard-loading">Loading assignment progress…</div>
          ) : !summary ? (
            <div className="admin-dashboard-empty">Assignment progress is unavailable.</div>
          ) : (
            <div className="admin-progress-content">
              <div
                className="admin-progress-donut"
                style={{
                  background: assignmentTotal
                    ? `conic-gradient(#42e89c 0% ${completedPercent}%, #f0cb57 ${completedPercent}% ${completedPercent + inProgressPercent}%, #9aabb1 ${completedPercent + inProgressPercent}% 100%)`
                    : 'conic-gradient(#28483b 0% 100%)',
                }}
              >
                <div>
                  <strong>{completedPercent}%</strong>
                  <span>Completed</span>
                </div>
              </div>
              <div className="admin-progress-legend">
                <ProgressLegend color="completed" label="Completed" value={completed} />
                <ProgressLegend color="in-progress" label="In progress" value={inProgress} />
                <ProgressLegend color="pending" label="Not started" value={pending} />
                <small>{assignmentTotal.toLocaleString()} total assignments</small>
              </div>
            </div>
          )}
        </section>

        <section className="admin-dashboard-card admin-task-list-card">
          <div className="admin-dashboard-card-heading">
            <h2><FileText size={18} /> Active onboarding tasks</h2>
            <button type="button" onClick={() => setCurrentPage('task-admin')}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="admin-dashboard-loading">Loading active tasks…</div>
          ) : error ? (
            <div className="admin-dashboard-empty">Active tasks are unavailable.</div>
          ) : activeTasks.length ? (
            <div className="admin-dashboard-task-list">
              {activeTasks.map((task) => (
                <div className="admin-dashboard-task" key={task.id}>
                  <span className="admin-dashboard-task-icon"><Check size={15} /></span>
                  <span className="admin-dashboard-task-copy">
                    <strong>{task.title}</strong>
                    <small>{task.estimatedMinutes} min</small>
                  </span>
                  <em className={task.required ? 'required' : 'optional'}>
                    {task.required ? 'Required' : 'Optional'}
                  </em>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-dashboard-empty">No active onboarding tasks.</div>
          )}
        </section>

        <section className="admin-dashboard-card admin-quick-actions">
          <div className="admin-dashboard-card-heading">
            <h2><Sparkles size={18} /> Quick actions</h2>
          </div>
          <div className="admin-quick-action-grid">
            <QuickAction icon={<Plus size={19} />} label="Assign tasks" onClick={() => setCurrentPage('task-admin')} />
            <QuickAction icon={<UserPlus size={19} />} label="Add employee" onClick={() => setCurrentPage('employees')} />
            <QuickAction icon={<CloudUpload size={19} />} label="Upload document" onClick={() => setCurrentPage('document-upload')} />
            <QuickAction icon={<FileText size={19} />} label="View documents" onClick={() => setCurrentPage('documents')} />
          </div>
        </section>
      </div>

      <div className="admin-dashboard-help">
        <div>
          <BookOpen size={20} />
          <span>
            <strong>Company documents</strong>
            <small>Open the document library for published company resources.</small>
          </span>
        </div>
        <button type="button" onClick={() => setCurrentPage('documents')}>
          Open documents <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

const AdminMetric: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  detail: string;
  tone: string;
}> = ({ icon, value, label, detail, tone }) => (
  <div className={`admin-dashboard-metric ${tone}`}>
    <span className="admin-dashboard-metric-icon">{icon}</span>
    <span className="admin-dashboard-metric-copy">
      <strong>{value}</strong>
      <small>{label}</small>
      <em>{detail}</em>
    </span>
  </div>
);

const ProgressLegend: React.FC<{
  color: string;
  label: string;
  value: number;
}> = ({ color, label, value }) => (
  <div className="admin-progress-legend-item">
    <i className={color} />
    <span>{label}</span>
    <strong>{value.toLocaleString()}</strong>
  </div>
);

const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick}>
    {icon}
    <span>{label}</span>
  </button>
);

const EmployeeDashboard: React.FC = () => {
  const { currentUser, tasks, setCurrentPage, setActiveTaskModal, setActiveDocModal, documents } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'not_started').length;

  const openHandbook = () => {
    const handbook = documents.find((d) => d.title.includes('Handbook')) || documents[0];
    setActiveDocModal(handbook);
  };

  return (
    <div className="page-container">
      {/* Top Banner Row */}
      <div style={styles.bannerRow}>
        <div style={styles.greetingBlock}>
          <h1 style={styles.greetingTitle}>
            Good Morning, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p style={styles.greetingSubtitle}>
            Welcome to Northstar Technologies Pvt. Ltd.! Let's make your journey amazing.
          </p>
        </div>

        {/* Culture Quote Card with Botanical Silhouette */}
        <div style={styles.quoteCard}>
          <div style={styles.quoteLeafDeco} />
          <p style={styles.quoteText}>
            "Great people build great places together."
          </p>
          <span style={styles.quoteAuthor}>— Our Culture</span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={styles.metricNumber}>{totalTasks}</div>
            <div style={styles.metricLabel}>Total Tasks</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(34, 197, 94, 0.18)', color: '#22c55e' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={styles.metricNumber}>{completedTasks}</div>
            <div style={styles.metricLabel}>Completed</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={styles.metricNumber}>{inProgressTasks}</div>
            <div style={styles.metricLabel}>In Progress</div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={styles.metricNumber}>{pendingTasks}</div>
            <div style={styles.metricLabel}>Pending</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={styles.twoColLayout}>
        {/* Left Column: My Onboarding Tasks */}
        <div className="glass-card" style={styles.tasksSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionHeading}>My Onboarding Tasks</h2>
            <button
              onClick={() => setCurrentPage('tasks')}
              style={styles.viewAllBtn}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={styles.taskList}>
            {tasks.slice(0, 4).map((task) => {
              const isCompleted = task.status === 'completed';
              const isInProgress = task.status === 'in_progress';

              return (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskModal(task)}
                  style={styles.taskCard}
                >
                  <div style={styles.taskLeft}>
                    <div
                      style={{
                        ...styles.taskIconCircle,
                        background: isCompleted
                          ? 'rgba(34, 197, 94, 0.2)'
                          : isInProgress
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(148, 163, 184, 0.15)',
                        color: isCompleted ? '#4ade80' : isInProgress ? '#fbbf24' : '#94a3b8',
                      }}
                    >
                      {isCompleted ? (
                        <Check size={16} />
                      ) : isInProgress ? (
                        <Clock size={16} />
                      ) : (
                        <ClipboardList size={16} />
                      )}
                    </div>

                    <div>
                      <h4 style={styles.taskTitle}>{task.title}</h4>
                      <p style={styles.taskDesc}>{task.description}</p>
                    </div>
                  </div>

                  <div style={styles.taskRight}>
                    <span
                      className={`status-pill ${
                        isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started'
                      }`}
                    >
                      {isCompleted
                        ? 'Completed'
                        : isInProgress
                        ? 'In Progress'
                        : 'Not Started'}
                    </span>
                    <ChevronRight size={16} style={{ color: '#64748b' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Access */}
        <div className="glass-card" style={styles.quickAccessCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionHeading}>Quick Access</h2>
          </div>

          <div style={styles.quickAccessList}>
            <div
              onClick={() => setCurrentPage('documents')}
              style={styles.quickAccessItem}
            >
              <div style={{ ...styles.quickIconBox, background: 'rgba(231, 215, 190, 0.14)', color: '#e7d7be' }}>
                <FileText size={18} />
              </div>
              <div style={styles.quickTextBlock}>
                <div style={styles.quickTitle}>Company Policies</div>
                <div style={styles.quickDesc}>View all policies</div>
              </div>
              <ChevronRight size={16} style={{ color: '#64748b' }} />
            </div>

            <div
              onClick={() => {
                const itTask = tasks.find((t) => t.category === 'IT');
                if (itTask) setActiveTaskModal(itTask);
                else setCurrentPage('tasks');
              }}
              style={styles.quickAccessItem}
            >
              <div style={{ ...styles.quickIconBox, background: 'rgba(34, 197, 94, 0.14)', color: '#4ade80' }}>
                <Laptop size={18} />
              </div>
              <div style={styles.quickTextBlock}>
                <div style={styles.quickTitle}>IT Setup Guide</div>
                <div style={styles.quickDesc}>Get started</div>
              </div>
              <ChevronRight size={16} style={{ color: '#64748b' }} />
            </div>

            <div
              onClick={openHandbook}
              style={styles.quickAccessItem}
            >
              <div style={{ ...styles.quickIconBox, background: 'rgba(245, 158, 11, 0.14)', color: '#fbbf24' }}>
                <BookOpen size={18} />
              </div>
              <div style={styles.quickTextBlock}>
                <div style={styles.quickTitle}>Employee Handbook</div>
                <div style={styles.quickDesc}>Learn more</div>
              </div>
              <ChevronRight size={16} style={{ color: '#64748b' }} />
            </div>

            <div
              onClick={() => setCurrentPage('chat')}
              style={styles.quickAccessItem}
            >
              <div style={{ ...styles.quickIconBox, background: 'rgba(231, 215, 190, 0.2)', color: '#e7d7be' }}>
                <Sparkles size={18} />
              </div>
              <div style={styles.quickTextBlock}>
                <div style={styles.quickTitle}>Ask AI Assistant</div>
                <div style={styles.quickDesc}>Get instant answers</div>
              </div>
              <ChevronRight size={16} style={{ color: '#64748b' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bannerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  greetingBlock: {
    flex: 1,
    minWidth: '280px',
  },
  greetingTitle: {
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#f8fafc',
  },
  greetingSubtitle: {
    fontSize: '14px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  quoteCard: {
    background: 'rgba(14, 38, 29, 0.75)',
    border: '1px solid rgba(46, 125, 96, 0.3)',
    borderRadius: '16px',
    padding: '16px 24px',
    maxWidth: '380px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  quoteLeafDeco: {
    position: 'absolute',
    right: '-10px',
    top: '-10px',
    width: '90px',
    height: '90px',
    backgroundImage: `radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  quoteText: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: '#e7d7be',
    lineHeight: 1.4,
    position: 'relative',
    zIndex: 1,
  },
  quoteAuthor: {
    display: 'block',
    fontSize: '11px',
    color: '#8da498',
    marginTop: '4px',
    textAlign: 'right',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  metricCard: {
    background: 'rgba(14, 33, 25, 0.85)',
    border: '1px solid rgba(46, 125, 96, 0.22)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  metricIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f8fafc',
    lineHeight: 1.1,
  },
  metricLabel: {
    fontSize: '12px',
    color: '#8da498',
    marginTop: '2px',
  },
  twoColLayout: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '24px',
  },
  tasksSection: {
    padding: '24px',
  },
  quickAccessCard: {
    padding: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
  },
  sectionHeading: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  viewAllBtn: {
    background: 'transparent',
    border: 'none',
    color: '#e7d7be',
    fontSize: '12.5px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  taskCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(46, 125, 96, 0.18)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  taskLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: 0,
  },
  taskIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  taskDesc: {
    fontSize: '12px',
    color: '#8da498',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '380px',
  },
  taskRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quickAccessList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  quickAccessItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(46, 125, 96, 0.18)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  quickIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickTextBlock: {
    flex: 1,
  },
  quickTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  quickDesc: {
    fontSize: '11.5px',
    color: '#8da498',
    marginTop: '2px',
  },
};
