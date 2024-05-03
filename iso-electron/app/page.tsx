'use client';
import { Mic } from 'lucide-react';
import { useState } from 'react';
import SpeechRecognitionComponent from '@/components/sound/GoogleLive';

export default function Home() {
  const [option, setOption] = useState('');
  return (
    <div className='flex justify-center items-center h-screen'>
      {option}

      {/* <SpeechRecognitionComponent /> */}
    </div>
  );
}
