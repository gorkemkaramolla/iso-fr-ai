'use client';
import { Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import SpeechRecognitionComponent from '@/components/sound/GoogleLive';
import MonitorWidget from '@/components/widgets/MonitorWidget';
import GaugeWidget from '@/components/widgets/GaugeWidget';
export default function Home() {
  const [option, setOption] = useState('');
  useEffect(() => {
    localStorage.setItem('client_id', '123456');
  }, []);
  return (
    <div className='flex justify-center items-center h-full relative '>
      {/* {option} */}
      {/* <SpeechRecognitionComponent /> */}

      {/* <MonitorWidget uniqueId={'1'} /> */}
      {/* <MonitorWidget uniqueId={'2'} /> */}
      <div className='w-1/2 h-full bg-red-500'>
        <div className='h-1/2 w-full bg-yellow-500'></div>
        <div className='h-1/2 w-full bg-indigo-500'></div>
      </div>
      <div className='w-1/2 h-full bg-blue-500'>
        <div className='h-1/2 w-full bg-yellow-500'></div>
        <div className='h-1/2 w-full bg-indigo-500'></div>
      </div>
    </div>
  );
}
