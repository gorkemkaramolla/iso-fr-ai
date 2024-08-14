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
import createApi from '@/utils/axios_instance';

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

  const handleSpeakerNameChange = async (
    segmentId: string,
    oldName: string,
    newName: string
  ) => {
    const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
    try {
      console.log('old name : ', oldName);
      console.log('new name : ', newName);
      console.log('segment id : ', segmentId);
      await api.post(`/rename_segments/${transcription.transcription_id}`, {
        old_names: [oldName],
        new_name: newName,
        segment_ids: [segmentId],
      });
    } catch (error) {
      console.error('Failed to rename speaker:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to rename speaker',
        life: 3000,
      });
    }
  };
  console.log(transcription.full_text);

  const handleTranscribedTextChange = async (
    segments: Segment[],

    segmentId: string,
    newText: string
  ) => {
    const oldText = segments.find(
      (segment: Segment) => segment.segment_id === segmentId
    )?.transcribed_text;

    const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);

    try {
      const response = await api.post(
        `/rename_transcribed_text/${transcription.transcription_id}`,
        {
          old_texts: [oldText],
          new_text: newText,
          segment_ids: [segmentId],
        }
      );

      // Optionally, you can add a success message or update the state here
      console.log('Successfully renamed transcribed text:', response.data);
    } catch (error) {
      console.error('Failed to rename transcribed text:', error);

      // Display an error toast message
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to rename transcribed text',
        life: 3000,
      });
    }
  };

  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return `${color}33`;
  };

  const handleEditTranscriptionName = async (new_name: string) => {
    const api = createApi(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);
    const response = await api.put(
      `transcriptions/${transcription.transcription_id}`,
      {
        name: new_name,
      }
    );
    console.log(response.data);
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
            handleEditName={handleEditTranscriptionName}
            handleDeleteSelected={() => {}}
            handleSpeakerNameChange={handleSpeakerNameChange}
            handleTranscribedTextChange={handleTranscribedTextChange}
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
