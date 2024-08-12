import { Transcript } from '@/types';
import createApi from '@/utils/axios_instance';
import ClientTranscription from './transcription-comp'; // Import the client component

// Function to generate static parameters for the dynamic routes
export async function generateStaticParams() {
  const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
  const response = await api.get('/transcriptions'); // Fetch all transcriptions
  const transcriptions = response.data;

  return transcriptions.map((transcription: Transcript) => ({
    id: transcription.transcription_id.toString(),
  }));
}

// The page component that fetches data and passes it to the ClientTranscription component
export default async function Page({ params }: { params: { id: string } }) {
  const transcriptionData = await fetchTranscriptionData(params.id);
  return <ClientTranscription transcription={transcriptionData} />;
}

// Function to fetch data for a specific transcription
async function fetchTranscriptionData(id: string) {
  const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
  const response = await api.get(`/transcriptions/${id}`, {
    withCredentials: true,
  });
  return response.data;
}
