import axios from 'axios';
import { redirect } from 'next/navigation';

// function getAccessToken() {
//   if (typeof window !== 'undefined') {
//     return sessionStorage.getItem('access_token') || '';
//   }
//   return '';
// }

// function getRefreshToken() {
//   if (typeof window !== 'undefined') {
//     return sessionStorage.getItem('refresh_token') || '';
//   }
//   return '';
// }

const api = axios.create({
  withCredentials: true, // Send cookies with every request, like 'credentials: include'
  headers: {
    'Content-Type': 'application/json', // Ensuring JSON content type is set globally
    'Access-Control-Allow-Origin': '*',
  },
});

// let isRefreshing = false;
// let failedQueue: {
//   resolve: (value: unknown) => void;
//   reject: (reason?: any) => void;
// }[] = [];

// const processQueue = (error: null | any, token: string | null = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });

//   failedQueue = [];
// };

// api.interceptors.request.use((config) => {
//   const accessToken = getAccessToken(); // Assuming you have a function to retrieve the access token
//   if (accessToken) {
//     config.headers['Authorization'] = `Bearer ${accessToken}`; // Set the Authorization header
//   }
//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (
//       error.response &&
//       error.response.status === 401 &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;
//       try {
//         const refreshToken = getRefreshToken();
//         const newAccessToken = await refreshAccessToken(refreshToken);
//         api.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;
//         originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // Handle error, e.g., redirect to login
//         console.error('Error refreshing token:', refreshError);
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// async function refreshAccessToken(refreshToken: string) {
//   const response = await axios.post(
//     `${process.env.NEXT_PUBLIC_AUTH_URL}/token/refresh`,
//     {},
//     {
//       headers: {
//         Authorization: `Bearer ${refreshToken}`, // Set Authorization header for refresh
//       },
//     }
//   );
//   return response.data.access_token;
// }

// Helper function to get the CSRF token from cookies
function getCsrfTokenFromCookies(): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_access_token=`);

  // Check if parts length is 2 and parts[1] is not undefined
  if (parts.length === 2 && parts[1]) {
    return parts[1].split(';')[0];
  }

  return '';
}

// Function to create a new Axios instance with default settings
export default function createApi(baseURL = process.env.NEXT_PUBLIC_AUTH_URL) {
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'X-CSRF-TOKEN': getCsrfTokenFromCookies(),
      'Access-Control-Allow-Origin': '*',
      withCredentials: true,
    },
  });
}
