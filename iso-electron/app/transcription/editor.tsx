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
import dynamic from 'next/dynamic';
import Card from '@/components/ui/card';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Segment } from '@/types';

const SegmentMenu = dynamic(() => import('./segment-menu'), { ssr: false });

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

  const [viewMode, setViewMode] = useState<'inline' | 'list'>(
    (typeof window !== 'undefined' &&
      (localStorage.getItem('viewMode') as 'inline' | 'list')) ||
      'inline'
  );
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
  const [showDialog, setShowDialog] = useState(false);
  const [showSingleRenameDialog, setShowSingleRenameDialog] = useState(false);
  const [dialogData, setDialogData] = useState<{
    oldName: string;
    newName: string;
  }>({ oldName: '', newName: '' });
  const [singleRenameData, setSingleRenameData] = useState<{
    segmentId: string;
    oldName: string;
    newName: string;
  }>({ segmentId: '', oldName: '', newName: '' });

  const segmentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setTranscriptionName(transcription?.name || '');
    setSegments(transcription?.segments || []);
    updateUniqueSpeakers(transcription?.segments || []);
  }, [transcription]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

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
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }, 0);
    }
  };

  const handleSpeakerClick = (speaker: string) => {
    setDialogData({ oldName: speaker, newName: '' });
    setShowDialog(true);
  };

  const confirmChangeSpeakerName = () => {
    handleChangeAllSpeakerNames(dialogData.oldName, dialogData.newName);
    setShowDialog(false);
  };

  const confirmSingleRename = () => {
    changeSpeakerName(
      singleRenameData.segmentId,
      singleRenameData.oldName,
      singleRenameData.newName
    );
    setShowSingleRenameDialog(false);
  };

  const handleChangeAllSpeakerNames = (oldName: string, newName: string) => {
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

  const changeSpeakerName = (
    segmentId: string,
    oldName: string,
    newName: string
  ) => {
    const updatedSegments = segments.map((segment) => {
      if (segment.segment_id === segmentId && segment.speaker === oldName) {
        handleSpeakerNameChange(segment.segment_id, oldName, newName);
        return { ...segment, speaker: newName };
      }
      return segment;
    });

    setSegments(updatedSegments);
    updateUniqueSpeakers(updatedSegments);
  };

  const handleEditSegment = useCallback(() => {
    if (menuState.segmentId) {
      const segment = segments.find(
        (s) => s.segment_id === menuState.segmentId
      );
      if (segment) {
        setSingleRenameData({
          segmentId: segment.segment_id,
          oldName: segment.speaker,
          newName: '',
        });
        setShowSingleRenameDialog(true);
      }
    }
    closeMenu();
  }, [menuState.segmentId, segments, closeMenu]);

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
      <div className='flex-col-reverse flex md:flex-row items-start md:items-center md:justify-between mb-4'>
        <div className='flex md:items-center  space-x-4 w-10/12  px-4'>
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

        <div className='flex md:flex-row self-end flex-row-reverse space-x-2'>
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
        className='rounded-box p-4 overflow-y-auto h-[600px]'
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
        onEdit={handleEditSegment} // Pass the handleEditSegment function here
        onCopy={handleCopySegment}
        segmentId={menuState.segmentId ?? ''} // Pass the correct segmentId
        oldName={
          segments.find((s) => s.segment_id === menuState.segmentId)?.speaker ??
          ''
        } // Pass the oldName
      />

      {/* PrimeReact Dialog for speaker name change (all segments) */}
      <Dialog
        visible={showDialog}
        style={{ width: '50vw' }}
        header='İsim değişikliği onayı'
        modal
        footer={
          <div>
            <Button
              label='Cancel'
              icon='pi pi-times'
              onClick={() => setShowDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Confirm'
              icon='pi pi-check'
              onClick={confirmChangeSpeakerName}
              autoFocus
            />
          </div>
        }
        onHide={() => setShowDialog(false)}
      >
        <div>
          <p>
            Seçilen
            <strong>{' ' + dialogData.oldName}</strong> adlı kullanıcıya ait tüm
            konuşma alt segmentlerini değiştirmek üzeresiniz
          </p>
          <InputText
            value={dialogData.newName}
            placeholder='Yeni isim'
            onChange={(e) =>
              setDialogData({ ...dialogData, newName: e.target.value })
            }
            className='w-full mt-2'
          />
        </div>
      </Dialog>

      {/* Dialog for single speaker rename */}
      <Dialog
        visible={showSingleRenameDialog}
        style={{ width: '50vw' }}
        header='Konuşmacı ismi değiştirme'
        modal
        footer={
          <div>
            <Button
              label='Cancel'
              icon='pi pi-times'
              onClick={() => setShowSingleRenameDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Confirm'
              icon='pi pi-check'
              onClick={confirmSingleRename}
              autoFocus
            />
          </div>
        }
        onHide={() => setShowSingleRenameDialog(false)}
      >
        <div>
          <p>
            <strong>{' ' + singleRenameData.oldName}</strong> adlı konuşmacının
            ismini değiştirmek üzeresiniz
          </p>
          <InputText
            value={singleRenameData.newName}
            placeholder='Yeni isim'
            onChange={(e) =>
              setSingleRenameData({
                ...singleRenameData,
                newName: e.target.value,
              })
            }
            className='w-full mt-2'
          />
        </div>
      </Dialog>
    </Card>
  );
};

export default TextEditor;
