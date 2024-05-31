'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import Heading from '@/components/ui/Heading';
import RotatingWheel from '@/components/ui/LogoSpinner';

interface Segment {
  SEGMENT_ID: number;
  START_TIME: number;
  END_TIME: number;
  SPEAKER: string;
  TRANSCRIBED_TEXT: string;
  TRANSCRIPT_ID: number;
}

interface TranscriptionData {
  segments: Segment[];
  created_at: string;
  transcription_id: string;
}

interface Props {
  params: {
    id: string;
  };
}

interface Speaker {
  id: number;
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
    id: 0,
    name: '',
  });

  useEffect(() => {
    const getTranscription = async () => {
      try {
        console.log(
          'process.env.NEXT_PUBLIC_FLASK_URL',
          process.env.NEXT_PUBLIC_FLASK_URL
        );
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_FLASK_URL}/transcriptions/${id}`
        );
        setTranscription(response.data);
      } catch (error) {
        console.error('Error fetching transcription:', error);
      }
    };

    getTranscription();
    console.log(transcription);
  }, [id]);

  const handleSpeakerClick = (segment: Segment) => {
    setCurrentSpeaker({ id: segment.SEGMENT_ID, name: segment.SPEAKER });
    setShowModal(true);
  };

  const renameSpeaker = async (newName: string) => {
    setShowModal(false);
    const oldName = currentSpeaker.name;
    const updatedSegments = transcription?.segments.map((segment) =>
      segment.SPEAKER === oldName ? { ...segment, SPEAKER: newName } : segment
    );
    if (updatedSegments) {
      setTranscription({ ...transcription!, segments: updatedSegments! });
    }

    await axios.post(
      `${process.env.NEXT_PUBLIC_FLASK_URL}/rename_segments/${id}/${oldName}/${newName}`
    );
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
      <Heading
        level='h2'
        text={'Transcription_id : ' + transcription.transcription_id}
      />
      <div className='overflow-y-scroll w-full h-screen p-5 bg-gray-100 flex  items-start '>
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
                <tr key={segment.SEGMENT_ID}>
                  <td className='border px-4 py-2'>
                    {segment && segment.START_TIME
                      ? segment.START_TIME.toFixed(2)
                      : 'N/A'}
                    s -{' '}
                    {segment && segment.END_TIME
                      ? segment.END_TIME.toFixed(2)
                      : 'N/A'}
                    s
                  </td>
                  <td
                    className='border px-4 py-2 cursor-pointer hover:a   transition-all'
                    onClick={() => handleSpeakerClick(segment)}
                  >
                    {segment.SPEAKER}
                  </td>
                  <td className='border px-4 py-2'>
                    {segment.TRANSCRIBED_TEXT}
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
