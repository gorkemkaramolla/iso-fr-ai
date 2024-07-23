'use client';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import React from 'react';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import useStore from '@/library/store';
import { GripVertical } from 'lucide-react';

interface Props {}
const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen h-[91.5vh] z-0 flex flex-col justify-center'>
      <div className='flex h-full justify-between'>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex'
          direction='horizontal'
        >
          <Panel defaultSize={75} minSize={30}>
            <WhisperUpload />
          </Panel>
          <PanelResizeHandle className='w-1 cursor-col-resize border-l-2 border-gray-100 relative md:flex hidden'>
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
              <GripVertical className='text-gray-400 w-4 h-4 mr-1' />
            </div>
          </PanelResizeHandle>
          <Panel defaultSize={25} minSize={20} className='z-0 md:block hidden'>
            <TranscriptionHistory />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Speech;
