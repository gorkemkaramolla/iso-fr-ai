import React, { useState, useCallback, RefObject } from 'react';
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
  uniqueSpeakers: string[];
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
  uniqueSpeakers,
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
    console.log('Delete segment:', menuState.segmentId);
    closeMenu();
  }, [menuState.segmentId, closeMenu]);

  const handleEditSegment = useCallback(() => {
    console.log('Edit segment:', menuState.segmentId);
    closeMenu();
  }, [menuState.segmentId, closeMenu]);

  const handleCopySegment = useCallback(() => {
    const segment = transcription?.segments.find(
      (s) => s.segment_id === menuState.segmentId
    );
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
  }, [menuState.segmentId, transcription?.segments, closeMenu]);

  const handleBlur = useCallback(
    (
      segmentId: string,
      originalText: string,
      e: React.FocusEvent<HTMLSpanElement>
    ) => {
      const newText = e.currentTarget.textContent || '';
      if (newText !== originalText) {
        handleTranscribedTextChange(segmentId, newText);
      }
    },
    [handleTranscribedTextChange]
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
          <h1 className='text-xl font-extrabold p-4'>{transcription?.name}</h1>
          <div className='relative flex items-center'>
            <button onClick={() => setIsEditing(!isEditing)}>
              <EllipsisVertical />
            </button>
            {isEditing && (
              <ul className='menu menu-horizontal w-full bg-base-200 rounded-box'>
                <li>
                  <a
                    className='tooltip tooltip-right'
                    data-tip='Konuşma Sentezinin adını değiştir '
                  >
                    <SquarePen />
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleGetExcel}
                    className='tooltip tooltip-right'
                    data-tip='Excel Dosyası Olarak İndir'
                  >
                    <FileX />
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleGetJSON}
                    className='tooltip tooltip-right'
                    data-tip='JSON Olarak İndir'
                  >
                    <FileJson />
                  </a>
                </li>
                <li>
                  <a
                    onClick={handleTranscriptionDelete}
                    className='tooltip tooltip-right text-red-600'
                    data-tip='Transkripsiyonu Sil'
                  >
                    <Trash2 />
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className='flex justify-end space-x-2 mb-4'>
        <button
          className='p-button-sm'
          onClick={() => setViewMode(viewMode === 'inline' ? 'list' : 'inline')}
        >
          {viewMode === 'inline' ? (
            <AlignStartHorizontal />
          ) : (
            <AlignStartVertical />
          )}
        </button>
      </div>

      <div
        ref={transcriptionRef}
        className='bg-white rounded shadow p-4 overflow-y-scroll h-[600px]'
      >
        <div className='flex w-full justify-around py-2'>
          <div>
            <input
              type='checkbox'
              checked={
                selectedSegments.length === transcription?.segments.length
              }
              onChange={handleSelectAll}
              name='selectall'
            />
            <label htmlFor='selectall' className='ml-2'>
              Hepsini Seç
            </label>
          </div>
          {uniqueSpeakers.map((speaker) => (
            <div key={speaker} className='flex gap-1'>
              <input
                type='checkbox'
                checked={selectedSpeakers.includes(speaker)}
                onChange={() => handleSelectSpeaker(speaker)}
                name={`select-${speaker}`}
              />
              <label htmlFor={`select-${speaker}`} className='ml-2'>
                {speaker}
              </label>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {transcription?.segments.map((segment, index) => {
            const isHighlighted =
              currentTime >= segment.start_time &&
              currentTime <= segment.end_time;
            const isActiveSegment = menuState.segmentId === segment.segment_id;
            const isHovered = hoveredSegmentId === segment.segment_id;

            return (
              <motion.div
                key={segment.segment_id}
                className={viewMode === 'inline' ? 'inline' : 'block mb-2'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                style={{
                  backgroundColor: isHovered ? '#bfff00' : undefined,
                }}
              >
                <span
                  onClick={(e) => showSegmentMenu(e, segment.segment_id)}
                  className={`${
                    isActiveSegment ? 'bg-gray-500 text-white' : 'text-gray-400'
                  }  cursor-pointer badge text-sm`}
                  onMouseEnter={() => handleBadgeMouseEnter(segment.segment_id)}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {segment.start_time.toFixed(2)}s -{' '}
                  {segment.end_time.toFixed(2)}s
                </span>

                <span
                  contentEditable
                  suppressContentEditableWarning
                  className={`focus:outline-none focus:bg-gray-100 rounded transition-colors duration-200 ${
                    viewMode === 'list' ? 'block' : 'inline'
                  }`}
                  style={{
                    backgroundColor: isHighlighted
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
