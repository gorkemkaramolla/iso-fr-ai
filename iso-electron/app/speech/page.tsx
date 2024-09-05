'use client';
import React, { useEffect, useState } from 'react';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcriptions/TranscriptionHistory';
import { GripVertical } from 'lucide-react';
import createApi from '@/utils/axios_instance';
import useStore from '@/library/store'; // Import the Zustand store

const Speech: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const setTranscriptions = useStore((state) => state.setTranscriptions); // Get setter from store
  const api = createApi(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const response = await api.get('/transcriptions/');
        const data = await response.json();
        setTranscriptions(data);
      } catch (error) {
        console.error('Failed to fetch transcriptions:', error);
      }
    };

    fetchTranscriptions();
  }, [setTranscriptions]);

  const checkProcessIsRunning = async () => {
    try {
      const response = await api.get('/check-process/');
      const data = await response.json();
      setIsProcessing(data.processing);
    } catch (error) {
      console.error('Error checking process status:', error);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    checkProcessIsRunning();
  }, []);

  return (
    <div className='w-screen z-0 flex flex-col h-[90vh] justify-center'>
      <div className='flex h-full justify-between'>
        <div className='w-full md:w-3/4 p-4'>
          <WhisperUpload isProcessing={isProcessing} />
        </div>

        <div className='z-0 md:block hidden w-1/4'>
          <TranscriptionHistory />
        </div>
      </div>
    </div>
  );
};

export default Speech;
