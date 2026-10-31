import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Loader2, MoreVertical, Search, UserPlus, Users, X,
} from 'lucide-react';
import { EmployeeSummary, authApi } from '../services/authApi';
import { AssignedTask, TaskDefinition, TaskProgress, taskApi } from '../services/taskApi';
import { useApp } from '../context/AppContext';

const EmployeeSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="employee-check-cell"><div className="employee-skeleton-dot" /></td>
    <td><div className="employee-skeleton-line wide" /><div className="employee-skeleton-line" /></td>
    <td><div className="employee-skeleton-line" /></td>
    <td><div className="employee-skeleton-line" /></td>
    <td><div className="employee-skeleton-progress" /></td>
    <td><div className="employee-skeleton-pill" /></td>
    <td><div className="employee-skeleton-dot" /></td>
  </tr>
);

const MetricCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; tone: string }> = ({
  icon, value, label, tone,
}) => (
  <div className={`employee-metric-card employee-metric-${tone}`}>
    <div className="employee-metric-icon">{icon}</div>
    <div><strong>{value}</strong><span>{label}</span></div>
  </div>
);

export const EmployeesPage: React.FC = () => {
  const { addToast } = useApp();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [progressByEmployee, setProgressByEmployee] = useState<Record<string, TaskProgress>>({});
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignments, setAssignments] = useState<AssignedTask[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [openingEmployeeId, setOpeningEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([authApi.employees(), taskApi.listDefinitions('?active=true')])
      .then(([employeeList, taskList]) => {
        setEmployees(employeeList);
        setTasks(taskList);
        setProgressLoading(true);
        return Promise.all(employeeList.map(async (employee) => {
          try {
            return [employee.id, await taskApi.getEmployeeProgress(employee.id)] as const;
          } catch {
            return [employee.id, null] as const;
          }
        }));
      })
      .then((results) => {
        if (!results) return;
        const nextProgress: Record<string, TaskProgress> = {};
        results.forEach(([employeeId, employeeProgress]) => {
          if (employeeProgress) nextProgress[employeeId] = employeeProgress;
        });
        setProgressByEmployee(nextProgress);
      })
      .catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Unable to load employees', 'error'))
      .finally(() => {
        setLoading(false);
        setProgressLoading(false);
      });
  }, []);

  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.departmentId).filter(Boolean))] as string[],
    [employees],
  );
  const filteredEmployees = useMemo(() => employees.filter((employee) => (
    `${employee.name} ${employee.email} ${employee.departmentId || ''}`.toLowerCase().includes(search.toLowerCase())
    && (!departmentFilter || employee.departmentId === departmentFilter)
    && (statusFilter === 'all' || (statusFilter === 'active' ? employee.isActive : !employee.isActive))
  )), [employees, search, departmentFilter, statusFilter]);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pagedEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = employees.filter((employee) => employee.isActive).length;
  const inactiveCount = employees.length - activeCount;

  useEffect(() => setPage(1), [search, departmentFilter, statusFilter]);

  const openAssignments = async (employee: EmployeeSummary) => {
    setOpeningEmployeeId(employee.id);
    setSelectedEmployee(employee);
    setAssignments([]);
    setSelectedTaskId('');
    setDueDate('');
    setAssignmentsLoading(true);
    try {
      setAssignments(await taskApi.getEmployeeTasks(employee.id));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to load employee tasks', 'error');
    } finally {
      setOpeningEmployeeId(null);
      setAssignmentsLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedEmployee || !selectedTaskId) return;
    setAssignLoading(true);
    try {
      const assignment = await taskApi.assign(selectedTaskId, selectedEmployee.id, dueDate || undefined);
      setAssignments((current) => [assignment, ...current]);
      setSelectedTaskId('');
      addToast(`Task assigned to ${selectedEmployee.name}`, 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to assign task', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="page-container employees-page">
      <div className="employee-breadcrumb">HR Admin <span>/</span> People</div>
      <div className="employee-page-header">
        <div><h1>Employees</h1><p>Manage employee profiles, onboarding assignments, and progress.</p></div>
        <button className="btn-primary employee-add-button" disabled><span className="text-lg">+</span> Add employee</button>
      </div>

      <div className="employee-metrics-grid">
        <MetricCard icon={<Users size={21} />} value={loading ? '—' : employees.length} label="Total employees" tone="green" />
        <MetricCard icon={<CheckCircle2 size={21} />} value={loading ? '—' : activeCount} label="Active employees" tone="blue" />
        <MetricCard icon={<Clock3 size={21} />} value={loading ? '—' : inactiveCount} label="Inactive / Pending" tone="gold" />
      </div>

      <div className="employee-table-card">
        <div className="employee-table-heading">
          <div className="employee-section-title"><div><Users size={19} /></div><span><strong>Employees</strong><small>View and manage all employees and their onboarding progress.</small></span></div>
          <div className="employee-filters">
            <label className="employee-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or department..." /></label>
            <label className="employee-select"><Building2 size={14} /><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="">All departments</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select><ChevronDown size={13} /></label>
            <label className="employee-select"><CheckCircle2 size={14} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive / Pending</option></select><ChevronDown size={13} /></label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="employee-data-table">
            <thead><tr><th className="employee-check-cell"><input type="checkbox" disabled aria-label="Select all employees" /></th><th>Employee</th><th>Department</th><th>Job title</th><th>Onboarding progress</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, index) => <EmployeeSkeleton key={index} />) : pagedEmployees.map((employee) => {
                const progress = progressByEmployee[employee.id];
                const percentage = progress?.completionPercentage;
                return (
                  <tr key={employee.id}>
                    <td className="employee-check-cell"><input type="checkbox" aria-label={`Select ${employee.name}`} /></td>
                    <td><div className="employee-name-cell"><span className="employee-avatar">{employee.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong>{employee.name}</strong><small>{employee.email}</small></span></div></td>
                    <td><span className="employee-department"><Building2 size={14} />{employee.departmentId || 'No department'}</span></td>
                    <td><span className="employee-muted">{employee.role.replace('_', ' ')}</span></td>
                    <td><div className="employee-progress-cell">{progressLoading && !progress ? <span className="employee-progress-loading" /> : <><div className="employee-progress-track"><span style={{ width: `${percentage || 0}%` }} /></div><em>{percentage === undefined ? '—' : `${percentage}%`}</em></>}</div></td>
                    <td><span className={`employee-status ${employee.isActive ? 'active' : 'pending'}`}><span />{employee.isActive ? 'Active' : 'Pending'}</span></td>
                    <td><div className="employee-actions"><button title="Assign onboarding task" onClick={() => void openAssignments(employee)} disabled={openingEmployeeId !== null || !employee.isActive}>{openingEmployeeId === employee.id ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}</button><button title="More actions" disabled><MoreVertical size={16} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && pagedEmployees.length === 0 && <div className="employee-empty">No employees match your filters.</div>}
        </div>
        <div className="employee-table-footer"><span>Showing {filteredEmployees.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredEmployees.length)} of {filteredEmployees.length} employees</span><div className="employee-pagination"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft size={15} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => <button key={number} className={page === number ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>)}<button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}><ChevronRight size={15} /></button></div></div>
      </div>

      {selectedEmployee && <div className="employee-assignment-panel"><div className="employee-panel-heading"><div><strong>Assign task to {selectedEmployee.name}</strong><span>{selectedEmployee.email}</span></div><button onClick={() => setSelectedEmployee(null)}><X size={16} /></button></div><div className="employee-assignment-form"><select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}><option value="">Select a task...</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /><button className="btn-primary" disabled={assignLoading || !selectedTaskId} onClick={() => void assignTask()}>{assignLoading && <Loader2 size={14} className="animate-spin" />} Assign task</button></div>{assignmentsLoading ? <div className="employee-assignment-loading">Loading assignments...</div> : <div className="employee-assignment-list">{assignments.length ? assignments.map((assignment) => <span key={assignment.assignmentId}>{assignment.title}<em>{assignment.status.replace('_', ' ')}</em></span>) : <small>No tasks assigned yet.</small>}</div>}</div>}

      <div className="employee-insight-card"><div className="employee-insight-icon"><BarChartIcon /></div><div className="employee-insight-copy"><strong>Quick insight</strong><span>{loading ? 'Loading employee insights...' : progressLoading ? 'Loading onboarding progress...' : 'Onboarding progress is available per employee above.'}</span><small>{employees.length ? `${activeCount} active of ${employees.length} employees` : 'No employee data available'}</small></div><div className="employee-insight-chart">{[18, 30, 23, 40, 28].map((height, index) => <i key={index} style={{ height: `${height}px` }} />)}</div></div>
    </div>
  );
};

const BarChartIcon: React.FC = () => <span className="bar-chart-icon"><i /><i /><i /><i /></span>;
