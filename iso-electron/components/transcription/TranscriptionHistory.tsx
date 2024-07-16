'use client';
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import useStore from '@/library/store';
import api from '@/utils/axios_instance';
import createApi from '@/utils/axios_instance';
import { formatDate } from '@/utils/formatDate';

interface ApiResponse {
  transcription_id: string;
  created_at: string;
}

const ChatSideMenu: React.FC = () => {
  const [menuToggle, setMenuToggle] = useState(true);
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const getTranscriptions = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);

      const storedResponses = await api.get('/transcriptions/', {
        withCredentials: true,
      });
      const sortedData: ApiResponse[] = storedResponses.data.sort(
        (a: ApiResponse, b: ApiResponse) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setResponses(sortedData);
    } catch (error) {
      console.error('Failed to fetch transcriptions:', error);
    }
  };

  useEffect(() => {
    getTranscriptions();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = responses.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(responses.length / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className={`h-full sticky top-0 md:block hidden`}>
      {menuToggle && (
        <div className='py-4'>
          <h2 className='text-lg font-bold text-center'>Transkript Kaydı</h2>
          <div className='flex flex-col gap-3'>
            <ul className='menu w-full rounded-box'>
              {currentItems.map((response, index) => (
                <li key={index}>
                  <Link href={`/transcription/${response.transcription_id}`}>
                    <div className='dropdown flex text-sm items-center'>
                      <div
                        tabIndex={0}
                        role='button'
                        className='flex w-full gap-2'
                      >
                        <p className='flex gap-2 flex-col items-center'>
                          <div className='flex gap-1'>
                            <div className='w-full cursor-pointer'>
                              <span>ID = {response.transcription_id}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-1'>
                            <div className='badge-sm badge-primary badge'>
                              Tarih
                            </div>
                            <Calendar className='w-4 h-4' />
                            {formatDate(response.created_at)}
                          </div>
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className='join self-end justify-self-end bg-red-500'>
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`join-item btn ${
                    currentPage === number ? 'btn-active' : ''
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSideMenu;
