import { isAuthenticated } from '@/library/auth/is_authenticated';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/Login';

export default function LoginPage() {
  if (isAuthenticated()) {
    redirect('/'); // Redirect to the home page if already logged in
  }

  return <LoginForm />;
}
