import React, { useState, useEffect, ChangeEvent } from 'react';
import io from 'socket.io-client';
import createApi from '@/utils/axios_instance';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiX, FiMusic } from 'react-icons/fi';
import WaveAudio from '@/components/sound/wave-audio';
import Link from 'next/link';
import Card from '../ui/card';
import Header from '../ui/header';
import InfoTooltip from '@/components/ui/info-button-tooltip';
import Progress from '../ui/progress';
import { ApiResponse, Segment, Transcript } from '@/types';
import useStore from '@/library/store'; // Import Zustand store

const WhisperUpload: React.FC<{ isProcessing: boolean }> = ({
  isProcessing,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const setTranscriptions = useStore((state) => state.setTranscriptions); // Get the setter from Zustand store

  useEffect(() => {
    // Retrieve progress and transcriptId from localStorage on initial render
    if (typeof window !== 'undefined') {
      const savedProgress = localStorage.getItem('processAudioProgress');
      const savedTranscriptId = localStorage.getItem('transcriptId');

      if (savedProgress) {
        const progressValue = parseInt(savedProgress, 10);
        if (progressValue === 100) {
          // Reset progress if it was 100%
          setProgress(0);
          localStorage.setItem('processAudioProgress', '0');
        } else {
          setProgress(progressValue);
        }
      }

      if (savedTranscriptId) setTranscriptId(savedTranscriptId);

      // Check the progress status on the server if a transcriptId is available
      if (savedTranscriptId) {
        checkProgressStatus(savedTranscriptId);
      }
    }
  }, []);

  const checkProgressStatus = async (id: string) => {
    try {
      const api = createApi(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);
      const response = await api.get(`/process-status/${id}`);
      const data = await response.json();

      if (data.status === 'completed') {
        setProgress(100);
        localStorage.setItem('processAudioProgress', '100');
        // Handle completed status (e.g., fetch final transcription)
      } else if (data.status === 'in progress') {
        setProgress(data.progress);
      } else {
        setProgress(0);
        localStorage.removeItem('processAudioProgress');
        localStorage.removeItem('transcriptId');
      }
    } catch (error) {
      console.error('Failed to check progress status:', error);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    if (selectedFile && selectedFile.size > 500 * 1024 * 1024) {
      setError('File size should be less than 500MB');
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

  useEffect(() => {
    // Save progress and transcriptId to localStorage whenever they change
    if (typeof window !== 'undefined') {
      localStorage.setItem('processAudioProgress', progress.toString());
      if (transcriptId) {
        localStorage.setItem('transcriptId', transcriptId);
      }
    }
  }, [progress, transcriptId]);

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
      const response = await api.post('/process-audio/', formData);

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data: Transcript = await response.json();
      setResponse(data);
      setProgress(0);

      // Set the transcript ID for further use
      setTranscriptId(data._id);

      // Re-fetch the transcriptions after adding a new one
      fetchTranscriptionsAndUpdateStore();

      // Store the response in localStorage
      if (typeof window !== 'undefined') {
        const storedResponses = JSON.parse(
          localStorage.getItem('responses') || '[]'
        );
        storedResponses.push(data);
        localStorage.setItem('responses', JSON.stringify(storedResponses));
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An unknown error occurred during file upload.';

      setError(`Failed to upload file: ${errorMessage}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTranscriptionsAndUpdateStore = async () => {
    try {
      const api = createApi(`${process.env.NEXT_PUBLIC_DIARIZE_URL}`);
      const response = await api.get('/transcriptions/');
      const data: Transcript[] = await response.json();
      setTranscriptions(data);
    } catch (error) {
      console.error('Failed to fetch transcriptions:', error);
    }
  };

  const cancelSelection = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className='w-full '>
      <div className='w-full absolute bottom-0 left-0'>
        <Progress current={progress} />
      </div>
      <div className='max-w-3xl mx-auto'>
        <div className='flex items-center '>
          <Header title='Konuşma Sentezi' />
          <InfoTooltip
            content={
              <div>
                <p>
                  Konuşma Sentezi, ses dosyalarını metne dönüştürmek için
                  kullanılan bir araçtır.
                </p>
                <p>Desteklenen dosya formatları: MP3, WAV, M4A, FLAC</p>
                <p>Maksimum dosya boyutu: 25MB</p>
              </div>
            }
            placement='right'
          />
        </div>
        <motion.div
          className=''
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
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
                      disabled={isProcessing}
                    >
                      <FiX className='text-xl' />
                    </button>
                  </div>
                  <div className='mt-4'>
                    <WaveAudio
                      viewMode={0}
                      audio_name={URL.createObjectURL(file)}
                      isVisible={true}
                    />
                  </div>
                </div>
              ) : (
                <div className='flex items-center justify-center w-full'>
                  <label
                    htmlFor='dropzone-file'
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300 ${
                      isProcessing ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                      <FiUploadCloud className='w-10 h-10 mb-3 text-indigo-500' />
                      <p className='mb-2 text-sm text-indigo-600'>
                        <span className='font-semibold'>
                          Karşıya yükleme için tıklayın
                        </span>
                        veya sürükleyip bırakın
                      </p>
                      <p className='text-xs text-indigo-500'>
                        Ses veya video dosyası (max. 500MB)
                      </p>
                    </div>
                    <input
                      id='dropzone-file'
                      type='file'
                      className='hidden'
                      onChange={onFileChange}
                      accept='audio/*'
                      disabled={isProcessing}
                    />
                  </label>
                </div>
              )}
            </div>
            <button
              className='mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 disabled:opacity-50'
              onClick={onFileUpload}
              disabled={loading || !file || isProcessing}
            >
              {loading || isProcessing
                ? 'İşlem devam ediyor...'
                : 'Sentezi Başlat'}
            </button>
          </Card>
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
                  <div className='h-2 mb-4 text-xs flex rounded bg-indigo-200'>
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
              className='bg-white rounded-lg shadow-lg'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className='px-6 py-4 bg-indigo-600 text-white'>
                <h2 className='text-xl font-semibold'>Konuşma Sentezi</h2>

                <Link href={`/transcription/${response._id}`}>
                  Düzenlemek için tıkla
                </Link>
              </div>
              <ul className='divide-y  divide-gray-200'>
                {response.segments.map((segment: Segment, index: number) => (
                  <li
                    key={index}
                    className='px-6 py-4 hover:bg-indigo-50 transition duration-150'
                  >
                    <div className='flex items-center space-x-3 text-sm'>
                      <span className='font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded'>
                        {segment.speaker.toString().toUpperCase()}
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
