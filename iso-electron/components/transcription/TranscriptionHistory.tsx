'use client';
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Pen } from 'lucide-react';
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
      className={`h-full relative  flex flex-col items-center border-l-2 mx-2 transition-all duration-500  ${
        menuToggle ? 'w-4/12 p-4' : 'w-0 p-0'
      }`}
    >
      {menuToggle && (
        <>
          <h2 className='text-xl  font-bold mb-4'>Transkript Kaydı</h2>
          <div className='flex flex-col gap-3 '>
            {responses &&
              responses.map((response, index) => (
                <li key={index}>
                  <Link className='' href={'/transcription/' + response.id}>
                    <div className='dropdown  flex text-sm items-center'>
                      <div tabIndex={0} role='button' className='flex gap-2  '>
                        {response.created_at} Tarihli /{response.id} id numaralı
                        kayıt
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            <div className='join self-end justify-self-end h-full bg-red-500'>
              <button className='join-item btn'>1</button>
              <button className='join-item btn btn-active'>2</button>
              <button className='join-item btn'>3</button>
              <button className='join-item btn'>4</button>
            </div>
          </div>
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
