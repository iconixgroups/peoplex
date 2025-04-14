import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) => 
    api.post('/auth/register', userData),
  
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh-token', { refreshToken }),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  changePassword: (currentPassword: string, newPassword: string) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Organization services
export const organizationService = {
  getAll: () => 
    api.get('/organizations'),
  
  getById: (id: string) => 
    api.get(`/organizations/${id}`),
  
  create: (data: any) => 
    api.post('/organizations', data),
  
  update: (id: string, data: any) => 
    api.put(`/organizations/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/organizations/${id}`),
};

// Department services
export const departmentService = {
  getAll: (organizationId: string) => 
    api.get('/departments', { params: { organizationId } }),
  
  getById: (id: string) => 
    api.get(`/departments/${id}`),
  
  create: (data: any) => 
    api.post('/departments', data),
  
  update: (id: string, data: any) => 
    api.put(`/departments/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/departments/${id}`),
};

// Location services
export const locationService = {
  getAll: (organizationId: string) => 
    api.get('/locations', { params: { organizationId } }),
  
  getById: (id: string) => 
    api.get(`/locations/${id}`),
  
  create: (data: any) => 
    api.post('/locations', data),
  
  update: (id: string, data: any) => 
    api.put(`/locations/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/locations/${id}`),
};

// Job Title services
export const jobTitleService = {
  getAll: (organizationId: string) => 
    api.get('/job-titles', { params: { organizationId } }),
  
  getById: (id: string) => 
    api.get(`/job-titles/${id}`),
  
  create: (data: any) => 
    api.post('/job-titles', data),
  
  update: (id: string, data: any) => 
    api.put(`/job-titles/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/job-titles/${id}`),
};

// Employee services
export const employeeService = {
  getAll: (params: any) => 
    api.get('/employees', { params }),
  
  getById: (id: string) => 
    api.get(`/employees/${id}`),
  
  create: (data: any) => 
    api.post('/employees', data),
  
  update: (id: string, data: any) => 
    api.put(`/employees/${id}`, data),
  
  uploadDocument: (employeeId: string, data: any) => 
    api.post(`/employees/${employeeId}/documents`, data),
  
  verifyDocument: (documentId: string) => 
    api.put(`/employees/documents/${documentId}/verify`),
};

// Attendance services
export const attendanceService = {
  getEmployeeAttendance: (employeeId: string, params: any) => 
    api.get(`/attendance/employee/${employeeId}`, { params }),
  
  getOrganizationAttendance: (params: any) => 
    api.get('/attendance/organization', { params }),
  
  checkIn: (employeeId: string, data: any) => 
    api.post(`/attendance/employee/${employeeId}/check-in`, data),
  
  checkOut: (employeeId: string, data: any) => 
    api.post(`/attendance/employee/${employeeId}/check-out`, data),
  
  updateAttendance: (id: string, data: any) => 
    api.put(`/attendance/${id}`, data),
};

// Leave services
export const leaveService = {
  getLeaveTypes: (organizationId: string) => 
    api.get('/leave/types', { params: { organizationId } }),
  
  createLeaveType: (data: any) => 
    api.post('/leave/types', data),
  
  getEmployeeLeaveBalances: (employeeId: string, params: any) => 
    api.get(`/leave/balances/employee/${employeeId}`, { params }),
  
  getEmployeeLeaveRequests: (employeeId: string, params: any) => 
    api.get(`/leave/requests/employee/${employeeId}`, { params }),
  
  getLeaveRequestsForApproval: (params: any) => 
    api.get('/leave/requests/approval', { params }),
  
  createLeaveRequest: (data: any) => 
    api.post('/leave/requests', data),
  
  processLeaveRequest: (id: string, data: any) => 
    api.put(`/leave/requests/${id}/process`, data),
  
  cancelLeaveRequest: (id: string) => 
    api.put(`/leave/requests/${id}/cancel`),
};

export default api;
