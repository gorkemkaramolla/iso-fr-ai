'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import Heading from '@/components/ui/Heading';
import RotatingWheel from '@/components/ui/LogoSpinner';
import useStore from '@/library/store';
import api from '@/utils/axios_instance';
import createApi from '@/utils/axios_instance';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import LogoSpinner from '@/components/ui/LogoSpinner';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons

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

interface Speaker {
  id: string;
  name: string;
}

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>({
    id: '',
    name: '',
  });
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const getTranscription = async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);

        const response = await api.get(`/transcriptions/${String(id)}`);
        console.log(response);
        setTranscription(response.data);
      } catch (error) {
        console.error('Error fetching transcription:', error);
      }
    };
    getTranscription();
  }, [id]);

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

  if (!transcription) {
    return (
      <div>
        <LogoSpinner />
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <h1 className='bold text-2xl'>{transcription.created_at}</h1>
      <h2 className='bold text-xl'>Meclis Konuşması</h2>
      <div className='flex items-start  w-full  justify-center'>
        <Dialog
          header='Rename Speaker'
          visible={showModal}
          onHide={() => setShowModal(false)}
          style={{ width: '30vw' }}
        >
          <div className='flex flex-col gap-2'>
            <label htmlFor='newName' className='text-sm'>
              New Name
            </label>
            <InputText
              id='newName'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className='p-1 text-sm'
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
          className='overflow-x-auto w-8/12'
          style={{ height: '650px', overflowY: 'scroll' }}
        >
          <div style={{ position: 'relative' }}>
            <table className='table-auto w-full'>
              <thead
                style={{
                  position: 'sticky',
                  top: '0',
                  backgroundColor: 'white',
                  zIndex: 1,
                }}
              >
                <tr>
                  <th className='px-4 py-2'>Video Zaman Aralığı</th>
                  <th className='px-4 py-2'>Konuşmacı</th>
                  <th className='px-4 py-2'>Transkript</th>
                </tr>
              </thead>
              <tbody>
                {transcription.segments.map((segment) => (
                  <tr key={segment.segment_id}>
                    <td className='border px-4 py-2'>
                      {segment.start_time.toFixed(2)}s -{' '}
                      {segment.end_time.toFixed(2)}s
                    </td>
                    <td
                      className='border px-4 py-2 cursor-pointer hover:underline transition-all'
                      onClick={() => handleSpeakerClick(segment)}
                    >
                      {segment.speaker}
                    </td>
                    <td className='border px-4 py-2'>
                      {segment.transcribed_text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <TranscriptionHistory />
      </div>
    </div>
  );
};

export default Transcription;
