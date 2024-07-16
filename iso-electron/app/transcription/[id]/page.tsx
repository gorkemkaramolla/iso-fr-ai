'use client';

import React, { useEffect, useState, useRef } from 'react';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import LogoSpinner from '@/components/ui/LogoSpinner';
import createApi from '@/utils/axios_instance';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import MusicPlayer from '@/components/sound/music-player';
import useStore from '@/library/store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Segment {
  segment_id: string;
  start_time: number;
  end_time: number;
  speaker: string;
  transcribed_text: string;
}

interface TranscriptionData {
  segments: Segment[];
  created_at: string;
}

interface Props {
  params: {
    id: string;
  };
}

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState({ id: '', name: '' });
  const [newName, setNewName] = useState('');
  const currentTime = useStore((state) => state.currentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getTranscription = async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        const response = await api.get(`/transcriptions/${String(id)}`);
        if (response) setTranscription(response.data);
      } catch (error) {
        console.error('Error fetching transcription:', error);
      }
    };
    getTranscription();
  }, [id]);

  useEffect(() => {
    if (transcriptionRef.current) {
      const segmentElements =
        transcriptionRef.current.querySelectorAll('.segment');
      segmentElements.forEach((element) => {
        const start = parseFloat(
          element.getAttribute('data-start-time') || '0'
        );
        const end = parseFloat(element.getAttribute('data-end-time') || '0');
        if (currentTime >= start && currentTime <= end) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [currentTime]);

  const handleSpeakerClick = (segment: Segment) => {
    setCurrentSpeaker({ id: segment.segment_id, name: segment.speaker });
    setNewName(segment.speaker);
    setShowModal(true);
  };

  const renameSpeaker = async (newName: string) => {
    setShowModal(false);
    const oldName = currentSpeaker.name;
    const updatedSegments = transcription?.segments.map((segment) =>
      segment.speaker === oldName ? { ...segment, speaker: newName } : segment
    );
    if (updatedSegments) {
      setTranscription({ ...transcription!, segments: updatedSegments });
    }
    const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
    await api.post(`/rename_segments/${id}/${oldName}/${newName}`, {});
  };

  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'bg-blue-100',
      'bg-green-100',
      'bg-yellow-100',
      'bg-red-100',
      'bg-purple-100',
      'bg-pink-100',
    ];
    const hash = speaker
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  const handleGetExcel = () => {
    if (transcription) {
      const worksheet = XLSX.utils.json_to_sheet(transcription.segments);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transcription');
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      const data = new Blob([excelBuffer], {
        type: 'application/octet-stream',
      });
      saveAs(data, `transcription_${id}.xlsx`);
    }
  };

  const handleGetJSON = () => {
    if (transcription) {
      const json = JSON.stringify(transcription.segments, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      saveAs(blob, `transcription_${id}.json`);
    }
  };

  if (!transcription) {
    return <LogoSpinner />;
  }

  return (
    <div className='flex md:flex-row flex-col transition-all'>
      <div className='flex flex-col p-4 w-full md:w-10/12 mx-auto'>
        <div className='flex items-center justify-between'>
          <MusicPlayer
            audioSrc='/test.wav'
            title='Meclis 1'
            date={transcription.created_at}
          />
          <div className='mb-4 flex flex-col justify-end px-4 gap-2'>
            <Button
              label='Get Excel'
              icon='pi pi-file-excel'
              className='p-button-success w-full'
              onClick={handleGetExcel}
            />
            <Button
              label='Get JSON'
              icon='pi pi-file'
              className='p-button-info w-full'
              onClick={handleGetJSON}
            />
          </div>
        </div>

        <Dialog
          header='Rename Speaker'
          visible={showModal}
          onHide={() => setShowModal(false)}
          style={{ width: '300px' }}
        >
          <div className='flex flex-col gap-2'>
            <InputText
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className='p-2 text-sm'
            />
            <div className='mt-4 flex justify-end'>
              <Button
                label='Cancel'
                className='p-button-text p-button-sm mr-2'
                onClick={() => setShowModal(false)}
              />
              <Button
                label='Save'
                icon='pi pi-check'
                className='p-button-sm'
                onClick={() => renameSpeaker(newName)}
              />
            </div>
          </div>
        </Dialog>

        <div
          ref={transcriptionRef}
          className='bg-gray-100 p-4 rounded-lg shadow-md overflow-y-auto'
          style={{ maxHeight: '50vh' }}
        >
          {transcription.segments.map((segment, index) => (
            <div
              key={segment.segment_id}
              className={`mb-4 flex segment ${
                index % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}
              data-start-time={segment.start_time}
              data-end-time={segment.end_time}
            >
              <div
                className={`max-w-[70%] ${getSpeakerColor(
                  segment.speaker
                )} rounded-lg p-3 shadow`}
              >
                <div className='flex justify-between items-center mb-2'>
                  <span
                    className='font-bold cursor-pointer hover:underline'
                    onClick={() => handleSpeakerClick(segment)}
                  >
                    {segment.speaker}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {segment.start_time.toFixed(2)}s -{' '}
                    {segment.end_time.toFixed(2)}s
                  </span>
                </div>
                <p>{segment.transcribed_text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='md:w-2/12 w-full'>
        <TranscriptionHistory />
      </div>
    </div>
  );
};

export default Transcription;
