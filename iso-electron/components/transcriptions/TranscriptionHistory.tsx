'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import createApi from '@/utils/axios_instance';
import { formatDate } from '@/utils/formatDate';
import ChatSideMenuSkeleton from '@/components/ui/transcription-history-skeleton';
import CalendarComponent from '@/components/ui/calendar-component'; // Adjust the import path accordingly
import { Nullable } from 'primereact/ts-helpers';
import { Transcript } from '@/types';

type TranscriptionHistoryProps = {
  activePageId?: string;
};

const ChatSideMenu: React.FC<TranscriptionHistoryProps> = ({
  activePageId,
}) => {
  const [transcriptions, setTranscriptions] = useState<Transcript[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getTranscriptions = async () => {
    setLoading(true);
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const storedResponses = await api.get('/transcriptions/', {});
      const data: Transcript[] = await storedResponses.json();
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTranscriptions(sortedData);

      // Set the latest available date as the default selected date
      if (sortedData.length > 0) {
        setSelectedDate(new Date(sortedData[0].created_at));
      }
    } catch (error) {
      console.error('Transkriptler getirilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTranscriptions();
  }, []);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Ensure at least 1 item per page
        const newItemsPerPage = Math.max(
          1,
          Math.floor(containerWidth / 100) * 2
        );
        setItemsPerPage(newItemsPerPage);
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);

    return () => {
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, []);

  // Load active transcription from localStorage and determine the correct page
  useEffect(() => {
    const storedActiveId = localStorage.getItem('activeTranscriptionId');
    if (storedActiveId && transcriptions.length > 0) {
      const activeIndex = transcriptions.findIndex(
        (transcription) => transcription._id === storedActiveId
      );

      if (activeIndex !== -1) {
        const calculatedPage = Math.ceil((activeIndex + 1) / itemsPerPage);
        setCurrentPage(calculatedPage);
      }
    }
  }, [transcriptions, itemsPerPage]);

  // Save the currently active transcription to localStorage whenever it changes
  useEffect(() => {
    if (activePageId) {
      localStorage.setItem('activeTranscriptionId', activePageId);
    }
  }, [activePageId]);

  // Extract unique available dates from transcriptions
  const availableDates = Array.from(
    new Set(
      transcriptions.map((transcription) => new Date(transcription.created_at))
    )
  ).sort((a, b) => a.getTime() - b.getTime());

  // Filter transcriptions based on the selected date
  const filteredTranscriptions = selectedDate
    ? transcriptions.filter(
        (transcription) =>
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

  return (
    <div
      className='h-full  sticky top-0 border-gray-200  overflow-y-auto'
      ref={containerRef}
    >
      {loading ? (
        <ChatSideMenuSkeleton />
      ) : (
        <div className='py-4 px-4'>
          <h2 className='text-lg font-semibold mb-4 text-gray-700'>Geçmiş</h2>
          <CalendarComponent
            localStorageSaveName='transcriptionFilter'
            availableDates={availableDates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
          <ul className='space-y-2 mt-4'>
            {currentItems.length === 0 ? (
              <p className='text-center text-sm text-gray-500'>
                Henüz kayıt yok.
              </p>
            ) : (
              currentItems.map((transcription) => (
                <li key={transcription._id}>
                  <Link href={`/transcriptions?id=${transcription._id}`}>
                    <div
                      className={`p-2 rounded transition-colors ${
                        transcription._id === activePageId
                          ? 'bg-primary text-gray-100'
                          : 'hover:bg-indigo-100'
                      }`}
                    >
                      <p className='text-sm   font-medium flex-wrap  flex '>
                        {transcription.name}
                      </p>
                      <p className='text-sm font-medium truncate'>
                        {transcription._id}
                      </p>
                      <p className='text-xs mt-1'>
                        {formatDate(transcription.created_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
          {totalPages > 1 && (
            <div className='mt-4 flex justify-between text-sm text-gray-600'>
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

export default ChatSideMenu;
