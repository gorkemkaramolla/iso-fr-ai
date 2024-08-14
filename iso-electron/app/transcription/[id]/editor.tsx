'use client';

import React, {
  useState,
  useCallback,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlignStartHorizontal, AlignStartVertical, User } from 'lucide-react';
import SegmentMenu from './segment-menu';
import Card from '@/components/ui/card';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Segment } from '@/types';

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
  editingRef: RefObject<HTMLTextAreaElement>;
  handleEditName?: (newName: string) => void;
  handleDeleteSelected?: (segmentId: string) => void;
  handleSpeakerNameChange?: (
    segmentId: string,
    oldName: string,
    newName: string
  ) => void;
  handleTranscribedTextChange?: (
    segments: Segment[],
    segmentId: string,
    newText: string
  ) => void;
  transcriptionRef: RefObject<HTMLDivElement>;
  isEditing: boolean;
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
  handleEditName = () => {},
  handleDeleteSelected = () => {},
  handleSpeakerNameChange = () => {},
  handleTranscribedTextChange = () => {},
  transcriptionRef,
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

  const updateUniqueSpeakers = (segments: TranscriptSegment[]) => {
    const speakers = Array.from(
      new Set(segments.map((segment) => segment.speaker))
    );
    setUniqueSpeakers(speakers);
  };

  const handleNameChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newName = e.currentTarget.value || '';
    setTranscriptionName(newName);
    handleEditName(newName);
    setIsTranscriptionNameEditing(false);
  };

  const handleTranscriptionNameChange = () => {
    setIsTranscriptionNameEditing(true);

    if (typeof document !== 'undefined' && editingRef.current) {
      setTimeout(() => {
        const el = editingRef.current;
        if (el) {
          el.focus();

          const range = document.createRange(); // Safe use of document
          range.selectNodeContents(el);
          range.collapse(false);

          const selection = window.getSelection(); // Safe use of window
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 0);
    }
  };

  const handleSpeakerClick = (speaker: string) => {
    const newName = prompt(`${speaker} adlı konuşmacıyı değiştir:`);
    if (newName && newName.trim() !== '') {
      const confirmChange = window.confirm(
        `"${speaker}" adlı konuşmacının tüm segmentlerini "${newName}" olarak değiştirmeyi onaylayın`
      );
      if (confirmChange) {
        renameAllSegments(speaker, newName);
      }
    }
  };

  const renameAllSegments = (oldName: string, newName: string) => {
    const updatedSegments = segments.map((segment) => {
      if (segment.speaker === oldName) {
        handleSpeakerNameChange(segment.segment_id, oldName, newName);
        return { ...segment, speaker: newName };
      }
      return segment;
    });
    setSegments(updatedSegments);
    updateUniqueSpeakers(updatedSegments);
  };

  useEffect(() => {
    if (typeof document !== 'undefined' && segments.length > 0) {
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
        const oldName = segment.speaker; // Get the old speaker name
        const newSpeakerName = prompt('Edit Speaker Name:', oldName);
        if (newSpeakerName && newSpeakerName.trim() !== '') {
          handleSpeakerNameChange(segment.segment_id, oldName, newSpeakerName);

          // Update the local state immediately
          setSegments((prevSegments) =>
            prevSegments.map((s) =>
              s.segment_id === segment.segment_id
                ? { ...s, speaker: newSpeakerName }
                : s
            )
          );
        }
      }
    }
    closeMenu();
  }, [menuState.segmentId, segments, handleSpeakerNameChange, closeMenu]);

  const handleCopySegment = useCallback(() => {
    const segment = segments.find((s) => s.segment_id === menuState.segmentId);
    if (segment && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(segment.transcribed_text);
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
        handleTranscribedTextChange(segments, segmentId, newText);
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
    <Card>
      <Link href='/speech' passHref>
        <Button
          icon='pi pi-arrow-left'
          label='Sentezleyici'
          className='p-button-text  p-button-plain'
        />
      </Link>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-4 w-10/12  px-4'>
          {isTranscriptionNameEditing ? (
            <textarea
              ref={editingRef}
              className='text-2xl w-full cursor-text min-w-52 font-bold p-2 rounded border focus:outline-none break-words whitespace-pre-wrap'
              rows={2}
              value={transcriptionName}
              onBlur={handleNameChange}
              onChange={(e) => setTranscriptionName(e.target.value)}
            />
          ) : (
            <h1
              className='text-2xl cursor-text min-w-52 font-bold break-words whitespace-pre-wrap'
              onClick={handleTranscriptionNameChange}
            >
              {transcriptionName}
            </h1>
          )}
        </div>

        <div className='flex space-x-2'>
          <div className='dropdown dropdown-end'>
            <label tabIndex={0} className='btn btn-primary btn-sm'>
              Konuşmacılar
            </label>
            <ul
              tabIndex={0}
              className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52'
            >
              {uniqueSpeakers.map((speaker) => (
                <li key={speaker}>
                  <a onClick={() => handleSpeakerClick(speaker)}>
                    <User size={16} />
                    {speaker}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <button
            className='btn btn-ghost btn-sm'
            onClick={() =>
              setViewMode(viewMode === 'inline' ? 'list' : 'inline')
            }
          >
            {viewMode === 'inline' ? (
              <AlignStartHorizontal size={20} />
            ) : (
              <AlignStartVertical size={20} />
            )}
          </button>
        </div>
      </div>

      <div
        ref={transcriptionRef}
        className=' rounded-box p-4 overflow-y-auto h-[600px]'
      >
        <AnimatePresence>
          {segments.map((segment, index) => {
            const isHighlighted =
              currentTime >= segment.start_time &&
              currentTime <= segment.end_time;
            const isHovered = hoveredSegmentId === segment.segment_id;

            return (
              <motion.div
                key={segment.segment_id}
                className={`${
                  viewMode === 'inline' ? 'inline-block' : 'block mb-2'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.1, delay: index * 0.01 }}
                ref={(el) => {
                  segmentRefs.current[segment.segment_id] = el;
                }}
              >
                <span className='badge badge-sm mr-1'>{segment.speaker}</span>
                <span
                  className='badge badge-sm badge-outline cursor-pointer mr-1'
                  onClick={(e) => showSegmentMenu(e, segment.segment_id)}
                  onMouseEnter={() => handleBadgeMouseEnter(segment.segment_id)}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {segment.start_time.toFixed(2)}s
                </span>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  className={`${
                    viewMode === 'list' ? 'block mt-1' : 'inline'
                  } focus:outline-none focus:bg-red-500 rounded p-1 transition-colors duration-200`}
                  style={{
                    backgroundColor: isHovered
                      ? 'rgba(191, 255, 0, 0.2)'
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
      </div>
      <SegmentMenu
        isOpen={menuState.isOpen}
        position={menuState.position}
        onClose={closeMenu}
        onDelete={handleDeleteSegment}
        onEdit={handleEditSegment}
        onCopy={handleCopySegment}
      />
    </Card>
  );
};

export default TextEditor;
