import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { motion } from 'framer-motion';
import TranscriptionHistory from '@/components/transcriptions/TranscriptionHistory';
import { Toast } from 'primereact/toast';
import WaveAudio from '@/components/sound/wave-audio';
import useStore from '@/library/store';
import { FaAngleUp } from 'react-icons/fa';
import TextEditor from './editor';
import { Changes, Segment, Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import { FaGripVertical } from 'react-icons/fa6';

interface Props {
  transcription: Transcript;
}

const Transcription: React.FC<Props> = ({ transcription }) => {
  const [changes, setChanges] = useState<Changes[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const currentTime = useStore((state) => state.currentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(
    null
  );
  const [rightScreen, setRightScreen] = useState<string | null>('history');
  const [rightPanelSize, setRightPanelSize] = useState<number>(25);

  const [isEditing, setIsEditing] = useState(false);
  const [saveState, setSaveState] = useState<
    'no changes made' | 'needs saving' | 'saved' | 'save failed'
  >('no changes made');
  const toast = useRef<Toast>(null);
  const editingRef = useRef<HTMLTextAreaElement>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [showButton, setShowButton] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(true);
  const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);

  useEffect(() => {
    // Populate the changes array based on transcription segments
    const initialChanges = transcription.segments.map((segment) => ({
      segmentId: segment.id,
      initialText: segment.text,
      currentText: segment.text,
    }));
    setChanges(initialChanges);
  }, [transcription]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlayerVisibility = localStorage.getItem('isPlayerVisible');
      if (savedPlayerVisibility !== null) {
        const visibility = savedPlayerVisibility === 'true';
        setIsPlayerVisible(visibility);
        setShowButton(!visibility);
        setSkipAnimation(visibility);
      } else {
        setSkipAnimation(false);
      }
    }
  }, []);

  useEffect(() => {
    if (saveState === 'saved') {
      changes.forEach((change) => {
        handleTranscribedTextChange(
          transcription.segments,
          change.segmentId,
          change.currentText
        );
      });

      setTimeout(() => {
        setSaveState('no changes made');
      }, 3000);
    }
  }, [saveState, changes, transcription.segments]);

  const handleTranscribedTextChange = async (
    segments: Segment[],
    segmentId: string,
    newText: string
  ) => {
    const oldText = segments.find(
      (segment: Segment) => segment.id === segmentId
    )?.text;

    if (!oldText) {
      console.error('Old text not found for the segment.');
      return;
    }

    setSaveState('needs saving');
    try {
      const response = await api.post(
        `/rename_transcribed_text/${transcription._id}`,
        {
          old_texts: [oldText],
          new_text: newText,
          segment_ids: [segmentId],
        }
      );

      if (response.status === 204) {
        console.log('No changes were made.');
        setSaveState('no changes made');
        return;
      }

      console.log('Successfully renamed transcribed text');
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to rename transcribed text:', error);
      handleSaveFailure();
    }
  };

  const handleSaveFailure = () => {
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save changes',
      life: 3000,
    });
    setSaveState('needs saving');
  };

  const handleDeleteTranscription = async () => {
    const response = await api.delete(`transcriptions/${transcription._id}`);
    const data = await response.json();
    console.log(data);
  };

  const handleSpeakerNameChange = async (
    segmentId: string,
    oldName: string,
    newName: string
  ) => {
    setSaveState('needs saving');
    try {
      await api.post(`/rename_segments/${transcription._id}`, {
        old_names: [oldName],
        new_name: newName,
        segment_ids: [segmentId],
      });
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to rename speaker:', error);
      handleSaveFailure();
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
    setSaveState('needs saving');
    try {
      await api.put(`transcriptions/${transcription._id}`, {
        name: new_name,
      });
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to rename transcription:', error);
      handleSaveFailure();
    }
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
    setShowButton(false);
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

  useEffect(() => {
    if (rightPanelSize < 15) {
      setRightScreen(null);
    }
  }, [rightPanelSize]);

  return (
    <div className='relative'>
      <Toast ref={toast} />
      <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full  md:w-2/4 z-50'>
        <WaveAudio
          viewMode={1}
          handleHidePlayer={handleHidePlayer}
          speakerColors={speakerColors}
          segments={transcription?.segments!}
          transcript_id={transcription?._id!}
          isVisible={isPlayerVisible}
          onHidden={() => setShowButton(true)}
          skipAnimation={skipAnimation}
        />
        {!isPlayerVisible && showButton && (
          <motion.div
            initial={skipAnimation ? false : { y: 100, opacity: 0 }}
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
      <div className='flex flex-col relative lg:flex-row '>
        <PanelGroup
          autoSaveId='example'
          className='w-full h-full flex'
          direction='horizontal'
        >
          <Panel defaultSize={75} minSize={60}>
            <div className='p-4 '>
              <TextEditor
                changes={changes}
                setChanges={setChanges}
                speakerColors={speakerColors}
                currentTime={currentTime}
                transcription={transcription}
                editingRef={editingRef}
                handleEditName={handleEditTranscriptionName}
                handleDeleteTranscription={handleDeleteTranscription}
                handleSpeakerNameChange={handleSpeakerNameChange}
                handleTranscribedTextChange={handleTranscribedTextChange}
                transcriptionRef={transcriptionRef}
                isEditing={isEditing}
                saveState={saveState}
                setSaveState={setSaveState}
              />
            </div>
          </Panel>
          <PanelResizeHandle className='cursor-col-resize w-[2px] max-h-[90vh] bg-gray-200 relative md:flex hidden'>
            <div className='absolute top-1/2 bg-primary text-white py-2 px-[3px] rounded-xl left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
              <FaGripVertical style={{ zIndex: 100 }} className='text-[12px]' />
            </div>
          </PanelResizeHandle>
          {rightScreen && (
            <Panel
              defaultSize={25}
              minSize={0.5}
              className='z-0 md:block hidden '
            >
              <div className='flex w-full justify-between'></div>

              {rightScreen === 'history' && (
                <div>
                  <TranscriptionHistory activePageId={transcription?._id} />
                </div>
              )}
            </Panel>
          )}
        </PanelGroup>
      </div>
    </div>
  );
};

export default Transcription;