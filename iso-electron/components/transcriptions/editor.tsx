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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/card';
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Change, Segment, Transcript } from '@/types';
import { Ellipsis } from 'lucide-react';
import { Menu } from 'primereact/menu';
import ExportButtons from './export-buttons';
import { Kbd } from '@nextui-org/react';
import { debounce } from '@/utils/debounce';
import SingleRenameDialog from './dialog-single';
import CustomDialog from './dialog-single';
import ChangeAllNamesDialog from './dialog-multiple';
import Tooltip from '../ui/tool-tip';
import { BsLayoutTextWindow } from 'react-icons/bs';

const SegmentMenu = dynamic(() => import('./segment-menu'), { ssr: false });

interface TextEditorProps {
  transcriptionName: string;
  setTranscriptionName: React.Dispatch<React.SetStateAction<string>>;
  transcription: Transcript | null;
  editingRef: RefObject<HTMLTextAreaElement>;
  handleEditName?: (newName: string) => void;
  // handleColorChange?: (speaker: string, color: string) => void;
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
  setCurrentTime: (currentTime: number) => void;
  // speakerColors: Record<string, string>;
  setChanges: React.Dispatch<React.SetStateAction<Change[]>>;
  changes: Change[];
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
  // speakerColors,
  editingRef,
  // handleColorChange,
  changes,
  transcriptionName,
  setTranscriptionName,
  handleEditName = () => {},
  handleDeleteSelected = () => {},
  handleSpeakerNameChange = () => {},
  handleTranscribedTextChange = () => {},
  transcriptionRef,
  handleDeleteTranscription = () => {},
  currentTime,
  setCurrentTime,
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
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const [segments, setSegments] = useState<Segment[]>(
    transcription?.segments || []
  );
  const [uniqueSpeakers, setUniqueSpeakers] = useState<string[]>([]);
  const [speakerColors, setSpeakerColors] = useState<Record<string, string>>(
    () => {
      const storedColors = localStorage.getItem('speakerColors');
      const colorsArray = storedColors ? JSON.parse(storedColors) : [];
      const transcriptionColors = colorsArray.find(
        (entry: any) => entry.transcription_id === transcription?._id
      );
      return transcriptionColors ? transcriptionColors.colors : {};
    }
  );

  const handleColorChange = (speaker: string, color: string) => {
    setSpeakerColors((prevColors) => ({
      ...prevColors,
      [speaker]: color,
    }));
    setSaveState('needs saving');
  };

