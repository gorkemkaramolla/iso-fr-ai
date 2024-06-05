import axios from 'axios';
import { redirect } from 'next/navigation';

function getAccessToken() {
  return sessionStorage.getItem('access_token') || '';
}

function getRefreshToken() {
  return sessionStorage.getItem('refresh_token') || '';
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_FLASK_URL,
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      return new Promise((resolve, reject) => {
        refreshAccessToken(refreshToken)
          .then((newAccessToken) => {
            sessionStorage.setItem('access_token', newAccessToken);
            api.defaults.headers['Authorization'] = 'Bearer ' + newAccessToken;
            originalRequest.headers['Authorization'] =
              'Bearer ' + newAccessToken;
            processQueue(null, newAccessToken);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            redirect('/login');
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_FLASK_URL}/token/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`, //
        },
      }
    );
    console.log('Token refreshed:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

export default api;
