import { apiRequest } from './apiClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
  isActive: boolean;
}

export interface DepartmentSummary {
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
  register: (name: string, email: string, password: string) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: () =>
    apiRequest<{ user: AuthUser }>('/auth/me', {
      headers: {
        Authorization: ['Bearer', localStorage.getItem('accessToken') || ''].join(' '),
      },
    }),
  employees: () => apiRequest<EmployeeSummary[]>('/auth/employees'),
  departments: () => apiRequest<DepartmentSummary[]>('/auth/departments'),
  refresh: () => apiRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),
  logout: () => apiRequest<null>('/auth/logout', { method: 'POST' }),
};
