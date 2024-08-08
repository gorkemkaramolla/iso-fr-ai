'use client';

import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const PersonelSettingsLayout = ({ children }: SettingsLayoutProps) => {
  return <div className='overflow-y-scroll '>{children}</div>;
};

export default PersonelSettingsLayout;
