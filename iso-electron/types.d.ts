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
  isLocalCamera?: boolean;
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
  id: string;
  name: string;
  lastname: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  gsm: string;
  resume: string;
  birth_date: string;
  iso_phone: string;
  iso_phone2: string;
}
interface RecogFace {
  _id: {
    $oid: string;
  };
  emotion: string;
  gender: number;
  age: number;
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
  person_id: string;
}

interface Person {
  _id: { $oid: string };
  employee_id: string;
  first_name: string;
  last_name: string;
  title: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  mobile: string;
  biography: string;
  birth_date: string;
  iso_phone1: string;
  iso_phone2: string;
  photo_file_type: string;
  image_path: string;
}
