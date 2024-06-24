import Image from 'next/image';
import { Camera } from 'lucide-react';
import CameraSettings from '@/components/settings/CameraSettings';
import PersonelSettings from '@/components/settings/PersonelSettings';

export default function Page() {
  return (
    <div className='container mx-auto flex gap-2  h-[92dvh] w-screen overflow-hidden'>
      <div className='w-1/2 h-full overflow-y-scroll'>
        <CameraSettings />
      </div>
      <div className='w-1/2 h-full overflow-y-scroll'>
        <PersonelSettings />
      </div>
    </div>
  );
}
