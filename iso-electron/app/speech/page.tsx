import GoogleLive from '@/components/sound/GoogleLive';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import Heading from '@/components/ui/Heading';
import React from 'react';

interface Props {}

const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen h-[91.5vh] z-0 flex flex-col justify-center   '>
      <div className='flex h-full justify-between '>
        {/* <Heading level={'h1'} text='Ses Tanıma' /> */}

        <WhisperUpload />
        <TranscriptionHistory />
      </div>
    </div>
  );
};

export default Speech;
