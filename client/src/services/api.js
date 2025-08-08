import axios from 'axios';

// The base URL must include the /api prefix
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.defaults.withCredentials = true;

export default api;