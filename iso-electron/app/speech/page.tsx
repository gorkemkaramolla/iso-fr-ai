import GoogleLive from '@/components/sound/GoogleLive';
import WhisperUpload from '@/components/sound/WhisperUpload';
import React from 'react';

interface Props {}

const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen '>
      <GoogleLive />
      <WhisperUpload />
    </div>
  );
};

export default Speech;
