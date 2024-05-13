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
