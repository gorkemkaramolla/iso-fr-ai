import api from '@/utils/axios_instance';
import axios from 'axios';
import Image from 'next/image';

export default async function Personel(personel: Personel) {
  const base64Image = Buffer.from(personel.FOTO_BINARY_DATA, 'hex').toString(
    'base64'
  );
  const imageUrl = `data:${personel.FOTO_DOSYA_TIPI};base64,${base64Image}`;
  return (
    <div>
      <div className='  flex items-center w-full  gap-2 self-end border-2 '>
        <div className='avatar  p-4'>
          <div className='w-24 h-24 rounded-full '>
            <Image width={1000} height={1000} alt='fuat' src={imageUrl} />
          </div>
        </div>
        <div className='flex-col flex gap-2'>
          <h2 className='text-primary'>
            {personel.ADI || 'Adı yok'} {personel.SOYADI || 'Soyad Yok'}
          </h2>
          <p className='text-sm'>{personel.UNVANI || 'UNVAN YOK'}</p>
          <p className='text-sm'>{personel.GSM || 'TELEFON YOK'}</p>
        </div>
      </div>
    </div>
  );
}
