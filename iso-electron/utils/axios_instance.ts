import axios from 'axios';

function getCsrfTokenFromCookies(): string {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_access_token=`);

    if (parts.length === 2 && parts[1]) {
      return parts[1].split(';')[0];
    }
  }

  return '';
}

export default function createApi(baseURL = process.env.NEXT_PUBLIC_AUTH_URL) {
  let accessToken = '';

  // Check if window and localStorage are available
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token') || '';
  }

  return axios.create({
    baseURL,
    withCredentials: true, // This should be set here and not in headers
    headers: {
      'X-CSRF-TOKEN': getCsrfTokenFromCookies(),
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
    },
  });
}
