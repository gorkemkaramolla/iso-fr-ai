import GoogleLive from '@/components/sound/GoogleLive';
import WhisperUpload from '@/components/sound/WhisperUpload';
import Heading from '@/components/ui/Heading';
import React from 'react';

interface Props {}

const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen '>
      <Heading level={'h1'} text='Speech AI' />
      <GoogleLive />
      <WhisperUpload />
    </div>
  );
};

export default Speech;
