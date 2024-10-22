import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Nullable } from 'primereact/ts-helpers';
import { Transcript } from '@/types';
import ExportButtons from './export-buttons';
import { useRouter } from 'next/navigation';
import useStore from '@/library/store';
import createApi from '@/utils/axios_instance';
import ChatSideMenuSkeleton from '../ui/transcription-history-skeleton';
import CalendarComponent from '@/components/ui/calendar-component';
import { deleteTranscription } from '@/utils/transcription/transcription';
import { formatDate } from '@/utils/formatDate';

interface TranscriptionHistoryProps {
  activePageId?: string;
  activeTranscriptionName?: string; // Made optional
  setTranscriptionName?: (name: string) => void; // Made optional
}

const TranscriptionHistory: React.FC<TranscriptionHistoryProps> = ({
  activePageId,
  activeTranscriptionName,
  setTranscriptionName,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const transcriptions = useStore(
    (state: { transcriptions: Transcript[] }) => state.transcriptions
  );
  const setTranscriptions = useStore(
    (state: { setTranscriptions: (data: Transcript[]) => void }) =>
      state.setTranscriptions
  ); // Get the setter from Zustand store
  const router = useRouter();
  const pRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        const response = await api.get('/transcriptions/');
        const data: Transcript[] = await response.json();
        setTranscriptions(data); // Update Zustand store with the latest transcriptions
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch transcriptions:', error);
        setLoading(false);
      }
    };

    fetchTranscriptions();
  }, [setTranscriptions]); // Re-fetch transcriptions every time the component loads

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const screenHeight = window.innerHeight;
      let newItemsPerPage = 8; // default for smaller screens

      if (screenHeight > 950) {
        newItemsPerPage = 7;
      } else if (screenHeight >= 800 && screenHeight <= 950) {
        newItemsPerPage = 6;
      } else {
        if (containerRef.current) {
          const containerHeight = containerRef.current.offsetHeight;
          newItemsPerPage = Math.max(1, Math.floor(containerHeight / 100) * 2);
        }
      }

      setItemsPerPage(newItemsPerPage);
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);

    return () => {
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, []);

  useEffect(() => {
    if (activePageId) {
      localStorage.setItem('activeTranscriptionId', activePageId);
    }
  }, [activePageId]);

  const availableDates = Array.from(
    new Set(
      transcriptions.map(
        (transcription: Transcript) => new Date(transcription.created_at)
      )
    )
  ) as Date[]; // Explicitly cast to Date[]

  availableDates.sort((a: Date, b: Date) => a.getTime() - b.getTime());

  const minDate = availableDates.length > 0 ? availableDates[0] : new Date();

  const filteredTranscriptions = selectedDate
    ? transcriptions.filter(
        (transcription: Transcript) =>
          new Date(transcription.created_at).toDateString() ===
          selectedDate.toDateString()
      )
    : transcriptions;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTranscriptions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredTranscriptions.length / itemsPerPage);

  const handleBlur = (e: React.FocusEvent<HTMLParagraphElement>) => {
    const newName = e.currentTarget.textContent || '';
    const transcriptionId = renamingId;

    setIsRenameOpen(false);
    setRenamingId(null);

    if (activePageId === transcriptionId && setTranscriptionName) {
      setTranscriptionName(newName);
    }

    handleEditName(newName, transcriptionId || '');
  };

  const handleEditName = async (new_name: string, transcription_id: string) => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      await api.put(`transcriptions/${transcription_id}`, { name: new_name });
    } catch (error) {
      console.error('Failed to rename transcription:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pRef.current?.blur();
    }
  };

  return (
    <div
      className='h-full sticky top-0 border-gray-200 min-h-[92vh] overflow-y-auto'
      ref={containerRef}
    >
      {loading ? (
        <ChatSideMenuSkeleton />
      ) : (
        <div className='py-4 px-4'>
          <div className='w-full'>
            <h2 className='text-lg  font-semibold mb-4 text-gray-700'>
              Geçmiş Sentezler
            </h2>
            <CalendarComponent
              localStorageSaveName='transcriptionFilter'
              availableDates={availableDates as Date[]}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
          <ul className='space-y-2 mt-4'>
            {currentItems.length === 0 ? (
              <p className='text-center text-sm text-gray-400'>
                No records found.
              </p>
            ) : (
              currentItems.map((transcription: Transcript) => (
                <li key={transcription._id}>
                  <div
                    className={`p-3 flex hover:bg-gray-200 hover:cursor-pointer cursor-pointer justify-between items-center rounded-lg transition-all duration-300 ${
                      transcription._id === activePageId
                        ? 'bg-gradient-to-br  from-primary via-primary to-purple-600 text-white shadow-lg ring-2 ring-indigo-400 ring-offset-2'
                        : 'bg-gray-100 hover:cursor-pointer cursor-pointer hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <Link
                      href={`/transcriptions?id=${transcription._id}`}
                      passHref
                    >
                      <span
                        className='flex-grow renaming-editable'
                        onClick={(e) => {
                          if (
                            isRenameOpen &&
                            renamingId === transcription._id
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <p
                          className={`text-sm font-medium content-editable ${
                            isRenameOpen && renamingId === transcription._id
                              ? 'bg-white text-black'
                              : ''
                          }`}
                          contentEditable={
                            isRenameOpen && renamingId === transcription._id
                          }
                          suppressContentEditableWarning={true}
                          ref={(el) => {
                            if (
                              el &&
                              isRenameOpen &&
                              renamingId === transcription._id
                            ) {
                              el.focus();
                              window.getSelection()?.selectAllChildren(el);
                            }
                          }}
                          onBlur={handleBlur}
                          onKeyDown={handleKeyDown}
                          style={{
                            maxWidth: '200px',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {isRenameOpen && renamingId === transcription._id
                            ? activeTranscriptionName || transcription.name
                            : (transcription._id === activePageId
                                ? activeTranscriptionName || transcription.name
                                : transcription.name
                              ).length > 45
                            ? `${(transcription._id === activePageId
                                ? activeTranscriptionName || transcription.name
                                : transcription.name
                              ).slice(0, 45)}...`
                            : transcription._id === activePageId
                            ? activeTranscriptionName || transcription.name
                            : transcription.name}
                        </p>

                        <p className='text-xs font-medium truncate opacity-75'>
                          {transcription._id}
                        </p>
                        <p className='text-xs mt-1 opacity-75'>
                          {formatDate(transcription.created_at)}
                        </p>
                      </span>
                    </Link>

                    <span>
                      <ExportButtons
                        isActivePage={transcription._id === activePageId}
                        setTranscriptionNameEditing={() => {
                          setIsRenameOpen(true);
                          setRenamingId(transcription._id);
                        }}
                        isTranscriptionNameEditing={isRenameOpen}
                        data={transcription}
                        showDelete={true}
                        showExport={true}
                        showRename={true}
                        fileName='output'
                        handleDeleteTranscription={async () =>
                          await deleteTranscription(transcription._id).then(
                            () => {
                              router.push('/');
                            }
                          )
                        }
                      />
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
          {totalPages > 1 && (
            <div className='mt-4 flex justify-between text-sm text-gray-600 px-2'>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className='disabled:text-gray-400'
              >
                Önceki
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className='disabled:text-gray-400'
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionHistory;
