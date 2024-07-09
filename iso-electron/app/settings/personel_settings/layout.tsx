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

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const pathname = usePathname();
  const isSettingsPage = pathname === '/settings';

  return <div className='overflow-y-scroll '>{children}</div>;
};

export default SettingsLayout;
