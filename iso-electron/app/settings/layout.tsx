'use client';

import { usePathname } from 'next/navigation';
import UiWrapper from '@/components/ui/Wrapper';
import Link from 'next/link';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const pathname = usePathname();
  const isSettingsPage = pathname === '/settings';

  return (
    <UiWrapper>
      {!isSettingsPage && (
        <Link href='/settings' passHref>
          <Button
            icon='pi pi-arrow-left'
            label='Ayarlara dön'
            className='p-button-text p-button-plain'
          />
        </Link>
      )}
      {children}
    </UiWrapper>
  );
};

export default SettingsLayout;
