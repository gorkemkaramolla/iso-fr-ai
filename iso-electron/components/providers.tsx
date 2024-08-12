import React, { ReactNode, useEffect, useState } from 'react';
import NavigationBar from './ui/NavigationBar';
import { CookiesProvider, useCookies } from 'react-cookie';
import { PrimeReactProvider } from 'primereact/api';
import { usePathname, useRouter } from 'next/navigation';
import { isElectron } from '@/utils/checkPlatform';
interface ProviderProps {
  children: React.ReactNode;
}

const Provider: React.FC<ProviderProps> = ({ children }: ProviderProps) => {
  const [cookies] = useCookies(['client_access_token']);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  console.log(isElectron() ? 'Electron' : 'Browser');

  useEffect(() => {
    setIsHydrated(true);

    // Check for the token in cookies
    let token = cookies.client_access_token;

    // If no token in cookies, check in Electron's localStorage
    if (isElectron()) {
      token = localStorage.getItem('access_token');
    }

    // Set the accessToken state
    setAccessToken(token);

    // If no token is found, redirect to login
    if (!token) {
      router.push('/login');
    }
  }, [cookies.client_access_token, router]);

  return (
    <CookiesProvider>
      <PrimeReactProvider>
        {isHydrated && accessToken ? <NavigationBar /> : <div />}
        {children}
      </PrimeReactProvider>
    </CookiesProvider>
  );
};

export default Provider;
