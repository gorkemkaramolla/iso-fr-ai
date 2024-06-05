import axios from 'axios';
import useStore from '@/lib/store';

function getAccessToken() {
  const access_token = localStorage.getItem('access_token');
  return access_token;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FLASK_URL,
});

api.defaults.headers.common['Authorization'] = `Bearer ${getAccessToken()}`;

export default api;
