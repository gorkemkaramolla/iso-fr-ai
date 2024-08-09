import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import createApi from '@/utils/axios_instance';
import { formatDate } from '@/utils/formatDate';
import ChatSideMenuSkeleton from '@/components/ui/transcription-history-skeleton';

type Transcript = {
  transcription_id: string;
  created_at: string;
  name: string;
};

type TranscriptionHistoryProps = {
  activePageId?: string;
};

const ChatSideMenu: React.FC<TranscriptionHistoryProps> = ({
  activePageId,
}) => {
  const [responses, setResponses] = useState<Transcript[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  const getTranscriptions = async () => {
    setLoading(true);
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const storedResponses = await api.get<Transcript[]>('/transcriptions/', {
        withCredentials: true,
      });
      const sortedData = storedResponses.data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setResponses(sortedData);
      if (sortedData.length < 8) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Transkriptler getirilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lastPage = localStorage.getItem('currentTranscriptionPage');
    if (lastPage) {
      setCurrentPage(Number(lastPage) || 1);
    }
  }, []);

  useEffect(() => {
    getTranscriptions();
  }, []);

  useEffect(() => {
    localStorage.setItem('currentTranscriptionPage', currentPage.toString());
  }, [currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = responses.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(responses.length / itemsPerPage);

  return (
    <div className='h-full sticky top-0 border-gray-200 overflow-y-auto'>
      {loading ? (
        <ChatSideMenuSkeleton />
      ) : (
        <div className='py-4 px-4'>
          <h2 className='text-lg font-semibold mb-4 text-gray-700'>Geçmiş</h2>
          <ul className='space-y-2'>
            {currentItems.length === 0 ? (
              <p className='text-center text-sm text-gray-500'>
                Henüz kayıt yok.
              </p>
            ) : (
              currentItems.map((response) => (
                <li key={response.transcription_id}>
                  <Link href={`/transcription/${response.transcription_id}`}>
                    <div
                      className={`p-2   rounded transition-colors ${
                        response.transcription_id === activePageId
                          ? 'bg-indigo-500 text-gray-100'
                          : 'hover:bg-indigo-100'
                      }`}
                    >
                      <p className='text-sm font-medium  truncate'>
                        {response.name}
                      </p>
                      <p className='text-sm font-medium  truncate'>
                        {response.transcription_id}
                      </p>
                      <p className='text-xs a mt-1'>
                        {formatDate(response.created_at)}
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
