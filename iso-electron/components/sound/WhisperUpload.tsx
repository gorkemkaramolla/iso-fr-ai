'use client';
import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { timeout } from 'd3';

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

function WhisperUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [responses, setResponses] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files ? event.target.files[0] : null);
    setError('');
  };

  const onFileUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const res = await axios.post<Transcript[]>(
        'http://127.0.0.1:5001/process-audio/',
        formData,

        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 0 }
      );
      setResponses(res.data);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setError(
        'Failed to upload file: ' +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=''>
      <div className='  p-8 rounded-xl'>
        <h1 className='my-1 '>Dosya Yükle</h1>
        <input
          type='file'
          onChange={onFileChange}
          className='file-input h-24 file-input-bordered w-full max-w-xs'
        />

        <button className='btn h-24 ' onClick={onFileUpload} disabled={loading}>
          {loading ? 'Dosya Yükleniyor...' : 'Dosya Yükle'}
        </button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
        {responses.map((response, index) => (
          <div key={index}>
            <h3>Language: {response.language}</h3>
            <ul>
              {response.segments.map((segment) => (
                <li key={segment.id}>
                  {segment.speaker.toUpperCase()}: {segment.start.toFixed(2)}-
                  {segment.end.toFixed(2)} = {segment.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WhisperUpload;
