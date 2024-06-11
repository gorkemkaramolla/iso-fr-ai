import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationBar from '@/components/ui/NavigationBar';
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
  return (
    <html lang='tr' className='w-screen overflow-x-hidden  '>
      <body
        data-theme='light'
        className={inter.className + 'light flex justify-center'}
      >
        <div className='w-full h-[100dvh]'>
          <NavigationBar />
          <div className='grow h-[93dvh]'>{children}</div>
        </div>
      </body>
    </html>
  );
}
