import axios from 'axios';

// Determine the base URL based on environment
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://fastapi-react-app-7zj5.onrender.com/api';
  }
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

export default api;
