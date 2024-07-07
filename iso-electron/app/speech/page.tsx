'use client';
import WhisperUpload from '@/components/sound/WhisperUpload';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import React from 'react';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import useStore from '@/library/store';

interface Props {}
const Speech: React.FC<Props> = () => {
  return (
    <div className='w-screen h-[91.5vh] z-0 flex flex-col justify-center   '>
      <div className='flex h-full justify-between '>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex '
          direction='horizontal'
        >
          <Panel defaultSize={75}>
            <WhisperUpload />
          </Panel>
          <PanelResizeHandle className='w-1 border-2 border-red-500 z-0 md:block hidden border-base-200' />

          <Panel defaultSize={25} className='z-0 md:block hidden'>
            <TranscriptionHistory />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Speech;
