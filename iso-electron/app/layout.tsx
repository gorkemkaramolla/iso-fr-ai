import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationBar from '@/components/ui/NavigationBar';
import { PrimeReactProvider } from 'primereact/api';
import { isAuthenticated } from '@/library/auth/is_authenticated'; // Import the utility function
import Provider from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang='tr' data-theme='light' className={'w-screen overflow-hidden'}>
      <body className={inter.className + ' light flex justify-center'}>
        <PrimeReactProvider>
          <div className='w-full h-[100dvh]'>
            <Provider>a</Provider>

            <div className='grow h-[93dvh]'>{children}</div>
          </div>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
