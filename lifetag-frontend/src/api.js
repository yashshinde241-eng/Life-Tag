import axios from 'axios';

// This is your backend's base URL
const BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

export default apiClient;