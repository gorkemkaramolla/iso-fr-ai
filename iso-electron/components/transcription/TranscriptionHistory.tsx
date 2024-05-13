'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Props {}

const ChatSideMenu: React.FC<Props> = () => {
  const [menuToggle, setMenuToggle] = useState<boolean>(true);
  const [responses, setResponses] = useState<ApiResponse[]>([]); // Initialize as an array

  const handleMenuToggle = () => {
    setMenuToggle(!menuToggle);
  };

  useEffect(() => {
    const storedResponses = localStorage.getItem('responses');
    setResponses(storedResponses ? JSON.parse(storedResponses) : []);
  }, []);

  return (
    <div
      className={`h-full relative  flex flex-col items-center border-l-2 mx-2 transition-all  ${
        menuToggle ? 'w-2/12 p-4' : 'w-0 p-0'
      }`}
    >
      {menuToggle && (
        <>
          <h2 className='text-xl font-bold mb-4'>Transcription History</h2>
          {responses &&
            responses.map((response, index) => (
              <ul key={index}>
                <li>
                  {response.created_at}/{response.created_at}
                </li>
                {/* {response.transcription.segments.map((segment, index) => (
                <li key={index}>
                  <Link href={`/segment/${segment.id}`}>
                    {segment.speaker.toUpperCase()}: {segment.start.toFixed(2)}{' '}
                    - {segment.end.toFixed(2)} = {segment.text}
                  </Link>
                </li>
              ))} */}
              </ul>
            ))}
        </>
      )}
      {menuToggle ? (
        <ChevronRight
          onClick={handleMenuToggle}
          className='absolute top-1/2 -translate-y-1/2 rounded-full text-black p-1 -left-4 h-8 w-8'
        />
      ) : (
        <ChevronLeft
          onClick={handleMenuToggle}
          className='absolute top-1/2 -translate-y-1/2 rounded-full text-black p-1 -left-8 h-8 w-8'
        />
      )}
    </div>
  );
};

export default ChatSideMenu;
