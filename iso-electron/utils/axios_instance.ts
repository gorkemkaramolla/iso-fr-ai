// import axios from 'axios';

// function getCsrfTokenFromCookies(): string {
//   if (typeof document !== 'undefined') {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; csrf_access_token=`);

//     if (parts.length === 2 && parts[1]) {
//       return parts[1].split(';')[0];
//     }
//   }

//   return '';
// }

// export default function createApi(baseURL = process.env.NEXT_PUBLIC_AUTH_URL) {
//   let accessToken = '';

//   // Check if window and localStorage are available
//   if (typeof window !== 'undefined') {
//     accessToken = localStorage.getItem('access_token') || '';
//   }

//   return axios.create({
//     baseURL,

//     withCredentials: true, // This should be set here and not in headers
//     headers: {
//       'X-CSRF-TOKEN': getCsrfTokenFromCookies(),
//       Authorization: accessToken ? `Bearer ${accessToken}` : '',
//     },
//   });
// }
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

  const defaultHeaders = {
    'X-CSRF-TOKEN': getCsrfTokenFromCookies(),
    Authorization: accessToken ? `Bearer ${accessToken}` : '',
  };

  async function request(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const { headers, ...restOptions } = options;
    const response = await fetch(`${baseURL}/${url}`, {
      credentials: 'include', // This is equivalent to `withCredentials: true` in axios
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...restOptions,
    });

    // Check if the response is okay and return it
    if (!response.ok) {
      // Handle HTTP errors
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).response = response;
      throw error;
    }

    // Return the raw response object for further handling
    return response;
  }

  return {
    get: (url: string, options?: RequestInit) =>
      request(url, { method: 'GET', ...options }),
    post: (url: string, body?: any, options?: RequestInit) => {
      const isFormData = body instanceof FormData;

      return request(url, {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
        headers: isFormData
          ? { ...options?.headers } // Let the browser set the Content-Type
          : { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
      });
    },
    put: (url: string, body?: any, options?: RequestInit) => {
      const isFormData = body instanceof FormData;

      return request(url, {
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body),
        headers: isFormData
          ? { ...options?.headers } // Let the browser set the Content-Type
          : { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
      });
    },
    delete: (url: string, options?: RequestInit) =>
      request(url, { method: 'DELETE', ...options }),
  };
}
