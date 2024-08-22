'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import TranscriptionSkeleton from '@/components/ui/transcript-skeleton';
import ChatSideMenu from '@/components/transcriptions/TranscriptionHistory';

// Import the ClientTranscription dynamically with no SSR
const ClientTranscription = dynamic(
  () => import('../../components/transcriptions/transcription-comp'),
  {
    ssr: false,
  }
);

// Component that uses useSearchParams and handles data fetching
function TranscriptionContent() {
  const searchParams = useSearchParams();
  const [transcription, setTranscription] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const id = searchParams.get('id');

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    async function fetchTranscriptionData(transcriptionId: string) {
      setIsLoading(true);
      setError(null);
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      try {
        const response = await api.get(`/transcriptions/${transcriptionId}`);
        const data: Transcript = await response.json();
        setTranscription(data);
      } catch (error) {
        setError('Failed to fetch transcription data');
        console.error('Error fetching transcription:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTranscriptionData(id);
  }, [id]);

  if (!id) {
    return <TranscriptionPage />; // Render an empty div when no ID is provided
  }

  if (isLoading) {
    return <TranscriptionSkeleton />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!transcription) {
    return <div>No transcription data available.</div>;
  }

  return <ClientTranscription transcription={transcription} />;
}

// Main Page component
export default function Page() {
  return (
    <Suspense fallback={<TranscriptionSkeleton />}>
      <TranscriptionContent />
    </Suspense>
  );
}

function TranscriptionPage() {
  const [transcriptions, setTranscriptions] = useState<Transcript[] | null>(
    null
  );

  const getTranscriptions = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      const storedResponses = await api.get('/transcriptions/', {});
      const data: Transcript[] = await storedResponses.json();
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTranscriptions(sortedData);
    } catch (error) {
      console.error('Failed to fetch transcriptions:', error);
    }
  };

  useEffect(() => {
    getTranscriptions();
  }, []);

  return (
    <div className='transcription-page-container'>
      {transcriptions?.map((transcription) => (
        <div key={transcription._id} className='w-96 shadow-xl p-8 rounded-xl '>
          <h3 className='transcription-title'>{transcription.name}</h3>
          <p className='transcription-meta'>
            <strong>Created At:</strong>{' '}
            {new Date(transcription.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
