import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import { Toast } from 'primereact/toast';
import WaveAudio from '@/components/sound/wave-audio';
import useStore from '@/library/store';
import { FaAngleUp } from 'react-icons/fa';
import TextEditor from './editor';
import { Segment, Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import { FaGripVertical } from 'react-icons/fa6';

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
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [showButton, setShowButton] = useState(false); // State to control button visibility
  const [skipAnimation, setSkipAnimation] = useState(true); // Flag to skip animation on initial render

  // Effect to load player visibility state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlayerVisibility = localStorage.getItem('isPlayerVisible');
      if (savedPlayerVisibility !== null) {
        const visibility = savedPlayerVisibility === 'true';
        setIsPlayerVisible(visibility);
        setShowButton(!visibility);
        setSkipAnimation(visibility); // Only skip the animation if it should be hidden initially
      } else {
        setSkipAnimation(false); // Default behavior if nothing is in localStorage
      }
    }
  }, []);

  const handleSpeakerNameChange = async (
    segmentId: string,
    oldName: string,
    newName: string
  ) => {
    const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
    try {
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
      const data = await response.json();
      console.log('Successfully renamed transcribed text:', data);
    } catch (error) {
      console.error('Failed to rename transcribed text:', error);
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
    await api.put(`transcriptions/${transcription.transcription_id}`, {
      name: new_name,
    });
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

  const handleShowPlayer = () => {
    setIsPlayerVisible(true);
    setShowButton(false); // Hide the button while the player is visible
    if (typeof window !== 'undefined') {
      localStorage.setItem('isPlayerVisible', 'true');
    }
  };

  const handleHidePlayer = () => {
    setIsPlayerVisible(false);
    setShowButton(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isPlayerVisible', 'false');
    }
  };

  return (
    <div className='relative'>
      <Toast ref={toast} />
      <div className='bg-gray fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full z-50'>
        <WaveAudio
          viewMode={1}
          handleHidePlayer={handleHidePlayer}
          speakerColors={speakerColors}
          segments={transcription?.segments!}
          transcript_id={transcription?.transcription_id!}
          isVisible={isPlayerVisible}
          onHidden={() => setShowButton(true)} // Show the button when hiding animation completes
          skipAnimation={skipAnimation} // Pass the flag to skip the animation on initial load
        />
        {!isPlayerVisible && showButton && (
          <motion.div
            initial={skipAnimation ? false : { y: 100, opacity: 0 }} // Skip animation if flag is set
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute bottom-0 left-1/2 transform -translate-x-1/2'
          >
            <button
              onClick={handleShowPlayer}
              className='bg-primary text-white p-1 rounded-full text-xl'
            >
              <FaAngleUp />
            </button>
          </motion.div>
        )}
      </div>
      <div className='flex flex-col relative lg:flex-row min-h-screen'>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex'
          direction='horizontal'
        >
          <Panel defaultSize={75} minSize={60}>
            <div className='p-4 '>
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
          </Panel>
          <PanelResizeHandle
            style={{ zIndex: 100 }}
            className='cursor-col-resize w-[2px] max-h-[90vh] bg-gray-200 relative md:flex hidden'
          >
            <div
              style={{ zIndex: 100 }}
              className='absolute top-1/2 bg-primary text-white py-2 px-[3px] rounded-xl left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            >
              <FaGripVertical style={{ zIndex: 100 }} className='text-[12px]' />
            </div>
          </PanelResizeHandle>
          <Panel defaultSize={25} minSize={0.5} className='z-0 md:block hidden'>
            <div>
              <TranscriptionHistory
                activePageId={transcription?.transcription_id}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Transcription;
