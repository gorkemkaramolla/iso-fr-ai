import React, {
  useState,
  useCallback,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlignStartHorizontal,
  AlignStartVertical,
  EllipsisVertical,
  FileJson,
  FileX,
  SquarePen,
  Trash2,
} from 'lucide-react';
import SegmentMenu from './segment-menu';
import { debounce } from 'lodash';

interface TranscriptSegment {
  segment_id: string;
  speaker: string;
  start_time: number;
  end_time: number;
  transcribed_text: string;
}

interface Transcript {
  name: string;
  segments: TranscriptSegment[];
}

interface TextEditorProps {
  transcription: Transcript | null;
  editingRef: RefObject<HTMLInputElement>;
  handleEditName: (newName: string) => void;
  handleTranscriptionDelete: () => void;
  handleGetExcel: () => void;
  handleGetJSON: () => void;
  handleDeleteSelected: () => void;
  handleSelectSegment: (segmentId: string) => void;
  handleSelectAll: () => void;
  handleSelectSpeaker: (speaker: string) => void;
  handleSpeakerNameChange: (segmentId: string, newName: string) => void;
  handleTranscribedTextChange: (segmentId: string, newText: string) => void;
  selectedSegments: string[];
  selectedSpeakers: string[];
  highlightedSegment: string | null;
  transcriptionRef: RefObject<HTMLDivElement>;
  getSpeakerBorderColor: (speaker: string) => string;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  currentTime: number;
  speakerColors: Record<string, string>;
}

interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  segmentId: string | null;
}

