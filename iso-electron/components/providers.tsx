'use client';
import React, { useEffect, useState } from 'react';
import NavigationBar from './ui/NavigationBar';
import { CookiesProvider, useCookies } from 'react-cookie';
import { PrimeReactProvider } from 'primereact/api';
import { usePathname, useRouter } from 'next/navigation';
import { isElectron } from '@/utils/checkPlatform';
import { handleLogout } from '@/utils/logout';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NextUIProvider } from '@nextui-org/react';

interface ProviderProps {
  children: React.ReactNode;
}

function trimUrl(currentPage: string): string {
  const segments = currentPage.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '/';
  }
  return '/' + segments.slice(0, -1).join('/');
}

const Provider: React.FC<ProviderProps> = ({ children }) => {
  const [cookies] = useCookies(['client_access_token']);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const hydrateAndCheckToken = () => {
      setIsHydrated(true);

      let token: string | null = null;

      if (isElectron()) {
        try {
          token = localStorage.getItem('access_token');
        } catch (error) {
          console.error('Failed to access localStorage in Electron:', error);
        }
      } else {
        token = cookies.client_access_token;
      }

      setAccessToken(token);

      if (!token && pathname !== '/login') {
        handleLogout(router).then(() => {
          router.push('/login');
        });
      }
    };

    hydrateAndCheckToken();
  }, [cookies.client_access_token, pathname, router]);

  // Add the keyboard shortcut functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlR = event.key === 'r' && (event.ctrlKey || event.metaKey);
      const isF5 = event.key === 'F5';

      if (isCtrlR || isF5) {
        event.preventDefault();
        window.location.reload(); // This will reload the current page
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <CookiesProvider>
      <NextUIProvider>
        <PrimeReactProvider
          value={{
            ripple: true,
          }}
        >
          {isHydrated && accessToken && <NavigationBar />}

          {pathname !== '/login' && pathname !== '/' && isElectron() && (
            <Link href={trimUrl(pathname!)} passHref>
              <Button
                icon={<ArrowLeft />}
                className='m-2 p-button-text absolute top-15 p-button-plain'
              />
            </Link>
          )}
          {children}
        </PrimeReactProvider>
      </NextUIProvider>
    </CookiesProvider>
  );
};

export default Provider;
