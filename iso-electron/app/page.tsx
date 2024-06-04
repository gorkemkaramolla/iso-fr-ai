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
    <div className='flex  justify-center items-center h-full relative '>
      {/* {option} */}
      {/* <SpeechRecognitionComponent /> */}

      {/* <MonitorWidget uniqueId={'1'} /> */}
      {/* <MonitorWidget uniqueId={'2'} /> */}
      <div className='w-1/2 flex-col-reverse flex h-full'>
        <div className='h-1/2 w-full bg-[#FFDD00]'></div>
        <div className='h-1/2 w-full bg-[#0057B7]'></div>
      </div>
      <div className='w-1/2 flex-col-reverse flex h-full '>
        <div className='h-1/2 w-full bg-[#FFDD00]'></div>
        <div className='h-1/2 w-full bg-[#0057B7]'></div>
      </div>
    </div>
  );
}
