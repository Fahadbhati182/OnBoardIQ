import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskStatus, TaskItem } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Check,
  Search,
} from 'lucide-react';

export const MyTasksPage: React.FC = () => {
  const { tasks, setActiveTaskModal } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all');
  const [taskSearch, setTaskSearch] = useState('');

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'not_started').length;
  const totalCount = tasks.length;
  const percentCompleted = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = activeFilter === 'all' || task.status === activeFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      task.description.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Header Row */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>My Tasks</h1>
          <p style={styles.pageSubtitle}>
            Complete these tasks to finish your onboarding journey.
          </p>
        </div>

        {/* Progress Metric Block */}
        <div style={styles.progressBlock}>
          <div style={styles.progressMeta}>
            <span style={styles.progressText}>
              {completedCount} of {totalCount} completed
            </span>
            <span style={styles.progressPercent}>{percentCompleted}%</span>
          </div>
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${percentCompleted}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div style={styles.filterBar}>
        <div style={styles.tabsRow}>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              ...styles.tabBtn,
              ...(activeFilter === 'all' ? styles.tabBtnActive : {}),
            }}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            style={{
              ...styles.tabBtn,
              ...(activeFilter === 'completed' ? styles.tabBtnActive : {}),
            }}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            style={{
              ...styles.tabBtn,
              ...(activeFilter === 'in_progress' ? styles.tabBtnActive : {}),
            }}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveFilter('not_started')}
            style={{
              ...styles.tabBtn,
              ...(activeFilter === 'not_started' ? styles.tabBtnActive : {}),
            }}
          >
            Pending ({pendingCount})
          </button>
        </div>

        <div style={styles.searchBox}>
          <Search size={14} style={{ color: '#64748b' }} />
          <input
            type="text"
            placeholder="Filter tasks..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            style={styles.searchBoxInput}
          />
        </div>
      </div>

      {/* Tasks List */}
      <div style={styles.taskListContainer}>
        {filteredTasks.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ color: '#8da498', fontSize: '14px' }}>No tasks found in this category.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            return (
              <div
                key={task.id}
                onClick={() => setActiveTaskModal(task)}
                className="glass-card"
                style={styles.taskItemCard}
              >
                {/* Thumbnail Image */}
                <div
                  style={{
                    ...styles.taskThumb,
                    backgroundImage: `url(${task.thumbnailUrl})`,
                  }}
                />

                {/* Status Indicator Icon */}
                <div
                  style={{
                    ...styles.statusIconCircle,
                    background: isCompleted
                      ? 'rgba(34, 197, 94, 0.2)'
                      : isInProgress
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(148, 163, 184, 0.15)',
                    color: isCompleted ? '#4ade80' : isInProgress ? '#fbbf24' : '#94a3b8',
                  }}
                >
                  {isCompleted ? <Check size={16} /> : isInProgress ? <Clock size={16} /> : <AlertCircle size={16} />}
                </div>

                {/* Content */}
                <div style={styles.taskContentBlock}>
                  <div style={styles.taskTitleRow}>
                    <h3 style={styles.taskTitleText}>{task.title}</h3>
                  </div>
                  <p style={styles.taskDescriptionText}>{task.description}</p>
                </div>

                {/* Time & Badge */}
                <div style={styles.taskMetaBlock}>
                  <div style={styles.timeTag}>
                    <Clock size={14} />
                    <span>{task.timeEstimate}</span>
                  </div>

                  <span
                    className={`status-pill ${
                      isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started'
                    }`}
                  >
                    {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                  </span>

                  <ChevronRight size={18} style={{ color: '#64748b' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: '#8da498',
    marginTop: '4px',
  },
  progressBlock: {
    minWidth: '240px',
    background: 'rgba(14, 33, 25, 0.85)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    borderRadius: '12px',
    padding: '12px 18px',
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressText: {
    fontSize: '12.5px',
    color: '#94a3b8',
  },
  progressPercent: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#4ade80',
  },
  progressBarTrack: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #e7d7be)',
    transition: 'width 0.4s ease',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tabsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tabBtn: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    borderRadius: '9999px',
    padding: '7px 16px',
    fontSize: '12.5px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: '#e7d7be',
    color: '#0d221a',
    borderColor: '#e7d7be',
    fontWeight: 700,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(10, 26, 19, 0.75)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    borderRadius: '9999px',
    padding: '0 14px',
    height: '36px',
    width: '200px',
  },
  searchBoxInput: {
    background: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
  },
  taskListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  taskItemCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    gap: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  taskThumb: {
    width: '68px',
    height: '52px',
    borderRadius: '10px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statusIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskContentBlock: {
    flex: 1,
    minWidth: 0,
  },
  taskTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  taskTitleText: {
    fontSize: '14.5px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  taskDescriptionText: {
    fontSize: '12.5px',
    color: '#8da498',
    marginTop: '3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '520px',
  },
  taskMetaBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexShrink: 0,
  },
  timeTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    fontSize: '12px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
  },
};
