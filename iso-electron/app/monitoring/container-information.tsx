import { ContainerInfo } from '@/types';
import { Box, Cpu, MemoryStick } from 'lucide-react';
import Image from 'next/image';
type Props = {
  containerInfos: ContainerInfo[];
};
export default function ContainerInformations({ containerInfos }: Props) {
  return (
    <div className='bg-white shadow-lg rounded-lg  p-4'>
      <h2 className='text-xl font-semibold mb-4 flex items-center'>
        <Box className='mr-2' /> Container Bilgileri
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {containerInfos.length === 0 ? (
          <div>Loading</div>
        ) : (
          containerInfos.map((container, index) => (
            <div
              key={index}
              className='border rounded-lg p-4 hover:shadow-md transition-shadow'
            >
              <h3 className='text-lg font-medium mb-2 flex items-center'>
                <Box className='mr-2' size={20} />
                {container.container}
              </h3>
              <p className='flex items-center mb-1'>
                <Cpu className='mr-2' size={16} />
                İşlemci Kullanımı:{' '}
                <span className='font-semibold ml-1'>{container.cpu}</span>
              </p>
              <p className='flex items-center mb-1'>
                <MemoryStick className='mr-2' size={16} />
                Bellek Kullanımı:{' '}
                <span className='font-semibold ml-1'>{container.memory}</span>
              </p>
              <p className='flex items-center'>
                <Image
                  width={900}
                  height={900}
                  alt=''
                  className='mr-2 w-4 h-4'
                  src={'/nvidia.svg'}
                />
                Ekran Kartı Kullanımı:{' '}
                <span className='font-semibold ml-1'>{container.gpu}</span>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
