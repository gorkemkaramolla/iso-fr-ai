import Image from 'next/image';
export default function notFound() {
  return (
    <div className='w-screen h-screen flex justify-center items-center'>
      <Image alt='hello' width={500} height={500} src={'/iso_logo.jpg'} />
      Aradağınız sayfa bulunamadı.
    </div>
  );
}
