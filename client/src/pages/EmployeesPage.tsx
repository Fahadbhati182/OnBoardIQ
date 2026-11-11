import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MoreVertical,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  CreateEmployeeInput,
  EmployeeSummary,
  TeamSummary,
  authApi,
} from "../services/authApi";
import {
  AssignedTask,
  TaskDefinition,
  TaskProgress,
  taskApi,
} from "../services/taskApi";
import { useApp } from "../context/AppContext";

const EmployeeSkeleton: React.FC = () => (
  <tr className="animate-pulse">
    <td className="employee-check-cell">
      <div className="employee-skeleton-dot" />
    </td>
    <td>
      <div className="employee-skeleton-line wide" />
      <div className="employee-skeleton-line" />
    </td>
    <td>
      <div className="employee-skeleton-line" />
    </td>
    <td>
      <div className="employee-skeleton-progress" />
    </td>
    <td>
      <div className="employee-skeleton-pill" />
    </td>
    <td>
      <div className="employee-skeleton-dot" />
    </td>
  </tr>
);

const MetricCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tone: string;
}> = ({ icon, value, label, tone }) => (
  <div className={`employee-metric-card employee-metric-${tone}`}>
    <div className="employee-metric-icon">{icon}</div>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

const emptyEmployeeForm: CreateEmployeeInput = {
  name: "",
  email: "",
  jobTitle: "",
  joiningDate: null,
  teamId: null,
  isActive: true,
};

export const EmployeesPage: React.FC = () => {
  const { addToast, currentUserRole } = useApp();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [availableTasks, setAvailableTasks] = useState<TaskDefinition[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [createOptionsLoading, setCreateOptionsLoading] = useState(false);
  const [createEmployeeLoading, setCreateEmployeeLoading] = useState(false);
  const [progressByEmployee, setProgressByEmployee] = useState<
    Record<string, TaskProgress>
  >({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSummary | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignments, setAssignments] = useState<AssignedTask[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [availableTasksError, setAvailableTasksError] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [openingEmployeeId, setOpeningEmployeeId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    authApi
      .employees()
      .then((employeeList) => {
        setEmployees(employeeList);
        setProgressLoading(true);
        return Promise.all(
          employeeList.map(async (employee) => {
            try {
              return [
                employee.id,
                await taskApi.getEmployeeProgress(employee.id),
              ] as const;
            } catch {
              return [employee.id, null] as const;
            }
          }),
        );
      })
      .then((results) => {
        if (!results) return;
        const nextProgress: Record<string, TaskProgress> = {};
        results.forEach(([employeeId, employeeProgress]) => {
          if (employeeProgress) nextProgress[employeeId] = employeeProgress;
        });
        setProgressByEmployee(nextProgress);
      })
      .catch((error: unknown) =>
        addToast(
          error instanceof Error ? error.message : "Unable to load employees",
          "error",
        ),
      )
      .finally(() => {
        setLoading(false);
        setProgressLoading(false);
      });
  }, []);

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          `${employee.name} ${employee.email}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (statusFilter === "all" ||
            (statusFilter === "active"
              ? employee.isActive
              : !employee.isActive)),
      ),
    [employees, search, statusFilter],
  );
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pagedEmployees = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const activeCount = employees.filter((employee) => employee.isActive).length;
  const inactiveCount = employees.length - activeCount;

  useEffect(() => setPage(1), [search, statusFilter]);

  const openCreateForm = async () => {
    setEmployeeForm(emptyEmployeeForm);
    setCreateFormOpen(true);
    setCreateOptionsLoading(true);
    try {
      setTeams(await authApi.teams());
    } catch (error) {
      setCreateFormOpen(false);
      addToast(
        error instanceof Error
          ? error.message
          : "Unable to load teams",
        "error",
      );
    } finally {
      setCreateOptionsLoading(false);
    }
  };

  const createEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateEmployeeLoading(true);
    try {
      const employee = await authApi.createEmployee({
        ...employeeForm,
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim(),
      });
      setEmployees((current) =>
        [...current, employee].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCreateFormOpen(false);
      addToast(
        employee.inviteEmailSent
          ? `Employee ${employee.name} created; setup email sent`
          : `Employee ${employee.name} created, but the setup email could not be sent`,
        employee.inviteEmailSent ? "success" : "error",
      );
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Unable to create employee",
        "error",
      );
    } finally {
      setCreateEmployeeLoading(false);
    }
  };

  const openAssignments = async (employee: EmployeeSummary) => {
    setOpeningEmployeeId(employee.id);
    setSelectedEmployee(employee);
    setAssignments([]);
    setAvailableTasks([]);
    setAvailableTasksError("");
    setSelectedTaskId("");
    setDueDate("");
    setAssignmentsLoading(true);
    try {
      const [employeeAssignments, unassignedTasks] = await Promise.all([
        taskApi.getEmployeeTasks(employee.id),
        taskApi.getAvailableTasksForEmployee(employee.id),
      ]);
      setAssignments(employeeAssignments);
      setAvailableTasks(unassignedTasks);
    } catch (error) {
      setAvailableTasks([]);
      setAvailableTasksError(
        error instanceof Error ? error.message : "Unable to load available tasks",
      );
      addToast(
        error instanceof Error
          ? error.message
          : "Unable to load employee tasks",
        "error",
      );
    } finally {
      setOpeningEmployeeId(null);
      setAssignmentsLoading(false);
    }
  };

  const assignTask = async () => {
    if (!selectedEmployee || !selectedTaskId) return;
    setAssignLoading(true);
    try {
      const assignment = await taskApi.assign(
        selectedTaskId,
        selectedEmployee.id,
        dueDate || undefined,
      );
      setAssignments((current) => [assignment, ...current]);
      setAvailableTasks((current) =>
        current.filter((task) => task.id !== assignment.taskId),
      );
      setSelectedTaskId("");
      addToast(`Task assigned to ${selectedEmployee.name}`, "success");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Unable to assign task",
        "error",
      );
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="page-container employees-page">
      <div className="employee-breadcrumb">
        HR Admin <span>/</span> People
      </div>
      <div className="employee-page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employee profiles, onboarding assignments, and progress.</p>
        </div>
        {currentUserRole === "engineering_admin" && (
          <button
            className="btn-primary employee-add-button"
            onClick={() => void openCreateForm()}
            disabled={createOptionsLoading}
          >
            {createOptionsLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <span className="text-lg">+</span>
            )}
            Add employee
          </button>
        )}
      </div>

      {createFormOpen && currentUserRole === "engineering_admin" && (
        <section className="employee-assignment-panel employee-create-panel">
          <div className="employee-panel-heading">
            <div>
              <strong>Add an employee</strong>
              <span>
                Add their profile and they will receive a secure password setup link.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCreateFormOpen(false)}
              aria-label="Close employee form"
            >
              <X size={16} />
            </button>
          </div>
          <form
            className="task-create-form employee-create-form"
            onSubmit={(event) => void createEmployee(event)}
          >
            <label className="task-create-field">
              <span>
                Full name <b>*</b>
              </span>
              <input
                required
                maxLength={150}
                autoComplete="name"
                value={employeeForm.name}
                onChange={(event) =>
                  setEmployeeForm({ ...employeeForm, name: event.target.value })
                }
              />
            </label>
            <label className="task-create-field">
              <span>
                Email address <b>*</b>
              </span>
              <input
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                value={employeeForm.email}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    email: event.target.value,
                  })
                }
              />
            </label>
            <label className="task-create-field">
              <span>Job title</span>
              <input
                maxLength={150}
                value={employeeForm.jobTitle}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    jobTitle: event.target.value,
                  })
                }
              />
            </label>
            <label className="task-create-field">
              <span>Joining date</span>
              <input
                type="date"
                value={employeeForm.joiningDate || ""}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    joiningDate: event.target.value || null,
                  })
                }
              />
            </label>
     <label className="task-create-field">
              <span>Team</span>
              <select
                value={employeeForm.teamId || ""}
                disabled={createOptionsLoading}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    teamId: event.target.value || null,
                  })
                }
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="task-create-required">
              <input
                type="checkbox"
                checked={employeeForm.isActive}
                onChange={(event) =>
                  setEmployeeForm({
                    ...employeeForm,
                    isActive: event.target.checked,
                  })
                }
              />
              <span className="task-create-check">
                <CheckCircle2 size={14} />
              </span>
              <span>
                <strong>Active account</strong>
                <small>Inactive employees cannot sign in.</small>
              </span>
            </label>
            <div className="task-create-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCreateFormOpen(false)}
                disabled={createEmployeeLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createEmployeeLoading || createOptionsLoading}
              >
                {createEmployeeLoading && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {createEmployeeLoading
                  ? "Creating employee..."
                  : "Create employee"}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="employee-metrics-grid">
        <MetricCard
          icon={<Users size={21} />}
          value={loading ? "—" : employees.length}
          label="Total employees"
          tone="green"
        />
        <MetricCard
          icon={<CheckCircle2 size={21} />}
          value={loading ? "—" : activeCount}
          label="Active employees"
          tone="blue"
        />
        <MetricCard
          icon={<Clock3 size={21} />}
          value={loading ? "—" : inactiveCount}
          label="Inactive / Pending"
          tone="gold"
        />
      </div>

      <div className="employee-table-card">
        <div className="employee-table-heading">
          <div className="employee-section-title">
            <div>
              <Users size={19} />
            </div>
            <span>
              <strong>Employees</strong>
              <small>
                View and manage all employees and their onboarding progress.
              </small>
            </span>
          </div>
          <div className="employee-filters">
            <label className="employee-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
              />
            </label>

            <label className="employee-select">
              <CheckCircle2 size={14} />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
                }
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive / Pending</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="employee-data-table">
            <thead>
              <tr>
                <th className="employee-check-cell">
                  <input
                    type="checkbox"
                    disabled
                    aria-label="Select all employees"
                  />
                </th>
                <th>Employee</th>
                <th>Job title</th>
                <th>Onboarding progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <EmployeeSkeleton key={index} />
                  ))
                : pagedEmployees.map((employee) => {
                    const progress = progressByEmployee[employee.id];
                    const percentage = progress?.completionPercentage;
                    return (
                      <tr key={employee.id}>
                        <td className="employee-check-cell">
                          <input
                            type="checkbox"
                            aria-label={`Select ${employee.name}`}
                          />
                        </td>
                        <td>
                          <div className="employee-name-cell">
                            <span className="employee-avatar">
                              {employee.name
                                .split(/\s+/)
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                            <span>
                              <strong>{employee.name}</strong>
                              <small>{employee.email}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="employee-muted">
                            {employee.jobTitle ||
                              employee.role.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <div className="employee-progress-cell">
                            {progressLoading && !progress ? (
                              <span className="employee-progress-loading" />
                            ) : (
                              <>
                                <div className="employee-progress-track">
                                  <span
                                    style={{ width: `${percentage || 0}%` }}
                                  />
                                </div>
                                <em>
                                  {percentage === undefined
                                    ? "—"
                                    : `${percentage}%`}
                                </em>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`employee-status ${employee.isActive ? "active" : "pending"}`}
                          >
                            <span />
                            {employee.isActive ? "Active" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="employee-actions">
                            <button
                              title="Assign onboarding task"
                              onClick={() => void openAssignments(employee)}
                              disabled={
                                openingEmployeeId !== null || !employee.isActive
                              }
                            >
                              {openingEmployeeId === employee.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <UserPlus size={15} />
                              )}
                            </button>
                            <button title="More actions" disabled>
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && pagedEmployees.length === 0 && (
            <div className="employee-empty">
              No employees match your filters.
            </div>
          )}
        </div>
        <div className="employee-table-footer">
          <span>
            Showing {filteredEmployees.length ? (page - 1) * pageSize + 1 : 0}{" "}
            to {Math.min(page * pageSize, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} employees
          </span>
          <div className="employee-pagination">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .slice(0, 5)
              .map((number) => (
                <button
                  key={number}
                  className={page === number ? "active" : ""}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
            <button
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={page === pageCount}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {selectedEmployee && (
        <section className="employee-assignment-panel">
          <div className="employee-panel-heading">
            <div>
              <strong>Onboarding tasks</strong>
              <span>Assign an unassigned task to {selectedEmployee.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEmployee(null)}
              aria-label="Close task assignments"
            >
              <X size={17} />
            </button>
          </div>
          <div className="employee-assignment-form">
            <label>
              <span>Available task</span>
              <select
                value={selectedTaskId}
                onChange={(event) => setSelectedTaskId(event.target.value)}
                disabled={assignmentsLoading || availableTasks.length === 0}
              >
                <option value="">
                  {assignmentsLoading
                    ? "Loading available tasks..."
                    : availableTasksError
                      ? "Could not load available tasks"
                      : availableTasks.length
                        ? "Select an unassigned task..."
                        : "No unassigned tasks available"}
                </option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                Due date <small>(optional)</small>
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
            <button
              className="btn-primary"
              disabled={
                assignLoading || assignmentsLoading || !selectedTaskId
              }
              onClick={() => void assignTask()}
            >
              {assignLoading && <Loader2 size={14} className="animate-spin" />}{" "}
              Assign task
            </button>
          </div>
          {availableTasksError && (
            <p className="employee-assignment-error">{availableTasksError}</p>
          )}
          <div className="employee-assignment-list-heading">
            <strong>Assigned tasks</strong>
            <span>{assignments.length}</span>
          </div>
          {assignmentsLoading ? (
            <div className="employee-assignment-loading">
              Loading assignments...
            </div>
          ) : (
            <div className="employee-assignment-list">
              {assignments.length ? (
                assignments.map((assignment) => (
                  <div
                    className="employee-assignment-item"
                    key={assignment.assignmentId}
                  >
                    <span>
                      <strong>{assignment.title}</strong>
                      <small>
                        {assignment.dueDate
                          ? `Due ${new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString()}`
                          : "No due date"}
                      </small>
                    </span>
                    <em
                      className={`employee-assignment-status ${assignment.status.toLowerCase()}`}
                    >
                      {assignment.status.replace("_", " ")}
                    </em>
                  </div>
                ))
              ) : (
                <p className="employee-assignment-empty">
                  No tasks assigned to this employee yet.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <div className="employee-insight-card">
        <div className="employee-insight-icon">
          <BarChartIcon />
        </div>
        <div className="employee-insight-copy">
          <strong>Quick insight</strong>
          <span>
            {loading
              ? "Loading employee insights..."
              : progressLoading
                ? "Loading onboarding progress..."
                : "Onboarding progress is available per employee above."}
          </span>
          <small>
            {employees.length
              ? `${activeCount} active of ${employees.length} employees`
              : "No employee data available"}
          </small>
        </div>
        <div className="employee-insight-chart">
          {[18, 30, 23, 40, 28].map((height, index) => (
            <i key={index} style={{ height: `${height}px` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

const BarChartIcon: React.FC = () => (
  <span className="bar-chart-icon">
    <i />
    <i />
    <i />
    <i />
  </span>
);
