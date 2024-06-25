import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationBar from '@/components/ui/NavigationBar';
const inter = Inter({ subsets: ['latin'] });
import { PrimeReactProvider } from 'primereact/api';
export const metadata: Metadata = {
  title: 'ISOAI',
  description: 'ISOAI Electron App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='tr'
      data-theme='dark'
      className={'w-screen overflow-x-hidden   '}
    >
      <body className={inter.className + ' light flex justify-center'}>
        <PrimeReactProvider>
          <div className='w-full h-[100dvh]'>
            <NavigationBar />
            <div className='grow h-[93dvh]'>{children}</div>
          </div>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
