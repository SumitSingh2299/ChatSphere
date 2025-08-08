import axios from 'axios';

// Get the backend URL from an environment variable, falling back to localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Crucial for sending cookies for session management
api.defaults.withCredentials = true;

// This line is the fix. It must be a 'default' export.
export default api;
