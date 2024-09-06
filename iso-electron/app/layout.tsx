'use client';
import './globals.css';
import Provider from '@/components/providers';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons
import { RecogContext } from '@/context/RecogContext';
import { RecogFace } from '@/types';
import useSWR from 'swr';
import { getRecogFaces } from '@/services/camera/service';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check authentication status
  const today = new Date().toISOString().split('T')[0];

  const { data: recogFaces } = useSWR<RecogFace[]>(today, getRecogFaces, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  console.log('recogFaces', recogFaces);
  return (
    <html lang='tr' data-theme='light' className={'w-screen '}>
      <title>ISO-AI</title>
      <meta name='description' content='ISOAI Electron App' />
      <body
        className={' w-full max-w-screen overflow-x-hidden flex justify-center'}
      >
        <div className='w-full h-[100dvh]'>
          <RecogContext.Provider value={recogFaces}>
            <Provider>{children}</Provider>
          </RecogContext.Provider>
        </div>
      </body>
    </html>
  );
}
