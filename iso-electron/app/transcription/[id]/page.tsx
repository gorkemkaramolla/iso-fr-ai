'use client';

import React, { useEffect, useState, useRef } from 'react';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import LogoSpinner from '@/components/ui/LogoSpinner';
import createApi from '@/utils/axios_instance';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import WaveAudio from '@/components/sound/wave-audio';
import useStore from '@/library/store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SkeletonLoader from '@/components/ui/transcript-skeleton';

interface Props {
  params: {
    id: string;
  };
}

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<Transcript | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState({ id: '', name: '' });
  const [newName, setNewName] = useState('');
  const currentTime = useStore((state) => state.currentTime);
  const transcriptionRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTranscription = async () => {
      setLoading(true);
      try {
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
        const response = await api.get(`/transcriptions/${String(id)}`);
        if (response) {
          setTranscription(response.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching transcription:', error);
        setLoading(false);
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

  const getSpeakerBackgroundColor = (speaker: string) => {
    const colors = [
      'bg-gray-200',
      'bg-stone-100',
      'bg-blue-100',
      'bg-indigo-50',
      'bg-slate-100',
      'bg-amber-50',
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

  return (
    <div>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <div>
          <h1 className='text-xl font-extrabold p-4'>{transcription?.name}</h1>
          <div className='flex flex-col lg:flex-row min-h-screen bg-gray-50'>
            <div className='flex-grow p-4 lg:w-9/12'>
              <div className='bg-white rounded shadow p-4 mb-4'>
                <WaveAudio audio_name='/test.wav' />{' '}
                {/* Use WaveAudio component */}
              </div>

              <div className='flex justify-end space-x-2 mb-4'>
                <Button
                  label='Excel Olarak İndir'
                  icon='pi pi-file-excel'
                  className='p-button-sm'
                  onClick={handleGetExcel}
                />
                <Button
                  label='JSON Olarak İndir'
                  icon='pi pi-file'
                  className='p-button-sm'
                  onClick={handleGetJSON}
                />
              </div>

              <div
                ref={transcriptionRef}
                className='bg-white rounded shadow p-4 overflow-y-auto'
                style={{ maxHeight: 'calc(100vh - 250px)' }}
              >
                {transcription?.segments.map((segment) => (
                  <div
                    key={segment.segment_id}
                    className={`mb-2 p-2 rounded segment ${getSpeakerBackgroundColor(
                      segment.speaker
                    )}`}
                    data-start-time={segment.start_time}
                    data-end-time={segment.end_time}
                  >
                    <div className='flex justify-between items-center text-sm text-gray-600 mb-1'>
                      <span
                        className='font-semibold cursor-pointer hover:underline'
                        onClick={() => handleSpeakerClick(segment)}
                      >
                        {segment.speaker}
                      </span>
                      <span>
                        {segment.start_time.toFixed(2)}s -{' '}
                        {segment.end_time.toFixed(2)}s
                      </span>
                    </div>
                    <p className='text-sm text-gray-800'>
                      {segment.transcribed_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className='lg:w-3/12'>
              <TranscriptionHistory
                activePageId={transcription?.transcription_id}
              />
            </div>

            <Dialog
              header='Konuşmacı Adını Değiştir'
              visible={showModal}
              onHide={() => setShowModal(false)}
              className='w-80'
            >
              <div className='flex flex-col gap-4'>
                <InputText
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className='p-2 text-sm'
                />
                <div className='flex justify-end space-x-2'>
                  <Button
                    label='Cancel'
                    className='p-button-text p-button-sm'
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcription;
