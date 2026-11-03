import { CallRecord, DashboardStats, EmployeeAccount, AuditLogEntry } from '@call-agent/shared';

const TOKEN_KEY = 'purpledrive_admin_jwt_v1';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredToken();
    window.location.reload();
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const adminApi = {
  // Authentication
  async login(email: string, password: string) {
    const res = await request<{ success: boolean; token: string; user: any }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res.user;
  },

  async getCurrentUser() {
    const res = await request<{ success: boolean; user: any }>('/api/auth/me');
    return res.user;
  },

  // Dashboard Stats
  async getStats(startDate?: number, endDate?: number): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate.toString());
    if (endDate) params.set('endDate', endDate.toString());
    const res = await request<{ success: boolean; stats: DashboardStats }>(`/api/admin/stats?${params.toString()}`);
    return res.stats;
  },

  // Call Logs
  async getCalls(filters: {
    employeeId?: string;
    direction?: string;
    outcome?: string;
    phoneSearch?: string;
    startDate?: number;
    endDate?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') {
        params.set(k, v.toString());
      }
    });
    return request<{
      success: boolean;
      records: CallRecord[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/calls?${params.toString()}`);
  },

  // CSV Export Download
  getCsvExportUrl(filters: {
    employeeId?: string;
    direction?: string;
    outcome?: string;
    startDate?: number;
    endDate?: number;
  }): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'ALL') {
        params.set(k, v.toString());
      }
    });
    return `/api/calls/export?${params.toString()}`;
  },

  // Employees Management
  async getEmployees(): Promise<EmployeeAccount[]> {
    const res = await request<{ success: boolean; employees: EmployeeAccount[] }>('/api/employees');
    return res.employees;
  },

  async createEmployee(data: {
    name: string;
    email: string;
    department: string;
    registeredPhoneNumber: string;
    password?: string;
  }) {
    return request<{ success: boolean; employee: EmployeeAccount }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async setEmployeeStatus(employeeId: string, status: 'ACTIVE' | 'INACTIVE') {
    return request<{ success: boolean; message: string }>(`/api/employees/${employeeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await request<{ success: boolean; logs: AuditLogEntry[] }>('/api/admin/audit-logs');
    return res.logs;
  },
};
