import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='h-[93.5vh] overflow-hidden bg-gradient-to-b  from-blue-500 to-purple-600 flex flex-col  items-center text-white p-4'>
      <Image
        alt='404 Error'
        width={900}
        height={900}
        src='/404.jpg'
        className='animate-float'
      />
      <h1 className='text-6xl font-bold mt-8 mb-2'>404</h1>
      <h2 className='text-3xl mb-4'>Sayfa Uzayda Kayboldu</h2>
      <p className='text-xl mb-8 text-center'>
        Aradığınız sayfa bulunamadı. Belki de başka bir galakside olabilir.
      </p>
      <Link
        href='/'
        className='bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition duration-300'
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
