import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Edit2, FileText, Loader2, MoreVertical, Power, Search, Tag,
  UserPlus, UsersRound, X,
} from 'lucide-react';
import { authApi, EmployeeSummary } from '../services/authApi';
import {
  AssignedTask, TaskDefinition, TaskDefinitionInput, TaskProgress, taskApi,
} from '../services/taskApi';
import { useApp } from '../context/AppContext';

const emptyForm: TaskDefinitionInput & { departmentId: string } = {
  title: '', description: '', departmentId: '', required: true, estimatedMinutes: 15,
};

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="p-4"><div className="h-4 bg-emerald-900/40 rounded w-52 mb-2" /><div className="h-3 bg-emerald-900/25 rounded w-72" /></td>
    <td className="p-4"><div className="h-3 bg-emerald-900/30 rounded w-24" /></td>
    <td className="p-4"><div className="h-3 bg-emerald-900/30 rounded w-14" /></td>
    <td className="p-4"><div className="h-6 bg-emerald-900/30 rounded-full w-20" /></td>
    <td className="p-4"><div className="h-3 bg-emerald-900/30 rounded w-8" /></td>
    <td className="p-4"><div className="h-6 bg-emerald-900/30 rounded-full w-16" /></td>
    <td className="p-4"><div className="h-7 bg-emerald-900/30 rounded w-7 ml-auto" /></td>
  </tr>
);

const MetricCard: React.FC<{
  icon: React.ReactNode; value: string | number; label: string; tone: 'green' | 'gold' | 'blue' | 'muted';
}> = ({ icon, value, label, tone }) => (
  <div className={`task-metric-card task-metric-${tone}`}>
    <div className="task-metric-icon">{icon}</div>
    <div className="min-w-0">
      <div className="task-metric-value">{value}</div>
      <div className="task-metric-label">{label}</div>
    </div>
  </div>
);

