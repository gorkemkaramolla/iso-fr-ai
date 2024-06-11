'use client';
import fuat from '/Users/gorkemkaramolla/Documents/python2/oracle/face-images/FuatAltun2.png';
import { Mic } from 'lucide-react';
import { useState, useEffect } from 'react';
import SpeechRecognitionComponent from '@/components/sound/GoogleLive';
import MonitorWidget from '@/components/widgets/MonitorWidget';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import Image from 'next/image';
export default function Home() {
  const [option, setOption] = useState('');
  useEffect(() => {
    localStorage.setItem('client_id', '123456');
  }, []);
  return (
    <div className='flex w-screen container mx-auto flex-col relative h-[93vh] '>
      <div className='  flex  gap-2 self-end '>
        <Image
          width={1000}
          height={1000}
          className='rounded-full w-16 h-16 object-fill'
          alt='fuat'
          src={fuat}
        />
        <div className='flex-col flex'>
          <h2>Fuat Altun</h2>
          <p className='text-sm'>Bilgi Teknolojileri Şubesi</p>
          <p className='text-sm'>İstanbul Sanayi Odası</p>
        </div>
      </div>
    </div>
  );
}
