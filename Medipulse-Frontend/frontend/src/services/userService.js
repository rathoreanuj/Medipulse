import api from '../config/api';

export const userService = {
  register: (userData) => api.post('/api/user/register', userData),
  login: (credentials) => api.post('/api/user/login', credentials),
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (userData) => api.post('/api/user/update-profile', userData),
  bookAppointment: (appointmentData) => api.post('/api/user/book-appointment', appointmentData),
  getAppointments: () => api.get('/api/user/appointments'),
  cancelAppointment: (appointmentId) => api.post('/api/user/cancel-appointment', { appointmentId }),
  getAllDoctors: () => api.get('/api/user/doctors'),
  paymentRazorpay: (appointmentId) => api.post('/api/user/payment-razorpay', { appointmentId }),
  verifyRazorpay: (razorpayData) => api.post('/api/user/verifyRazorpay', razorpayData),
  // Add more user-specific API calls
};
