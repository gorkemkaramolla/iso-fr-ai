'use client';

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
  X,
  Terminal,
  User,
  Edit,
  CheckCircle,
  Info,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/card';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Changes, Segment, Transcript } from '@/types';
import { Ellipsis } from 'lucide-react';
import { Menu } from 'primereact/menu';
import ExportButtons from './export-buttons';
import { Kbd } from '@nextui-org/react';
import { debounce } from '@/utils/debounce';

const SegmentMenu = dynamic(() => import('./segment-menu'), { ssr: false });

interface TextEditorProps {
  transcription: Transcript | null;
  editingRef: RefObject<HTMLTextAreaElement>;
  handleEditName?: (newName: string) => void;
  handleDeleteTranscription?: () => void;
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
  setChanges: React.Dispatch<React.SetStateAction<Changes[]>>;
  changes: Changes[];
  saveState: 'no changes made' | 'needs saving' | 'saved' | 'save failed';
  setSaveState: React.Dispatch<
    React.SetStateAction<
      'no changes made' | 'needs saving' | 'saved' | 'save failed'
    >
  >;
}

interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  segmentId: string | null;
}

const TextEditor: React.FC<TextEditorProps> = ({
  transcription,
  setChanges,
  speakerColors,
  editingRef,
  changes,
  handleEditName = () => {},
  handleDeleteSelected = () => {},
  handleSpeakerNameChange = () => {},
  handleTranscribedTextChange = () => {},
  transcriptionRef,
  handleDeleteTranscription = () => {},
  currentTime,
  saveState,
  setSaveState,
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
  const spanRef = useRef<HTMLSpanElement>(null);

  const [segments, setSegments] = useState<Segment[]>(
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

  const segmentRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    setTranscriptionName(transcription?.name || '');
    setSegments(transcription?.segments || []);
    updateUniqueSpeakers(transcription?.segments || []);
  }, [transcription]);

  useEffect(() => {
    setChanges(
      segments.map((segment) => ({
        segmentId: segment.id,
        initialText: segment.text,
        currentText: segment.text,
      }))
    );
  }, [segments]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const updateUniqueSpeakers = (segments: Segment[]) => {
    const speakers = Array.from(
      new Set(segments.map((segment) => segment.speaker))
    );
    setUniqueSpeakers(speakers);
  };

  const handleNameChange = useCallback(
    debounce(() => {
      const newName = editingRef.current?.value || transcriptionName;
      setTranscriptionName(newName);
      if (handleEditName) {
        handleEditName(newName);
      }
      setIsTranscriptionNameEditing(false);
      setSaveState('needs saving');
    }, 300),
    [transcriptionName, handleEditName, setSaveState]
  );

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

  const handleFocusSegment = useCallback((segmentId: string) => {
    const segmentText = segmentRefs.current[segmentId]?.innerText || '';
    setChanges((prevChanges: Changes[]) => [
      ...prevChanges,
      { segmentId, initialText: segmentText, currentText: segmentText },
    ]);
  }, []);

  const handleInputSegment = useCallback(
    (segmentId: string) => {
      const currentText = segmentRefs.current[segmentId]?.innerText || '';
      setChanges((prevChanges: Changes[]) =>
        prevChanges.map((change) =>
          change.segmentId === segmentId ? { ...change, currentText } : change
        )
      );
      const initialText =
        changes.find((change: Changes) => change.segmentId === segmentId)
          ?.initialText || '';

      if (currentText !== initialText) {
        setSaveState('needs saving');
      }
    },
    [changes, setSaveState]
  );

  const saveChanges = useCallback(() => {
    if (saveState === 'needs saving') {
      // Here you should invoke your save API or logic
      setSaveState('saved');
      setTimeout(() => setSaveState('no changes made'), 2000);
    }
  }, [saveState, setSaveState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const saveShortcut = isMac
        ? event.metaKey && event.key === 's'
        : event.ctrlKey && event.key === 's';

      if (saveShortcut) {
        event.preventDefault();
        saveChanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveChanges]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveChanges();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveChanges]);

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
        handleSpeakerNameChange(segment.id.toString(), oldName, newName);
        return { ...segment, speaker: newName };
      }
      return segment;
    });
    setSegments(updatedSegments);
    updateUniqueSpeakers(updatedSegments);
    setSaveState('needs saving');
  };

  useEffect(() => {
    const currentRef = editingRef.current;
    if (currentRef) {
      currentRef.focus();
      currentRef.select();
    }
  }, [editingRef, isTranscriptionNameEditing]);

  useEffect(() => {
    if (typeof document !== 'undefined' && segments.length > 0) {
      const activeSegment = segments.find(
        (segment) => currentTime >= segment.start && currentTime <= segment.end
      );
      if (activeSegment && segmentRefs.current[activeSegment.id]) {
        const element = segmentRefs.current[activeSegment.id];
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
      if (segment.id === segmentId && segment.speaker === oldName) {
        handleSpeakerNameChange(segment.id, oldName, newName);
        return { ...segment, speaker: newName };
      }
      return segment;
    });

    setSegments(updatedSegments);
    updateUniqueSpeakers(updatedSegments);
    setSaveState('needs saving');
  };

  const handleEditSegment = useCallback(() => {
    if (menuState.segmentId) {
      const segment = segments.find((s) => s.id === menuState.segmentId);
      if (segment) {
        setSingleRenameData({
          segmentId: segment.id,
          oldName: segment.speaker,
          newName: '',
        });
        setShowSingleRenameDialog(true);
      }
    }
    closeMenu();
  }, [menuState.segmentId, segments, closeMenu]);

  const handleCopySegment = useCallback(() => {
    const segment = segments.find((s) => s.id === menuState.segmentId);
    if (segment && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(segment.text);
    }
    closeMenu();
  }, [menuState.segmentId, segments, closeMenu]);

  const handleBadgeMouseEnter = useCallback((segmentId: string) => {
    setHoveredSegmentId(segmentId);
  }, []);

  const handleBadgeMouseLeave = useCallback(() => {
    setHoveredSegmentId(null);
  }, []);

  return (
    <Card>
      <div className='fixed bottom-4 left-4 z-50'>
        <AnimatePresence>
          {saveState === 'saved' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-lg'
            >
              <CheckCircle size={18} />
              <span className='font-medium'>Değişiklikler Kaydedildi</span>
            </motion.div>
          )}
          {saveState === 'no changes made' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full shadow-lg'
            >
              <Info size={18} />
              <span className='font-medium'>Değişiklik Yok</span>
            </motion.div>
          )}
          {saveState === 'needs saving' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow-lg'
            >
              <AlertCircle size={18} />
              <span className='font-medium'>
                Kaydetmek için{' '}
                <kbd className='px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg'>
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + S
                </kbd>{' '}
                tuşuna basınız
              </span>
            </motion.div>
          )}
          {saveState === 'save failed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-full shadow-lg'
            >
              <XCircle size={18} />
              <span className='font-medium'>Save Failed</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className='flex justify-between'>
        <Link href='/speech' passHref>
          <Button
            icon='pi pi-arrow-left'
            label='Sentezleyici'
            className='p-button-text p-button-plain'
          />
        </Link>

        <div className='flex-col-reverse flex md:flex-row items-start md:items-center md:justify-between mb-4'>
          <ExportButtons
            handleDeleteTranscription={handleDeleteTranscription}
            isTranscriptionNameEditing={isTranscriptionNameEditing}
            setTranscriptionNameEditing={setIsTranscriptionNameEditing}
            data={transcription}
            fileName='output'
          />
        </div>
      </div>

      <div className='flex md:items-center space-x-4 w-full px-4'>
        <div className='relative w-full  group'>
          {isTranscriptionNameEditing ? (
            <textarea
              ref={editingRef}
              className='text-2xl w-full  min-w-52 my-2 font-bold p-2 rounded border focus:outline-none break-words whitespace-pre-wrap'
              rows={2}
              value={transcriptionName}
              onChange={(e) => {
                setSaveState('needs saving');
                setTranscriptionName(e.target.value);
              }}
              onBlur={handleNameChange}
            />
          ) : (
            <div
              onClick={handleTranscriptionNameChange}
              className='group inline-flex items-center gap-2 p-2 rounded transition-all duration-200 hover:bg-gray-100'
            >
              <h1 className='text-2xl font-bold break-words whitespace-pre-wrap'>
                {transcriptionName}
              </h1>
              <div className='opacity-0 cursor-pointer transition-opacity duration-200 group-hover:opacity-100'>
                <Edit
                  className='text-gray-500 cursor-pointer hover:text-gray-700'
                  size={24}
                />
              </div>
            </div>
          )}
        </div>

        <div className='flex md:flex-row self-center flex-row-reverse space-x-2'>
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
            <motion.div
              animate={{
                rotate: viewMode === 'inline' ? 0 : 90,
                rotateY: viewMode === 'inline' ? 0 : 360,
              }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'inline' ? (
                <AlignStartHorizontal className='' size={20} />
              ) : (
                <AlignStartHorizontal size={20} />
              )}
            </motion.div>
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
              currentTime >= segment.start && currentTime <= segment.end;
            const isHovered = hoveredSegmentId === segment.id;

            return (
              <motion.div
                key={segment.id}
                className={`${
                  viewMode === 'inline' ? 'inline-block' : 'block mb-2'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.1, delay: index * 0.01 }}
                ref={(el) => {
                  segmentRefs.current[segment.id] = el;
                }}
              >
                <span
                  className={`badge ${
                    menuState.segmentId === segment.id
                      ? 'bg-neutral text-white'
                      : 'hover:bg-neutral hover:text-white'
                  } transition-all duration-200 ease-in-out badge-sm badge-outline cursor-pointer mr-1`}
                  onClick={(e) => showSegmentMenu(e, segment.id)}
                  onMouseEnter={() => handleBadgeMouseEnter(segment.id)}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {segment.speaker}
                </span>
                <span
                  className='badge badge-sm badge-outline cursor-pointer mr-1'
                  onMouseEnter={() => handleBadgeMouseEnter(segment.id)}
                  onMouseLeave={handleBadgeMouseLeave}
                >
                  {segment.start.toFixed(2)}s
                </span>
                <span
                  ref={(el) => {
                    segmentRefs.current[segment.id] = el as HTMLSpanElement;
                  }}
                  contentEditable
                  style={{
                    backgroundColor: isHovered
                      ? 'rgba(191, 255, 0, 0.2)'
                      : isHighlighted
                      ? speakerColors[segment.speaker]
                      : 'transparent',
                  }}
                  suppressContentEditableWarning
                  className={`
    ${viewMode === 'list' ? 'block mt-1' : 'inline'}
    focus:outline-none focus:bg-red-50 rounded-xl 
    p-1 transition-colors duration-200
  `}
                  onFocus={() => handleFocusSegment(segment.id)}
                  onInput={() => handleInputSegment(segment.id)}
                >
                  {segment.text}
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
        segmentId={menuState.segmentId ?? ''}
        oldName={
          segments.find((s) => s.id === menuState.segmentId)?.speaker ?? ''
        }
      />

      <Dialog
        visible={showDialog}
        style={{ width: '50vw' }}
        header='İsim değişikliği onayı'
        modal
        footer={
          <div>
            <Button
              label='İptal'
              icon='pi pi-times'
              onClick={() => setShowDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Onayla'
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
            onChange={(e) => {
              setDialogData({ ...dialogData, newName: e.target.value });
            }}
            className='w-full mt-2'
          />
        </div>
      </Dialog>

      <Dialog
        visible={showSingleRenameDialog}
        style={{ width: '50vw' }}
        header='Konuşmacı ismi değiştirme'
        modal
        footer={
          <div>
            <Button
              label='İptal'
              icon='pi pi-times'
              onClick={() => setShowSingleRenameDialog(false)}
              className='p-button-text'
            />
            <Button
              label='Onayla'
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
            <strong>{`&lsquo;${singleRenameData.segmentId}&rsquo;`}</strong>{' '}
            ID&apos;li Konuşma alt segmentine ait{' '}
            <strong>{singleRenameData.oldName + ' '}</strong>
            konuşmacı adını değiştirmek üzeresiniz.
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
