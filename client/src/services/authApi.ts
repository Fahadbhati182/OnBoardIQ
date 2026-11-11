import { apiRequest } from './apiClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  jobTitle?: string | null;
  joiningDate?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  isActive?: boolean;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
  jobTitle: string | null;
  joiningDate: string | null;
  teamId: string | null;
  isActive: boolean;
  inviteEmailSent?: boolean;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  jobTitle: string;
  joiningDate: string | null;
  teamId: string | null;
  isActive: boolean;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  description: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  createEmployee: (employee: CreateEmployeeInput) =>
    apiRequest<EmployeeSummary>('/auth/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    }),
  me: () =>
    apiRequest<{ user: AuthUser }>('/auth/me', {
      headers: {
        Authorization: ['Bearer', localStorage.getItem('accessToken') || ''].join(' '),
      },
    }),
  updateProfile: (profile: { name: string; email: string }) =>
    apiRequest<{ user: AuthUser }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    }),
  employees: () => apiRequest<EmployeeSummary[]>('/auth/employees'),
  departments: () => apiRequest<DepartmentSummary[]>('/auth/departments'),
  teams: () => apiRequest<TeamSummary[]>('/auth/teams'),
  refresh: () => apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),
  logout: () => apiRequest<null>('/auth/logout', { method: 'POST' }),
};
