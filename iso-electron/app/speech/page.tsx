'use client';
import GoogleLive from '@/components/sound/GoogleLive';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import Heading from '@/components/ui/Heading';
import React from 'react';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';

interface Props {}
const Speech: React.FC<Props> = () => {
  const handleDoubleClick = () => {};

  return (
    <div className='w-screen h-[91.5vh] overflow-y-scroll z-0 flex flex-col justify-center   '>
      <div className='flex h-full justify-between '>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex '
          direction='horizontal'
        >
          <Panel defaultSize={75}>
            <WhisperUpload />
          </Panel>
          <PanelResizeHandle className='w-1 border-2' />

          <Panel defaultSize={25} className='z-0'>
            <TranscriptionHistory />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Speech;
