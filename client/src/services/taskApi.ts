import { apiRequest } from './apiClient';

export interface AssignedTask {
  assignmentId: string;
  employeeId?: string;
  taskId: string;
  title: string;
  description: string | null;
  required: boolean;
  estimatedMinutes: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedAt: string;
  dueDate: string | null;
  completedAt: string | null;
}

export interface TaskProgress {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  requiredCompleted: number;
  totalRequired: number;
  completionPercentage: number;
  requiredCompletionPercentage: number;
}

export interface TaskDefinition {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  required: boolean;
  estimatedMinutes: number;
  isActive: boolean;
  createdAt: string;
  department: { id: string; name: string } | null;
}

export interface TaskDefinitionInput {
  title: string;
  description?: string;
  departmentId?: string | null;
  required: boolean;
  estimatedMinutes: number;
}

export const taskApi = {
  getMyTasks: () => apiRequest<AssignedTask[]>('/tasks/my-tasks'),
  getMyTasksByStatus: (status: AssignedTask['status']) =>
    apiRequest<AssignedTask[]>(`/tasks/my-tasks?status=${status}`),
  getMyProgress: () => apiRequest<TaskProgress>('/tasks/my-progress'),
  getMyTask: (assignmentId: string) => apiRequest<AssignedTask>(`/tasks/my-tasks/${assignmentId}`),
  startTask: (assignmentId: string) =>
    apiRequest<AssignedTask>(`/tasks/my-tasks/${assignmentId}/start`, { method: 'PATCH' }),
  completeTask: (assignmentId: string) =>
    apiRequest<AssignedTask>(`/tasks/my-tasks/${assignmentId}/complete`, { method: 'PATCH' }),
  listDefinitions: (params = '') => apiRequest<TaskDefinition[]>(`/tasks${params}`),
  getDefinition: (taskId: string) => apiRequest<TaskDefinition>(`/tasks/${taskId}`),
  createDefinition: (input: TaskDefinitionInput) =>
    apiRequest<TaskDefinition>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateDefinition: (taskId: string, input: Partial<TaskDefinitionInput>) =>
    apiRequest<TaskDefinition>(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(input) }),
  deactivateDefinition: (taskId: string) =>
    apiRequest<TaskDefinition>(`/tasks/${taskId}/deactivate`, { method: 'PATCH' }),
  assign: (taskId: string, employeeId: string, dueDate?: string) =>
    apiRequest<AssignedTask>(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ employeeId, dueDate: dueDate || undefined }),
    }),
  assignBulk: (taskId: string, employeeIds: string[], dueDate?: string) =>
    apiRequest<{ assigned: AssignedTask[]; failed: { employeeId: string; message: string }[] }>(
      `/tasks/${taskId}/assign-bulk`,
      { method: 'POST', body: JSON.stringify({ employeeIds, dueDate: dueDate || undefined }) },
    ),
  getEmployeeTasks: (employeeId: string, status = '') =>
    apiRequest<AssignedTask[]>(
      `/tasks/admin/employees/${employeeId}/tasks${status ? `?status=${status}` : ''}`,
    ),
  getEmployeeProgress: (employeeId: string) =>
    apiRequest<TaskProgress>(`/tasks/admin/employees/${employeeId}/progress`),
};
