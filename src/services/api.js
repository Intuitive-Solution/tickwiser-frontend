import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
});

// Add request interceptor to include Firebase token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        
        
        // Debug: Decode token payload to see the UID
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          }
        } catch (decodeError) {
          console.error('Failed to decode token:', decodeError);
        }
      } catch (error) {
        console.error('Error getting Firebase token:', error);
      }
    } else {
      console.log('❌ No authenticated user found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access - user may need to re-authenticate');
    }
    return Promise.reject(error);
  }
);

export default api;