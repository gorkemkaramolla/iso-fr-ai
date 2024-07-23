'use client';
import React, { useState, useEffect, ChangeEvent } from 'react';
import io from 'socket.io-client';
import useStore from '@/library/store';
import createApi from '@/utils/axios_instance';

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

function WhisperUpload() {
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
      alert('Please select a file first!');
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

  return (
    <div className='w-full h-full overflow-auto'>
      <div className='w-full fixed top-16 left-0 z-50'>
        <div className='bg-gray-200 h-2'>
          <div
            className='h-full bg-indigo-500 transition-all duration-300 ease-in-out'
            style={{ width: `${progress}%` }}
          >
            {progress > 0 && progress < 100 && (
              <div className='absolute top-0 right-0 bg-white text-blue-500 px-2 py-1 text-xs rounded-full shadow -mt-8 -mr-4'>
                {progress.toFixed(0)}%
              </div>
            )}
          </div>
        </div>
      </div>
      <div className='p-8 h-full rounded-xl'>
        <h1 className='my-1'>File Upload</h1>
        <input
          type='file'
          onChange={onFileChange}
          className='file-input file-input-bordered w-full max-w-xs'
          accept='audio/*'
          aria-label='Upload audio file'
        />
        <button className='btn mt-2' onClick={onFileUpload} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        {error && <div className='text-red-500 mt-2'>{error}</div>}
        {response && (
          <div className='mt-4 border border-gray-200 rounded-lg w-full overflow-auto'>
            <div className='px-4 py-2 bg-gray-50 border-b border-gray-200'>
              <p className='text-sm text-gray-600'>
                Processed on:
                <span className='font-medium'>
                  {new Date(response.created_at).toLocaleString()}
                </span>
                | Language:
                <span className='font-medium'>
                  {response.transcription.language}
                </span>
              </p>
            </div>
            <ul className='divide-y divide-gray-200'>
              {response.transcription.segments.map((segment, index) => (
                <li key={index} className='px-4 py-2 hover:bg-gray-50'>
                  <div className='flex items-center space-x-2 text-sm'>
                    <span className='font-semibold text-gray-700'>
                      {segment.speaker.toUpperCase()}
                    </span>
                    <span className='text-gray-400'>
                      {segment.start.toFixed(1)}s - {segment.end.toFixed(1)}s
                    </span>
                  </div>
                  <p className='mt-1 text-gray-800'>{segment.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhisperUpload;
