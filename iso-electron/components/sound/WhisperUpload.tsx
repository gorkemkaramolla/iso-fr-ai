'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import io from 'socket.io-client';
import useStore from '@/library/store';
import createApi from '@/utils/axios_instance';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiX, FiMusic } from 'react-icons/fi';
import WaveAudio from '@/components/sound/wave-audio';
import Link from 'next/link';

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
}

interface Transcript {
  text: string;
  segments: Segment[];
  language: string;
}

interface ApiResponse {
  id: string;
  created_at: string;
  transcription: Transcript;
}

const WhisperUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const access_token = useStore((state) => state.accessToken);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setError('File size should be less than 50MB');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);
    socket.on('progress', (data) => {
      setProgress(data.progress);
    });
    return () => {
      socket.off('progress');
      socket.close();
    };
  }, []);

  const onFileUpload = async () => {
    if (!file) {
      setError('Please select a file first!');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const res = await api.post<ApiResponse>('/process-audio/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Client-ID': localStorage.getItem('client_id') || '123456',
        },
      });
      setResponse(res.data);
      setLoading(false);
      setProgress(100);

      let responses = JSON.parse(localStorage.getItem('responses') || '[]');
      responses.push(res.data);
      localStorage.setItem('responses', JSON.stringify(responses));
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(
        'Failed to upload file: ' +
          (error.response?.data?.message || error.message)
      );
      setLoading(false);
    }
  };

  const cancelSelection = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className='w-full min-h-screen p-8   '>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-bold  mb-8'>Konuşma Sentezleyici</h1>

        <motion.div
          className='bg-white rounded-lg shadow-lg p-8 mb-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className='relative'>
            {file ? (
              <div className='mb-4'>
                <div className='flex items-center justify-between bg-indigo-100 rounded-lg p-4'>
                  <div className='flex items-center space-x-3'>
                    <FiMusic className='text-indigo-600 text-xl' />
                    <span className='font-medium text-indigo-800'>
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={cancelSelection}
                    className='text-indigo-600 hover:text-indigo-800 transition-colors'
                  >
                    <FiX className='text-xl' />
                  </button>
                </div>
                <div className='mt-4'>
                  <WaveAudio audio_name={URL.createObjectURL(file)} />
                </div>
              </div>
            ) : (
              <div className='flex items-center justify-center w-full'>
                <label
                  htmlFor='dropzone-file'
                  className='flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300'
                >
                  <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                    <FiUploadCloud className='w-10 h-10 mb-3 text-indigo-500' />
                    <p className='mb-2 text-sm text-indigo-600'>
                      <span className='font-semibold'>
                        Karşıya yükleme için tıklayın
                      </span>{' '}
                      veya sürükleyip bırakın
                    </p>
                    <p className='text-xs text-indigo-500'>
                      Ses veya video dosyası (max. 50MB)
                    </p>
                  </div>
                  <input
                    id='dropzone-file'
                    type='file'
                    className='hidden'
                    onChange={onFileChange}
                    accept='audio/*'
                  />
                </label>
              </div>
            )}
          </div>
          <button
            className='mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50'
            onClick={onFileUpload}
            disabled={loading || !file}
          >
            {loading ? 'İşlem devam ediyor...' : 'Sentezi Başlat'}
          </button>
        </motion.div>

        <AnimatePresence>
          {(progress > 0 || error) && (
            <motion.div
              className='mb-8'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {progress > 0 && (
                <div className='relative pt-1'>
                  <div className='flex mb-2 items-center justify-between'>
                    <div>
                      <span className='text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200'>
                        Yükleme
                      </span>
                    </div>
                    <div className='text-right'>
                      <span className='text-xs font-semibold inline-block text-indigo-600'>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className=' h-2 mb-4 text-xs flex rounded bg-indigo-200'>
                    <div
                      style={{ width: `${progress}%` }}
                      className='shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300 ease-in-out'
                    ></div>
                  </div>
                </div>
              )}
              {error && (
                <div
                  className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded'
                  role='alert'
                >
                  <p className='font-bold'>Error</p>
                  <p>{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {response && (
            <motion.div
              className='bg-white rounded-lg shadow-lg  '
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className='px-6 py-4  bg-indigo-600 text-white'>
                <h2 className='text-xl font-semibold'>Konuşma Sentezi</h2>
                <p className='text-sm opacity-80'>
                  Bu tarihte işlendi:{' '}
                  {new Date(response.created_at).toLocaleString()} | Algılanılan
                  Dil: {response.transcription.language}
                </p>
                <Link href={`/transcription/${response.id}`}>
                  Düzenlemek için tıkla
                </Link>
              </div>
              <ul className='divide-y  divide-gray-200'>
                {response.transcription.segments.map((segment, index) => (
                  <li
                    key={index}
                    className='px-6 py-4 hover:bg-indigo-50 transition duration-150'
                  >
                    <div className='flex items-center space-x-3 text-sm'>
                      <span className='font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded'>
                        {segment.speaker.toUpperCase()}
                      </span>
                      <span className='text-gray-500'>
                        {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                      </span>
                    </div>
                    <p className='mt-1 text-gray-800'>{segment.text}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WhisperUpload;
