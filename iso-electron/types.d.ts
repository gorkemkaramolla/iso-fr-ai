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
  selectedCamera: Camera;
  streamSrc?: string;
  selectedQuality: Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  position?: { x: number; y: number };
  size?: { width: string | number; height: string | number };
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

interface Personel {
  [key: string]: string;
  PERSONEL_ID: string;
  ADI: string;
  SOYADI: string;
  DOGUM_TARIHI: string;
  EPOSTA: string;
  FOTO_BINARY_DATA: string;
  FOTO_DOSYA_ADI: string;
  FOTO_DOSYA_TIPI: string;
  GSM: string;
  ISO_TELEFON1: string;
  ISO_TELEFON2: string;
  OZGECMIS: string;
  TELEFON1: string;
  TELEFON2: string;
  UNVANI: string;
}
interface RecogFace {
  _id: {
    $oid: string;
  };
  emotion: string;
  image_path: string;
  label: string;
  similarity: number;
  timestamp: string;
}

interface GroupedRecogFaces {
  name: string;
  faces: RecogFace[];
  isCollapsed: boolean;
}

interface Camera {
  label: string;
  url: string;
}

interface DetectionLog {
  status: string;
  label: string;
  time_entered: string;
  time_quited: string;
  emotion_entered: string;
  emotion_quited: string;
  image_entered: string;
  image_quited: string;
}
