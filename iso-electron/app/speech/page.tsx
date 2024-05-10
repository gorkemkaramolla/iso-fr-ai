import GoogleLive from '@/components/sound/GoogleLive';
import WhisperUpload from '@/components/sound/WhisperUpload';
import Heading from '@/components/ui/Heading';
import React from 'react';

interface Props {}

const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen flex flex-col justify-center   '>
      <Heading level={'h1'} text='Ses Tanıma' />
      <div className='flex h-auto  '>
        <GoogleLive />
        <WhisperUpload />
      </div>
    </div>
  );
};

export default Speech;
