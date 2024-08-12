'use client';
import React, { useState, useRef, useMemo } from 'react';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import { Toast } from 'primereact/toast';
import WaveAudio from '@/components/sound/wave-audio';
import useStore from '@/library/store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SkeletonLoader from '@/components/ui/transcript-skeleton';
import { FaAngleDown } from 'react-icons/fa';
import TextEditor from './editor';
import { Segment, Transcript } from '@/types';

interface Props {
  transcription: Transcript;
}

const Transcription: React.FC<Props> = ({ transcription }) => {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const currentTime = useStore((state) => state.currentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const toast = useRef<Toast>(null);
  const editingRef = useRef<HTMLTextAreaElement>(null);

  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return `${color}33`;
  };

  const speakerColors = useMemo(() => {
    const colors: Record<string, string> = {};
    transcription.segments.forEach((segment) => {
      if (!colors[segment.speaker]) {
        colors[segment.speaker] = generateRandomColor();
      }
    });
    return colors;
  }, [transcription.segments]);

  return (
    <div className=''>
      <Toast ref={toast} />
      <div className='bg-white fixed bottom-0 left-1/2 transform -translate-x-1/2   px-8 w-full  z-50'>
        <button className='right-0 absolute '>
          <FaAngleDown />
        </button>
        <WaveAudio
          speakerColors={speakerColors}
          segments={transcription?.segments!}
          transcript_id={transcription?.transcription_id!}
        />
      </div>
      <div className='flex flex-col lg:flex-row min-h-screen'>
        <div className='p-4 lg:w-9/12'>
          <TextEditor
            speakerColors={speakerColors}
            currentTime={currentTime}
            transcription={transcription}
            editingRef={editingRef}
            handleEditName={() => {}}
            handleDeleteSelected={() => {}}
            handleSpeakerNameChange={() => {}}
            handleTranscribedTextChange={() => {}}
            transcriptionRef={transcriptionRef}
            isEditing={isEditing}
          />
        </div>
        <div className='lg:w-3/12'>
          <TranscriptionHistory
            activePageId={transcription?.transcription_id}
          />
        </div>
      </div>
    </div>
  );
};

export default Transcription;
