import axios from "axios";

// Backend base URL from environment variable
const BASE_URL = process.env.REACT_APP_API_BASE_URL + "/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

export default apiClient;
