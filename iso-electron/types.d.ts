interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: string;
}

interface Transcript {
  text: string;
  segments: Segment[];
  language: string;
}

interface ApiResponse {
  created_at: string;
  transcription: Transcript;
  id: String;
}

interface CameraStream {
  id: number;
  selectedCamera: Cameras;
  selectedQuality: string | null;
  isPlaying: boolean;
  isLoading?: boolean;
}
