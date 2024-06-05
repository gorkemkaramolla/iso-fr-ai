'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import Heading from '@/components/ui/Heading';
import RotatingWheel from '@/components/ui/LogoSpinner';
import useStore from '@/lib/store';
import api from '@/utils/axios_instance';

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

const RenameSpeakerModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (newName: string) => void;
  initialName: string;
}> = ({ open, onClose, onSubmit, initialName }) => {
  const [newName, setNewName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setNewName(initialName);
    }
  }, [initialName, open]);

  return open ? (
    <div>
      <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
        <div className='bg-white p-5 rounded'>
          <h3 className='font-bold text-lg'>Rename Speaker</h3>
          <input
            type='text'
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className='border p-2 w-full mt-2'
          />
          <div className='mt-4 flex justify-end'>
            <button onClick={onClose} className='mr-2 py-2 px-4 border'>
              Cancel
            </button>
            <button
              onClick={() => onSubmit(newName)}
              className='py-2 px-4 bg-blue-500 text-white rounded'
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

const Transcription: React.FC<Props> = ({ params: { id } }) => {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>({
    id: '',
    name: '',
  });
  useEffect(() => {
    const getTranscription = async () => {
      try {
        const response = await api.get(`/transcriptions/${String(id)}`);
        setTranscription(response.data);
      } catch (error) {
        console.error('Error fetching transcription:', error);
      }
    };
    getTranscription();
  }, [id]);

  const handleSpeakerClick = (segment: Segment) => {
    setCurrentSpeaker({ id: segment.segment_id, name: segment.speaker });
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

    await api.post(`/rename_segments/${id}/${oldName}/${newName}`, {});
  };

  if (!transcription) {
    return (
      <div>
        <RotatingWheel />
      </div>
    );
  }

  return (
    <div>
      <Heading level='h1' text={transcription.created_at} />
      <div className='overflow-y-scroll w-full h-screen p-5 bg-gray-100 flex items-start'>
        <RenameSpeakerModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={renameSpeaker}
          initialName={currentSpeaker.name}
        />
        <div className='w-full'>
          <table className='table-auto w-full'>
            <thead>
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
        <TranscriptionHistory />
      </div>
    </div>
  );
};

export default Transcription;
