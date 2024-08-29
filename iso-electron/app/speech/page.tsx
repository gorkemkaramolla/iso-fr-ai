'use client';

import React, { useEffect, useState } from 'react';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcriptions/TranscriptionHistory';
import useStore from '@/library/store';
import { GripVertical } from 'lucide-react';
import createApi from '@/utils/axios_instance';

const Speech: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const checkProcessIsRunning = async () => {
    try {
      const api = createApi(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);
      const response = await api.get('/check-process/');
      const data = await response.json(); // Adjust based on Axios response
      setIsProcessing(data.processing); // Update this line to access the 'processing' field
      console.log(data);
    } catch (error) {
      console.error('Error checking process status:', error);
      setIsProcessing(false); // Ensure it resets if there's an error
    }
  };

  useEffect(() => {
    checkProcessIsRunning();
  }, []);

  return (
    <div className='w-screen z-0 flex flex-col h-[90vh] justify-center'>
      <div className='flex h-full justify-between'>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex'
          direction='horizontal'
        >
          <Panel defaultSize={75} minSize={30}>
            <WhisperUpload isProcessing={isProcessing} />
          </Panel>
          <PanelResizeHandle className='w-1 z-0 cursor-col-resize border-l-2 border-gray-100 relative md:flex hidden'>
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
              <GripVertical className='text-gray-400' />
            </div>
          </PanelResizeHandle>
          <Panel defaultSize={25} minSize={20} className='z-0 md:block hidden'>
            {/* If no activeTranscriptionName and setTranscriptionName are needed, you can omit them */}
            <TranscriptionHistory activePageId='someActivePageId' />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Speech;
