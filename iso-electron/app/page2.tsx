'use client';
import React, { useEffect, useState } from 'react';
import api from '@/utils/axios_instance';
import { binaryToMatch } from '@/config/binary';
import Image from 'next/image';
import createApi from '@/utils/axios_instance';

export default function Home() {
  const [personels, setPersonels] = useState<Personel[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(8);

  useEffect(() => {
    const fetchPersonels = async () => {
      const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
      const response = await api.get('/users');

      setPersonels(response.data);
    };

    fetchPersonels();
  }, []);

  // Calculate pagination
  const indexOfLastPersonel = currentPage * rowsPerPage;
  const indexOfFirstPersonel = indexOfLastPersonel - rowsPerPage;
  const currentPersonels = personels.slice(
    indexOfFirstPersonel,
    indexOfLastPersonel
  );
  const totalPages = Math.ceil(personels.length / rowsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Create pagination range
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const renderPageNumbers = () => {
    const maxPageButtons = 5;
    const halfRange = Math.floor(maxPageButtons / 2);
    let startPage = Math.max(1, currentPage - halfRange);
    let endPage = Math.min(totalPages, currentPage + halfRange);

    if (currentPage <= halfRange) {
      endPage = Math.min(totalPages, maxPageButtons);
    }

    if (currentPage + halfRange >= totalPages) {
      startPage = Math.max(1, totalPages - maxPageButtons + 1);
    }

    const pageButtons = [];
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`btn ${currentPage === i ? 'btn-active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <>
        {startPage > 1 && (
          <>
            <button onClick={() => paginate(1)} className='btn'>
              First
            </button>
            {startPage > 2 && <span className='btn'>...</span>}
          </>
        )}
        {pageButtons}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className='btn'>...</span>}
            <button onClick={() => paginate(totalPages)} className='btn'>
              Last
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <div className='flex w-screen container mx-auto flex-col relative h-[93vh]'>
      <div className='overflow-x-auto'>
        <table className='table w-full'>
          <thead>
            <tr>
              {personels[0] &&
                Object.keys(personels[0]).map((key) => (
                  <th key={key} className='px-4 py-2'>
                    {key}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {currentPersonels.map((personel) =>
              personel['FOTO_BINARY_DATA'] !== binaryToMatch ? (
                <tr key={personel.PERSONEL_ID}>
                  {Object.keys(personel).map((key) => (
                    <td key={key} className={`px-4 py-2 `}>
                      {key === 'FOTO_BINARY_DATA' &&
                      personel[key] !== binaryToMatch ? (
                        <div className='avatar'>
                          <div className='w-12 h-12 rounded-full'>
                            <Image
                              width={1000}
                              height={1000}
                              src={`data:${
                                personel.FOTO_DOSYA_TIPI
                              };base64,${Buffer.from(
                                personel[key],
                                'hex'
                              ).toString('base64')}`}
                              alt='personnel'
                            />
                          </div>
                        </div>
                      ) : key === 'OZGECMIS' ? (
                        <span className='truncate'>{personel[key]}</span>
                      ) : (
                        personel[key]
                      )}
                    </td>
                  ))}
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </div>
      <div className='flex justify-center mt-4'>
        <div className='btn-group'>{renderPageNumbers()}</div>
      </div>
    </div>
  );
}
