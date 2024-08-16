'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import TranscriptionSkeleton from '@/components/ui/transcript-skeleton';

// Import the ClientTranscription dynamically with no SSR
const ClientTranscription = dynamic(() => import('./transcription-comp'), {
  ssr: false,
});

// Component that uses useSearchParams and handles data fetching
function TranscriptionContent() {
  const searchParams = useSearchParams();
  const [transcription, setTranscription] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = searchParams.get('id');

  useEffect(() => {
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

    if (id) {
      fetchTranscriptionData(id);
    } else {
      setIsLoading(false);
      setError('No transcription ID provided');
    }
  }, [id]);

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
    <Suspense fallback={<div>Loading...</div>}>
      <TranscriptionContent />
    </Suspense>
  );
}
