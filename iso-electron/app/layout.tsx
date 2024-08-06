import type { Metadata } from 'next';
import './globals.css';
import { PrimeReactProvider } from 'primereact/api';
import { isAuthenticated } from '@/library/auth/is_authenticated'; // Import the utility function
import Provider from '@/components/providers';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons

export const metadata: Metadata = {
  title: 'ISOAI',
  description: 'ISOAI Electron App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check authentication status

  return (
    <html lang='tr' data-theme='light' className={'w-screen '}>
      {/* <head>
        <style>
          @import
          url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap');
        </style>
      </head> */}

      <body
        className={' w-full max-w-screen overflow-x-hidden flex justify-center'}
      >
        <PrimeReactProvider>
          <div className='w-full h-[100dvh]'>
            <Provider></Provider>

            <div className=' '>{children}</div>
          </div>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
