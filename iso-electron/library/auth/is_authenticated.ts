import { cookies } from 'next/headers';

export function isAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token_cookie');
  return !!token;
}

export function deleteCookies() {
  const cookieStore = cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('access_token');
}
