'use client';
import { useState, ChangeEvent } from 'react';
import axios from 'axios';

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
}

interface TranscriptResponse {
  text: string;
  segments: Segment[];
  language: string;
}

function WhisperUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<TranscriptResponse | null>(null);
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
      const res = await axios.post<TranscriptResponse>(
        'http://127.0.0.1:8000/process-audio/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResponse(res.data);
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
    <div>
      <h1>Audio File Upload</h1>
      <input type='file' onChange={onFileChange} />
      <button onClick={onFileUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload!'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {response && (
        <div>
          <h2>Transcription Segments</h2>
          <ul>
            {response.segments.map((segment) => (
              <li key={segment.id}>
                {segment.speaker.toUpperCase()}: {segment.start.toFixed(2)}-
                {segment.end.toFixed(2)} = {segment.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default WhisperUpload;
