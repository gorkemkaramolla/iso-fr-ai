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
  transcription_id: String;
}

interface CameraStream {
  id: number;
  selectedCamera: string;
  streamSrc?: string;
  selectedQuality: Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
}
interface SystemInfo {
  logs_data: string;
  cpu_temperature: string;
  cpu_core_temps: { [key: string]: number };
  cpu_usage: string;
  gpu_temperature: string;
  gpu_usage: string;
  gpu_memory_usage: string;
  memory_usage: string;
}

interface UsageData {
  name: string;
  usage: number;
}

interface UsageChartProps {
  cpuData: UsageData[];
  gpuData: UsageData[];
}
