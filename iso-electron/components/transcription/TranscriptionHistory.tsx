'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import createApi from '@/utils/axios_instance';
import { formatDate } from '@/utils/formatDate';

interface ApiResponse {
  transcription_id: string;
  created_at: string;
}

const ChatSideMenu: React.FC = () => {
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTranscriptions = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const storedResponses = await api.get<ApiResponse[]>('/transcriptions/', {
        withCredentials: true,
      });
      const sortedData = storedResponses.data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setResponses(sortedData);
    } catch (error) {
      console.error('Transkriptler getirilemedi:', error);
    }
  };

  useEffect(() => {
    getTranscriptions();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = responses.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(responses.length / itemsPerPage);

  return (
    <div className='h-full sticky top-0 bg-white border-r border-gray-200 overflow-y-auto'>
      <div className='py-4 px-4'>
        <h2 className='text-lg font-semibold mb-4 text-gray-700'>
          Transkriptler
        </h2>
        <ul className='space-y-2'>
          {currentItems.map((response, index) => (
            <li key={index}>
              <Link href={`/transcription/${response.transcription_id}`}>
                <div className='p-2 hover:bg-gray-100 rounded transition-colors'>
                  <p className='text-sm font-medium text-gray-800 truncate'>
                    {response.transcription_id}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {formatDate(response.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
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
    </div>
  );
};

export default ChatSideMenu;
