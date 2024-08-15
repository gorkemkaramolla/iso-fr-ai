import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import createApi from './axios_instance';

const handleLogout = async (router: AppRouterInstance) => {
  // Remove local storage item
  localStorage.removeItem('access_token');

  const api = createApi(`${process.env.NEXT_PUBLIC_AUTH_URL}`);

  try {
    const response = await api.post('/logout');
    console.log(response.status);
    if (response) {
      // Set cookies with specific attributes to ensure they are deleted properly
      const options = '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Clear all relevant cookies
      document.cookie = `access_token_cookie=${options}`;
      document.cookie = `client_access_token=${options}`;
      document.cookie = `csrf_access_token=${options}`;
      document.cookie = `csrf_refresh_token=${options}`;

      // Add Secure attribute if cookies were set with it
      if (location.protocol === 'https:') {
        document.cookie = `access_token_cookie=${options} Secure`;
        document.cookie = `client_access_token=${options} Secure`;
        document.cookie = `csrf_access_token=${options} Secure`;
        document.cookie = `csrf_refresh_token=${options} Secure`;
      }

      // Redirect to the login page
      router.push('/login');
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

export { handleLogout };
