import api from '../config/api';

export const adminService = {
  login: (credentials) => api.post('/api/admin/login', credentials),
  getDashboard: () => api.get('/api/admin/dashboard'),
  getAllDoctors: () => api.get('/api/admin/doctors'),
  addDoctor: (doctorData) => api.post('/api/admin/add-doctor', doctorData),
  getAllAppointments: () => api.get('/api/admin/appointments'),
  cancelAppointment: (appointmentId) => api.post('/api/admin/cancel-appointment', { appointmentId }),
  // Add more admin-specific API calls
};
