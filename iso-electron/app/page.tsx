'use client';
import { Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import SpeechRecognitionComponent from '@/components/sound/GoogleLive';
import MonitorWidget from '@/components/widgets/MonitorWidget';
export default function Home() {
  const [option, setOption] = useState('');
  useEffect(() => {
    localStorage.setItem('client_id', '123456');
  }, []);
  return (
    <div className='flex justify-center items-center h-screen relative '>
      {/* {option} */}
      {/* <SpeechRecognitionComponent /> */}

      <MonitorWidget uniqueId={'1'} />
      <MonitorWidget uniqueId={'2'} />
    </div>
  );
}
