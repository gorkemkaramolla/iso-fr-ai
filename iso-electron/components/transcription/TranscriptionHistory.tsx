'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { Pen } from 'lucide-react';
interface Props {}
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import axios from 'axios';
import useStore from '@/library/store';
import api from '@/utils/axios_instance';

const ChatSideMenu: React.FC<Props> = () => {
  const [menuToggle, setMenuToggle] = useState<boolean>(true);
  const [responses, setResponses] = useState<ApiResponse[]>([]); // Initialize as an array
  const access_token = useStore((state) => state.accessToken);

  const handleMenuToggle = () => {
    setMenuToggle(!menuToggle);
  };
  const getTranscriptions = async () => {
    try {
      const storedResponses = await api.get('/transcriptions/');
      setResponses(storedResponses.data);
      console.log(storedResponses.data);
    } catch (error) {
      console.error('Failed to fetch transcriptions:', error);
    }
  };
  useEffect(() => {
    getTranscriptions();
    // const storedResponses = localStorage.getItem('responses');
    // setResponses(storedResponses ? JSON.parse(storedResponses) : []);
  }, []);

  return (
    <div
      className={`h-full  sticky top-0 overflow-y-scroll flex flex-col items-center transition-all duration-500`}
    >
      {/* {access_token} */}
      {menuToggle && (
        <div className='py-4'>
          <h2 className='text-lg  font-bold text-center '>Transkript Kaydı</h2>

          <div className='flex flex-col gap-3 '>
            <ul className='menu w-full  rounded-box'>
              {responses &&
                responses.map((response, index) => (
                  <li className='' key={index}>
                    <Link
                      className=''
                      href={'/transcription/' + response.transcription_id}
                    >
                      <div className='dropdown  flex text-sm items-center'>
                        <div
                          tabIndex={0}
                          role='button'
                          className='flex  w-full gap-2'
                        >
                          <p className='flex gap-2 flex-col items-center'>
                            <div className='flex gap-1'>
                              {/* <div className='badge-sm badge badge-primary'>
                                Name
                              </div> */}
                              <div className='badge-sm badge-accent badge'>
                                Transcription ID = {response.transcription_id}
                              </div>
                            </div>
                            <div className='flex items-center gap-1'>
                              <div className='badge-sm badge-primary badge'>
                                Tarih
                              </div>
                              <Calendar className='w-4 h-4' />
                              {response.created_at}
                            </div>
                          </p>{' '}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
            <div className='join self-end justify-self-end  bg-red-500'>
              <button className='join-item btn btn-active'>1</button>
            </div>
            {/* <div className='mockup-window border bg-base-300'>
              <div className='flex justify-center px-4 py-16 bg-base-200'>
                Hello!
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSideMenu;