export const TaskManagementPage: React.FC = () => {
  const { addToast, setCurrentPage } = useApp();
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'required' | 'optional'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [editing, setEditing] = useState<TaskDefinition | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<TaskDefinition | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigningOne, setAssigningOne] = useState(false);
  const [assigningBulk, setAssigningBulk] = useState(false);
  const [progressEmployee, setProgressEmployee] = useState('');
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<AssignedTask[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const showError = (error: unknown) =>
    addToast(error instanceof Error ? error.message : 'Unable to load task data', 'error');

  useEffect(() => {
    setLoading(true);
    taskApi.listDefinitions('?active=true')
      .then(setTasks)
      .catch(showError)
      .finally(() => setLoading(false));
    authApi.employees()
      .then(setEmployees)
      .catch(showError)
      .finally(() => setLoadingEmployees(false));
  }, []);

  const departments = useMemo(
    () => [...new Set(tasks.map((task) => task.department?.name).filter(Boolean))] as string[],
    [tasks],
  );

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (!departmentFilter || task.department?.name === departmentFilter)
      && (typeFilter === 'all' || (typeFilter === 'required' ? task.required : !task.required));
  }), [tasks, search, departmentFilter, typeFilter]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = tasks.filter((task) => task.isActive).length;
  const requiredCount = tasks.filter((task) => task.required).length;
  const activeEmployees = employees.filter((employee) => employee.isActive).length;

  useEffect(() => {
    setPage(1);
  }, [search, departmentFilter, typeFilter]);

  const openEdit = async (task: TaskDefinition) => {
    try {
      const current = await taskApi.getDefinition(task.id);
      setEditing(current);
      setForm({
        title: current.title,
        description: current.description || '',
        departmentId: current.departmentId || '',
        required: current.required,
        estimatedMinutes: current.estimatedMinutes,
      });
    } catch (error) {
      showError(error);
    }
  };

  const submitTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormSubmitting(true);
    try {
      const saved = await taskApi.updateDefinition(editing!.id, {
        ...form, departmentId: form.departmentId || null,
      });
      setTasks((current) => current.map((task) => task.id === saved.id ? saved : task));
      setEditing(null);
      addToast('Task definition updated', 'success');
    } catch (error) {
      showError(error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const deactivate = async (task: TaskDefinition) => {
    setDeactivatingId(task.id);
    try {
      const updated = await taskApi.deactivateDefinition(task.id);
      setTasks((current) => current.filter((item) => item.id !== updated.id));
      addToast('Task deactivated', 'success');
    } catch (error) {
      showError(error);
    } finally {
      setDeactivatingId(null);
    }
  };

  const assignTask = async () => {
    if (!selected || !employeeId) return;
    setAssigningOne(true);
    try {
      const assignment = await taskApi.assign(selected.id, employeeId, dueDate || undefined);
      setEmployeeTasks((current) => [assignment, ...current]);
      setEmployeeId('');
      addToast('Task assigned successfully', 'success');
    } catch (error) {
      showError(error);
    } finally {
      setAssigningOne(false);
    }
  };

  const assignBulk = async () => {
    if (!selected) return;
    const ids = bulkEmployeeIds.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean);
    if (!ids.length) return;
    setAssigningBulk(true);
    try {
      const result = await taskApi.assignBulk(selected.id, ids, dueDate || undefined);
      addToast(`${result.assigned.length} task(s) assigned; ${result.failed.length} failed`, result.failed.length ? 'warning' : 'success');
      setBulkEmployeeIds('');
    } catch (error) {
      showError(error);
    } finally {
      setAssigningBulk(false);
    }
  };

  const loadEmployeeData = async () => {
    if (!progressEmployee.trim()) return;
    setLoadingProgress(true);
    try {
      const [nextProgress, nextTasks] = await Promise.all([
        taskApi.getEmployeeProgress(progressEmployee.trim()),
        taskApi.getEmployeeTasks(progressEmployee.trim()),
      ]);
      setProgress(nextProgress);
      setEmployeeTasks(nextTasks);
    } catch (error) {
      showError(error);
    } finally {
      setLoadingProgress(false);
    }
  };

  return (
    <div className="page-container task-admin-page">
      <div className="task-breadcrumb">HR Admin <span>/</span> Onboarding</div>
      <div className="task-admin-header">
        <div>
          <h1>Onboarding tasks</h1>
          <p>Create reusable tasks and track new-hire readiness.</p>
        </div>
        <button className="btn-primary" onClick={() => setCurrentPage('task-create')}>
          <span className="text-lg leading-none">+</span> Create task
        </button>
      </div>

      <div className="task-metrics-grid">
        <MetricCard icon={<FileText size={20} />} value={loading ? '—' : activeCount} label="Active tasks" tone="green" />
        <MetricCard icon={<Tag size={20} />} value={loading ? '—' : requiredCount} label="Required" tone="gold" />
        <MetricCard icon={<UsersRound size={20} />} value={loadingEmployees ? '—' : activeEmployees} label="Active employees" tone="blue" />
        <MetricCard icon={<BarChart3 size={20} />} value="—" label="Completion rate" tone="muted" />
      </div>

      <div className="task-filter-bar">
        <div className="task-filter-search">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." />
        </div>
        <label className="task-filter-select">
          <FileText size={15} />
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <ChevronDown size={14} />
        </label>
        <label className="task-filter-select">
          <Tag size={15} />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
            <option value="all">All types</option>
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
          <ChevronDown size={14} />
        </label>
        <div className="task-view-toggle">
          <button className="active"><FileText size={14} /> Table</button>
          <button disabled><Calendar size={14} /> Calendar</button>
        </div>
      </div>

      <div className="task-table-card">
        <div className="overflow-x-auto">
          <table className="task-data-table">
            <thead>
              <tr>
                <th className="task-check-cell"><input type="checkbox" aria-label="Select all tasks" disabled /></th>
                <th>Task</th><th>Department</th><th>Duration</th><th>Requirement</th><th>Assigned</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />) : pagedTasks.map((task) => (
                <tr key={task.id}>
                  <td className="task-check-cell"><input type="checkbox" aria-label={`Select ${task.title}`} /></td>
                  <td>
                    <div className="task-name-cell">
                      <span className="task-row-icon"><FileText size={16} /></span>
                      <span><strong>{task.title}</strong><small>{task.description || 'No description provided'}</small></span>
                    </div>
                  </td>
                  <td><span className="task-muted-cell">{task.department?.name || 'All departments'}</span></td>
                  <td><span className="task-muted-cell"><Clock3 size={14} /> {task.estimatedMinutes} min</span></td>
                  <td><span className={`task-requirement ${task.required ? 'required' : 'optional'}`}>{task.required ? 'Required' : 'Optional'}</span></td>
                  <td><span className="task-muted-cell"><UsersRound size={14} /> —</span></td>
                  <td><span className="task-status active"><span /> Active</span></td>
                  <td>
                    <div className="task-action-cell">
                      <button title="Edit task" onClick={() => void openEdit(task)}><Edit2 size={15} /></button>
                      <button title="Assign task" onClick={() => setSelected(task)}><UserPlus size={15} /></button>
                      <button title="More actions" onClick={() => void deactivate(task)} disabled={deactivatingId === task.id}>
                        {deactivatingId === task.id ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && pagedTasks.length === 0 && (
            <div className="task-empty-state"><FileText size={28} /><p>No tasks match your filters.</p></div>
          )}
        </div>
        <div className="task-table-footer">
          <span>Showing {filteredTasks.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredTasks.length)} of {filteredTasks.length} tasks</span>
          <div className="task-pagination">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => (
              <button key={number} className={page === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>
            ))}
            <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {editing && (
        <form className="task-edit-panel" onSubmit={(event) => void submitTask(event)}>
          <div className="task-panel-heading"><div><strong>Edit task</strong><span>Update the reusable task definition.</span></div><button type="button" onClick={() => setEditing(null)}><X size={16} /></button></div>
          <div className="task-edit-grid">
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Task title" />
            <input required type="number" min="1" value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} placeholder="Minutes" />
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" />
            <label><input type="checkbox" checked={form.required} onChange={(event) => setForm({ ...form, required: event.target.checked })} /> Required task</label>
          </div>
          <div className="task-panel-actions"><button className="btn-primary" disabled={formSubmitting}>{formSubmitting && <Loader2 size={14} className="animate-spin" />} Save changes</button><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>
      )}

      {selected && (
        <div className="task-assignment-panel">
          <div className="task-panel-heading">
            <div><strong>Assign “{selected.title}”</strong><span>Choose an active employee or assign to multiple employee IDs.</span></div>
            <button type="button" onClick={() => setSelected(null)}><X size={16} /></button>
          </div>
          <div className="task-assignment-grid">
            <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} disabled={loadingEmployees}><option value="">{loadingEmployees ? 'Loading employees…' : 'Select an employee'}</option>{employees.filter((employee) => employee.isActive).map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.email}</option>)}</select>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <button className="btn-primary" onClick={() => void assignTask()} disabled={assigningOne || !employeeId}>{assigningOne && <Loader2 size={14} className="animate-spin" />} Assign task</button>
          </div>
          <div className="task-bulk-row"><textarea value={bulkEmployeeIds} onChange={(event) => setBulkEmployeeIds(event.target.value)} placeholder="Bulk assignment: employee IDs separated by commas or spaces" /><button className="btn-secondary" onClick={() => void assignBulk()} disabled={assigningBulk}>{assigningBulk && <Loader2 size={14} className="animate-spin" />} Assign bulk</button></div>
        </div>
      )}

      <div className="task-progress-card">
        <div className="task-progress-copy"><div className="task-progress-icon"><BarChart3 size={20} /></div><div><strong>Employee progress lookup</strong><span>Search an employee to view their onboarding task progress and completion status.</span></div></div>
        <div className="task-progress-form"><Search size={16} /><input value={progressEmployee} onChange={(event) => setProgressEmployee(event.target.value)} placeholder="Search by employee name or ID..." /><button className="btn-primary" onClick={() => void loadEmployeeData()} disabled={loadingProgress || !progressEmployee.trim()}>{loadingProgress && <Loader2 size={14} className="animate-spin" />} View progress</button></div>
        {progress && !loadingProgress && <div className="task-progress-results"><span>{progress.completed}/{progress.total} completed</span><span>{progress.overdue} overdue</span><span>{employeeTasks.length} assignments loaded</span></div>}
      </div>
    </div>
  );
};
