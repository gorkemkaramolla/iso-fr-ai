import createApi from '@/utils/axios_instance';

const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);

const deleteTranscription = async (transcription_id: string) => {
  const response = await api.delete(`transcriptions/${transcription_id}`);
  const data = await response.json();
  console.log(response);
  return response.status;
};

export { deleteTranscription };
