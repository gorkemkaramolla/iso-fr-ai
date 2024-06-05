'use client';
import React, { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import useStore from '@/library/store';
import api from '@/utils/axios_instance';

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
    setFile(event.target.files ? event.target.files[0] : null);
    setError('');
  };

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_FLASK_URL}`);
    socket.on('progress', (data) => {
      setProgress(data.progress);
    });
    return () => {
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
      const res = await api.post<ApiResponse>('/process-audio/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Client-ID': localStorage.getItem('client_id') || '123456',
        },
      });
      setResponse(res.data);
      setLoading(false);
      setProgress(100);

      // Store the response for future sessions or other component use
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
      <div className='w-full my-0 absolute bottom-0 bg-gray-900 rounded-full'>
        <div
          className='h-2 bg-terminalGreen   rounded-full'
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className='p-8  h-full  rounded-xl'>
        <h1 className='my-1'>Dosya Yükleme</h1>
        <input
          type='file'
          onChange={onFileChange}
          className='file-input file-input-bordered w-full max-w-xs'
          accept='audio/*'
        />
        <button className='btn ' onClick={onFileUpload} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'Yükle'}
        </button>
        {error && <div className='text-red-500'>{error}</div>}
        {response && (
          <div className='rounded-xl p-4 w-full overflow-auto'>
            <h3>Processed at: {response.created_at}</h3>
            <h3>Language: {response.transcription.language}</h3>
            <ul>
              {response.transcription.segments.map((segment, index) => (
                <li key={index} className=''>
                  <span className='badge-primary'>
                    {segment?.speaker?.toUpperCase()}
                  </span>
                  : {segment.start.toFixed(2)} -{segment.end.toFixed(2)} ={' '}
                  {segment.text}
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