  useEffect(() => {
    const storedColors = localStorage.getItem('speakerColors');
    const colorsArray = storedColors ? JSON.parse(storedColors) : [];

    // Filter out any existing entry for this transcription
    const updatedColorsArray = colorsArray.filter(
      (entry: any) => entry.transcription_id !== transcription?._id
    );

    // Add the updated colors for this transcription
    updatedColorsArray.push({
      transcription_id: transcription?._id,
      colors: speakerColors,
    });

    // Save back to localStorage
    localStorage.setItem('speakerColors', JSON.stringify(updatedColorsArray));
  }, [speakerColors, transcription?._id]);
  const [showFullText, setShowFullText] = useState<boolean>(false);
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
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    null
  );

  const segmentRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  useEffect(() => {
    console.log(speakerColors);
  }, [speakerColors]);
  useEffect(() => {
    setTranscriptionName(transcription?.name || '');
    setSegments(transcription?.segments || []);
    updateUniqueSpeakers(transcription?.segments || []);
  }, [transcription]);

  // useEffect(() => {
  //   setChanges(
  //     segments.map((segment) => ({
  //       segmentId: segment.id,
  //       initialText: segment.text,
  //       currentText: segment.text,
  //     }))
  //   );
  // }, [segments]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const updateUniqueSpeakers = (segments: Segment[]) => {
    const speakers = Array.from(
      new Set(segments.map((segment) => segment.speaker))
    );
    setUniqueSpeakers(speakers);
  };
  // const handleColorChange = (speaker: string, color: string) => {
  //   setSpeakerColors((prevColors) => ({
  //     ...prevColors,
  //     [speaker]: color,
  //   }));
  //   setSaveState('needs saving');
  // };

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
    console.log(`Focusing on segment ID: ${segmentId}`);

    const segmentText = segmentRefs.current[segmentId]?.innerText || '';

    setChanges((prevChanges: Change[]) => {
      const existingIndex = prevChanges.findIndex(
        (change) => change.segmentId === segmentId
      );

      if (existingIndex !== -1) {
        console.log(`Updating existing change for segment ID: ${segmentId}`);

        // Update the existing change only if the current text is different from the initial text
        const updatedChanges = [...prevChanges];

        if (updatedChanges[existingIndex].initialText !== segmentText) {
          updatedChanges[existingIndex].currentText = segmentText;
        }

        return updatedChanges;
      }

      console.log(`Adding new change for segment ID: ${segmentId}`);

      // Add a new change if not found
      return [
        ...prevChanges,
        { segmentId, initialText: segmentText, currentText: segmentText },
      ];
    });
  }, []);

  const handleInputSegment = useCallback(
    (segmentId: string) => {
      const currentText = segmentRefs.current[segmentId]?.innerText || '';
      setChanges((prevChanges: Change[]) => {
        const existingIndex = prevChanges.findIndex(
          (change) => change.segmentId === segmentId
        );
        if (existingIndex !== -1) {
          // Update the existing change
          const updatedChanges = [...prevChanges];
          updatedChanges[existingIndex].currentText = currentText;
          return updatedChanges;
        }

        // If no existing change, add a new one
        return [
          ...prevChanges,
          { segmentId, initialText: currentText, currentText: currentText },
        ];
      });

      // Check for differences to set the save state correctly
      const initialText =
        changes.find((change: Change) => change.segmentId === segmentId)
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
    console.log(changes);
  }, [changes]);
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     saveChanges();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, [saveChanges]);

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
  useEffect(() => {
    if (activeSegment) {
      setCurrentTime(segments.find((s) => s.id === activeSegment)?.start || 0);
    }
  }, [activeSegment, segments]);

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
            showDelete={true}
            showExport={true}
            showRename={true}
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
              <h1 className='text-2xl font-bold break-words whitespace-pre-wrap max-w-[40vw] overflow-hidden text-ellipsis'>
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
          <button
            className='btn btn-primary btn-sm flex gap-2'
            onClick={() => setShowFullText((prev) => !prev)}
          >
            {showFullText ? 'Tüm Metin' : 'Segmentler'}
          </button>
          <div className='dropdown dropdown-end'>
            <Tooltip
              placement='top-end'
              content='Konuşmacıları görüntüle, vurgu renklerini ayarla veya tüm segmentlerde konuşmacı adlarını değiştir'
            >
              <button
                tabIndex={0}
                className='btn btn-primary btn-sm flex gap-2'
              >
                <span>Konuşmacılar</span>
              </button>
            </Tooltip>

            <ul
              tabIndex={0}
              className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52'
            >
              {uniqueSpeakers.map((speaker) => (
                <li key={speaker}>
                  <Tooltip
                    placement='left'
                    content={`${speaker} adlı konuşmacıyı değiştirmek için tıklayın veya vurgu rengini ayarlayın`}
                  >
                    <button
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).tagName.toLowerCase() !==
                          'input'
                        ) {
                          handleSpeakerClick(speaker);
                        }
                      }}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center'>
                        <User size={16} />
                        <span className={`ml-2`}>{speaker}</span>
                      </div>
                      <input
                        type='color'
                        value={speakerColors[speaker] || '#000000'}
                        onChange={(e) =>
                          handleColorChange(speaker, e.target.value)
                        }
                        className='w-6 h-6 border-none cursor-pointer'
                      />
                    </button>
                  </Tooltip>
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

      <div className='text-editor'>
        {showFullText ? (
          <div className='full-text p-4'>{transcription?.text}</div>
        ) : (
          <div
            ref={transcriptionRef}
            className='rounded-box p-4 overflow-y-auto h-[600px]'
          >
            <AnimatePresence>
              {segments.map((segment, index) => {
                const isHighlighted =
                  currentTime >= segment.start && currentTime <= segment.end;

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
                        activeSegment === segment.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary hover:text-white'
                      } transition-all duration-200 ease-in-out badge-sm badge-outline cursor-pointer mr-1 font-semibold text-indigo-600  px-2 py-1 rounded`}
                      onClick={(e) => showSegmentMenu(e, segment.id)}
                      onMouseEnter={() => handleBadgeMouseEnter(segment.id)}
                      onMouseLeave={handleBadgeMouseLeave}
                    >
                      {viewMode === 'list' ? 'Konuşmacı : ' : ''}
                      {segment.speaker}
                    </span>
                    <span
                      className={` ${
                        activeSegment === segment.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary hover:text-white'
                      } badge badge-sm badge-outline cursor-pointer mr-1 font-semibold text-indigo-600  px-2 py-2 rounded`}
                      onClick={() => {
                        setCurrentTime(segment.start);
                        setActiveSegment(segment.id);
                      }}
                    >
                      {viewMode === 'list' ? 'Başlangıç : ' : ''}
                      {segment.start.toFixed(2)}s
                    </span>
                    {viewMode === 'list' && (
                      <span
                        className={` ${
                          activeSegment === segment.id
                            ? 'bg-primary text-white'
                            : 'hover:bg-primary hover:text-white'
                        } badge badge-sm badge-outline cursor-pointer mr-1 font-semibold text-indigo-600  px-2 py-2 rounded`}
                        onClick={() => {
                          setCurrentTime(segment.start);
                          setActiveSegment(segment.id);
                        }}
                      >
                        {viewMode === 'list' ? 'Bitiş : ' : ''}
                        {segment.end.toFixed(2)}s
                      </span>
                    )}
                    <span
                      ref={(el) => {
                        segmentRefs.current[segment.id] = el as HTMLSpanElement;
                      }}
                      contentEditable
                      style={{
                        backgroundColor: isHighlighted
                          ? `${speakerColors[segment.speaker]}20`
                          : 'transparent',
                        transition: 'background-color 0.3s ease',
                      }}
                      suppressContentEditableWarning
                      className={`
    ${viewMode === 'list' ? 'block mt-1' : 'inline'}
    focus:outline-none rounded-xl 
    p-1 transition-colors duration-200
  `}
                      onClick={(e) => {
                        const selection = window.getSelection();
                        const range = document.createRange();

                        if (selectedSegmentId === segment.id) {
                          // If already selected, allow cursor placement at clicked position
                          if (selection && e.target instanceof Node) {
                            const { clientX } = e.nativeEvent;
                            const rect = (
                              e.target as HTMLElement
                            ).getBoundingClientRect();
                            const relativeX = clientX - rect.left;

                            let charIndex = 0;
                            let totalWidth = 0;

                            const textNode = e.target.firstChild;
                            if (textNode instanceof Text) {
                              for (let i = 0; i < textNode.length; i++) {
                                range.setStart(textNode, i);
                                range.setEnd(textNode, i + 1);
                                const rangeRect = range.getBoundingClientRect();
                                const charWidth = rangeRect.width;

                                if (totalWidth + charWidth > relativeX) {
                                  charIndex = i;
                                  break;
                                }
                                totalWidth += charWidth;
                              }
                              range.setStart(textNode, charIndex);
                              range.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(range);
                            }
                          }
                          setSelectedSegmentId(null); // Deselect the text for cursor placement
                        } else {
                          // Select the entire text initially
                          setSelectedSegmentId(segment.id);
                          range.selectNodeContents(e.currentTarget);
                          selection?.removeAllRanges();
                          selection?.addRange(range);
                        }
                      }}
                      onInput={() => {
                        handleInputSegment(segment.id);
                        setSelectedSegmentId(null); // Deselect to allow text editing
                      }}
                      onFocus={() => handleFocusSegment(segment.id)}
                    >
                      {segment.text}
                    </span>

                    {viewMode === 'list' && <br />}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
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

      <ChangeAllNamesDialog
        visible={showDialog}
        dialogData={dialogData}
        setDialogData={setDialogData}
        onHide={() => setShowDialog(false)}
        onConfirm={confirmChangeSpeakerName}
      />

      <SingleRenameDialog
        visible={showSingleRenameDialog}
        singleRenameData={singleRenameData}
        setSingleRenameData={setSingleRenameData}
        onHide={() => setShowSingleRenameDialog(false)}
        onConfirm={confirmSingleRename}
      />
    </Card>
  );
};

export default TextEditor;