const TextEditor: React.FC<TextEditorProps> = ({
  transcription,
  speakerColors,
  editingRef,
  handleEditName,
  handleTranscriptionDelete,
  handleGetExcel,
  handleGetJSON,
  handleDeleteSelected,
  handleSelectSegment,
  handleSelectAll,
  handleSelectSpeaker,
  handleSpeakerNameChange,
  handleTranscribedTextChange,
  selectedSegments,
  selectedSpeakers,
  highlightedSegment,
  transcriptionRef,
  getSpeakerBorderColor,
  isEditing,
  setIsEditing,
  currentTime,
}) => {
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    segmentId: null,
  });

  const [viewMode, setViewMode] = useState<'inline' | 'list'>('inline');
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [isTranscriptionNameEditing, setIsTranscriptionNameEditing] =
    useState(false);
  const [transcriptionName, setTranscriptionName] = useState(
    transcription?.name || ''
  );
  const [segments, setSegments] = useState<TranscriptSegment[]>(
    transcription?.segments || []
  );
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);

  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setTranscriptionName(transcription?.name || '');
    setSegments(transcription?.segments || []);
    updateUniqueSpeakers(transcription?.segments || []);
  }, [transcription]);

  const debouncedHandleEditName = useCallback(
    debounce((newName: string) => {
      handleEditName(newName);
      setTranscriptionName(newName); // Immediately update the name in the UI
      alert('Name changed');
    }, 500),
    [handleEditName]
  );

  const updateUniqueSpeakers = (segments: TranscriptSegment[]) => {
    const speakers = Array.from(
      new Set(segments.map((segment) => segment.speaker))
    );
    setUniqueSpeakers(speakers);
  };

  const handleNameChange = (e: React.FocusEvent<HTMLHeadingElement>) => {
    const newName = e.currentTarget.textContent || '';
    setTranscriptionName(newName);
    debouncedHandleEditName(newName);
  };

  const handleTranscriptionNameChange = () => {
    setIsTranscriptionNameEditing(true);
  };

  const handleSpeakerClick = (speaker: string) => {
    const newName = prompt(`Rename ${speaker} to:`);
    if (newName && newName.trim() !== '') {
      const confirmChange = window.confirm(
        `Are you sure you want to rename all occurrences of "${speaker}" to "${newName}"?`
      );
      if (confirmChange) {
        renameAllSegments(speaker, newName);
      }
    }
  };

  const renameAllSegments = (oldName: string, newName: string) => {
    const updatedSegments = segments.map((segment) => {
      if (segment.speaker === oldName) {
        handleSpeakerNameChange(segment.segment_id, newName);
        return { ...segment, speaker: newName };
      }
      return segment;
    });
    setSegments(updatedSegments); // Update the segments in the state
    updateUniqueSpeakers(updatedSegments); // Update the unique speakers
    alert(`All "${oldName}" segments renamed to "${newName}"`);
  };

  useEffect(() => {
    if (segments.length > 0) {
      const activeSegment = segments.find(
        (segment) =>
          currentTime >= segment.start_time && currentTime <= segment.end_time
      );

      if (activeSegment && segmentRefs.current[activeSegment.segment_id]) {
        const element = segmentRefs.current[activeSegment.segment_id];
        const container = transcriptionRef.current;

        if (element && container) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const offset = containerRect.height / 2 - elementRect.height / 2;

          if (
            elementRect.top < containerRect.top ||
            elementRect.bottom > containerRect.bottom
          ) {
            container.scrollTo({
              top: element.offsetTop - container.offsetTop - offset,
              behavior: 'smooth',
            });
          }
        }
      }
    }
  }, [currentTime, segments, transcriptionRef]);

  const showSegmentMenu = useCallback(
    (e: React.MouseEvent, segmentId: string) => {
      e.preventDefault();
      setMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        segmentId,
      });
    },
    []
  );

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isOpen: false,
      segmentId: null,
    }));
  }, []);

  const handleDeleteSegment = useCallback(() => {
    if (menuState.segmentId) {
      handleDeleteSelected(menuState.segmentId);
    }
    closeMenu();
  }, [menuState.segmentId, handleDeleteSelected, closeMenu]);

  const handleEditSegment = useCallback(() => {
    if (menuState.segmentId) {
      const segment = segments.find(
        (s) => s.segment_id === menuState.segmentId
      );
      if (segment) {
        const newSpeakerName = prompt('Edit Speaker Name:', segment.speaker);
        if (newSpeakerName && newSpeakerName.trim() !== '') {
          handleSpeakerNameChange(segment.segment_id, newSpeakerName);
        }
      }
    }
    closeMenu();
  }, [menuState.segmentId, segments, handleSpeakerNameChange, closeMenu]);

  const handleCopySegment = useCallback(() => {
    const segment = segments.find((s) => s.segment_id === menuState.segmentId);
    if (segment) {
      navigator.clipboard.writeText(segment.transcribed_text).then(
        () => {
          console.log('Copied to clipboard');
        },
        (err) => {
          console.error('Failed to copy: ', err);
        }
      );
    }
    closeMenu();
  }, [menuState.segmentId, segments, closeMenu]);

  const handleBlur = useCallback(
    (
      segmentId: string,
      originalText: string,
      e: React.FocusEvent<HTMLSpanElement>
    ) => {
      const newText = e.currentTarget.textContent || '';
      if (newText !== originalText) {
        handleTranscribedTextChange(segmentId, newText);
        const updatedSegments = segments.map((segment) =>
          segment.segment_id === segmentId
            ? { ...segment, transcribed_text: newText }
            : segment
        );
        setSegments(updatedSegments);
      }
    },
    [handleTranscribedTextChange, segments]
  );

  const handleBadgeMouseEnter = useCallback((segmentId: string) => {
    setHoveredSegmentId(segmentId);
  }, []);

  const handleBadgeMouseLeave = useCallback(() => {
    setHoveredSegmentId(null);
  }, []);

  return (
    <div>
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center'>
          <h1
            className='text-xl font-extrabold p-4 w-64'
            contentEditable={isTranscriptionNameEditing}
            onBlur={handleNameChange}
            suppressContentEditableWarning
          >
            {transcriptionName}
          </h1>
          <div className='relative flex items-center'>
            <button onClick={() => setIsEditing(!isEditing)}>
              <EllipsisVertical />
            </button>

            {isEditing && (
              <ul className='menu menu-horizontal w-full bg-base-200 rounded-box'>
                <li>
                  <button
                    onClick={handleTranscriptionNameChange}
                    className='tooltip tooltip-right'
                    data-tip='Konuşma adını değiştir'
                  >
                    <SquarePen />
                  </button>
                </li>
                <li>
                  <a
                    onClick={handleGetExcel}
                    className='tooltip tooltip-right'
                    data-tip='Download as Excel'
                  >
                    <FileX />
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleGetJSON}
                    className='tooltip tooltip-right'
                    data-tip='Download as JSON'
                  >
                    <FileJson />
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleTranscriptionDelete}
                    className='tooltip tooltip-right text-red-600'
                    data-tip='Delete transcription'
                  >
                    <Trash2 />
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className='flex justify-end space-x-2 mb-4'>
          <div className='dropdown'>
            <div tabIndex={0} role='button' className='btn m-1'>
              Konuşmacılar
            </div>
            <ul
              tabIndex={0}
              className='dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow'
            >
              {uniqueSpeakers.map((speaker) => (
                <li
                  key={speaker}
                  className='flex gap-1 ml-3 cursor-pointer'
                  onClick={() => handleSpeakerClick(speaker)}
                >
                  -{speaker}
                </li>
              ))}
            </ul>
          </div>

          <button
            className='p-button-sm'
            onClick={() =>
              setViewMode(viewMode === 'inline' ? 'list' : 'inline')
            }
          >
            {viewMode === 'inline' ? (
              <AlignStartHorizontal />
            ) : (
              <AlignStartVertical />
            )}
          </button>
        </div>
      </div>

      <div
        ref={transcriptionRef}
        className='bg-white rounded shadow p-4 overflow-y-scroll h-[600px]'
      >
        {/* <div className='flex w-full justify-around flex-col text-sm py-2'>
          <h2>Speakers</h2>
          {uniqueSpeakers.map((speaker) => (
            <div key={speaker} className='flex gap-1 ml-3 '>
              -{speaker}
            </div>
          ))}
        </div> */}
        <AnimatePresence>
          {segments.map((segment, index) => {
            const isHighlighted =
              currentTime >= segment.start_time &&
              currentTime <= segment.end_time;
            const isActiveSegment = menuState.segmentId === segment.segment_id;
            const isHovered = hoveredSegmentId === segment.segment_id;

            return (
              <motion.div
                key={segment.segment_id}
                className={
                  viewMode === 'inline'
                    ? 'inline'
                    : 'block mb-2 transition-all '
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                ref={(el) => {
                  segmentRefs.current[segment.segment_id] = el;
                }}
              >
                <span className=' badge text-gray-400 text-[10px]'>
                  {segment.speaker}
                </span>

                <span
                  onClick={(e) => showSegmentMenu(e, segment.segment_id)}
                  className={`${
                    isActiveSegment ? 'bg-gray-500 text-white' : 'text-gray-400'
                  }  cursor-pointer badge text-[10px] `}
                  onMouseEnter={() => handleBadgeMouseEnter(segment.segment_id)}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {segment.start_time.toFixed(2)}s
                </span>

                <span
                  contentEditable
                  suppressContentEditableWarning
                  className={`focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200 ${
                    viewMode === 'list' ? 'block' : 'inline'
                  }`}
                  style={{
                    backgroundColor: isHovered
                      ? '#bfff00'
                      : isHighlighted
                      ? speakerColors[segment.speaker]
                      : 'transparent',
                  }}
                  onBlur={(e) =>
                    handleBlur(segment.segment_id, segment.transcribed_text, e)
                  }
                >
                  {segment.transcribed_text}
                </span>

                {viewMode === 'list' && <br />}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <SegmentMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeMenu}
          onDelete={handleDeleteSegment}
          onEdit={handleEditSegment}
          onCopy={handleCopySegment}
        />
      </div>
    </div>
  );
};

export default TextEditor;
