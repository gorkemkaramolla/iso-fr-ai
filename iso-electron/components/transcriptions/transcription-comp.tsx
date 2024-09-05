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
import { Change, Segment, Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import { FaGripVertical } from 'react-icons/fa6';
import { useResize } from '@/hooks/useResize';
import { useRouter } from 'next/navigation';
import { deleteTranscription } from '@/utils/transcription/transcription';
import PanelResizeHandler from './panel-resize-handler';
import SaveStateMessage from './save-state-message';

interface Props {
  transcription: Transcript;
}

const Transcription: React.FC<Props> = ({ transcription }) => {
  const router = useRouter();
  const transcriptionHistoryRef = useRef<HTMLDivElement>(null);
  const [changes, setChanges] = useState<Change[]>([]);

  const currentTime = useStore((state) => state.currentTime);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  const [rightScreen, setRightScreen] = useState<string | null>('history');
  const [rightPanelSize, setRightPanelSize] = useState<number>(25);
  const [transcriptionName, setTranscriptionName] = useState(
    transcription?.name || ''
  );
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

  // useEffect(() => {
  //   // Populate the changes array based on transcription segments
  //   const initialChanges = transcription.segments.map((segment) => ({
  //     segmentId: segment.id,
  //     initialText: segment.text,
  //     currentText: segment.text,
  //   }));
  //   setChanges(initialChanges);
  // }, [transcription]);

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
    // if (saveState === 'saved') {
    //   // Gather all changes into arrays
    //   const segmentIds: string[] = [];
    //   const oldTexts: string[] = [];
    //   const newTexts: string[] = [];
    //   changes.forEach((change) => {
    //     const oldText = transcription.segments.find(
    //       (segment: Segment) => segment.id === change.segmentId
    //     )?.text;

    //     if (oldText) {
    //       segmentIds.push(change.segmentId);
    //       oldTexts.push(oldText);
    //       newTexts.push(change.currentText);
    //     }
    //   });
    //   console.log(segmentIds, oldTexts, newTexts);
    //   // If there are valid changes, handle them in bulk
    //   if (segmentIds.length > 0) {
    //     handleBulkTranscribedTextChange(segmentIds, oldTexts, newTexts);
    //   }
    // }

    if (saveState === 'saved') {
      handleBulkTranscribedTextChange(changes);
    }
  }, [saveState]);

  const handleBulkTranscribedTextChange = async (changes: Change[]) => {
    setSaveState('needs saving');
    try {
      const response = await api.post(
        `/rename_transcribed_text/${transcription._id}`,
        {
          changes: changes,
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
    // const response = await api.delete(`transcriptions/${transcription._id}`);
    // const data = await response.json();
    // if (response.status === 200) {
    //   router.push('/transcriptions');
    // }
    // console.log(data);
    const status = await deleteTranscription(transcription._id);
    if (status === 200) {
      router.push('/transcriptions');
    }
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

  // Define a palette of colors to choose from
  const colorPalette = [
    '#FF5733', // Red
    '#33FF57', // Green
    '#3357FF', // Blue
    '#FF33A1', // Pink
    '#33FFF3', // Cyan
    '#FFA533', // Orange
    '#A533FF', // Purple
    '#33A1FF', // Light Blue
    '#FF3333', // Another Red variant
    '#33FFAA', // Mint
  ];

  // Function to generate a random color from the palette
  const generateRandomColor = (): string => {
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    return `${colorPalette[randomIndex]}33`; // Add alpha value for transparency
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
  const { width, height } = useResize(transcriptionHistoryRef);

  useEffect(() => {
    console.log(width, height);
  }, [width, height]);
  return (
    <div className='relative'>
      <SaveStateMessage saveState={saveState} />
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
                transcriptionName={transcriptionName}
                setTranscriptionName={setTranscriptionName}
                changes={changes}
                setChanges={setChanges}
                // speakerColors={speakerColors}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                transcription={transcription}
                editingRef={editingRef}
                handleEditName={handleEditTranscriptionName}
                handleDeleteTranscription={handleDeleteTranscription}
                handleSpeakerNameChange={handleSpeakerNameChange}
                transcriptionRef={transcriptionRef}
                isEditing={isEditing}
                saveState={saveState}
                setSaveState={setSaveState}
              />
            </div>
          </Panel>
          <PanelResizeHandler />
          {rightScreen && (
            <Panel
              defaultSize={25}
              minSize={0.2}
              className='z-0 md:block hidden '
            >
              <div className='flex w-full justify-between'></div>

              {rightScreen === 'history' && (
                <div ref={transcriptionHistoryRef}>
                  <TranscriptionHistory
                    activeTranscriptionName={transcriptionName}
                    setTranscriptionName={setTranscriptionName}
                    activePageId={transcription?._id}
                  />
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
