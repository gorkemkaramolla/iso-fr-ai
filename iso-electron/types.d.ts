interface Segment {
  id: string;
  seek: number;
  start: number;
  end: number;
  text: string;
  temparature: number;

  avg_logprob: number;
  no_speech_prob: number;
  words: string | null;
  speaker: string;
}
interface Transcript {
  name: string;
  created_at: string;
  segments: Segment[];
  _id: string;
  text: string;
}

interface ApiResponse {
  created_at: string;
  transcription_id: String;
}

interface Change {
  segmentId: string;
  initialText: string;
  currentText: string;
}

interface CameraStream {
  id: number;
  selectedCamera: Camera;
  streamSrc?: string;
  selectedQuality: Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  isClose: boolean;
  position?: { x: number; y: number };
  size?: { width: string | number; height: string | number };
  isLocalCamera?: boolean;
  localCameraId?: number;
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
  _id: string;
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
  file_path: string;
}
interface RecogFace {
  _id: {
    $oid: string;
  };
  emotion: number;
  gender: number;
  age: number;
  image_path: string;
  label: string;
  similarity: number;
  timestamp: string;
  camera: string;
  personnel_id: string;
}

interface GroupedRecogFaces {
  personnel_id: string;
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
// types/User.ts

export type User = {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional password field
  role: 'user' | 'admin';
};

interface ContainerInfo {
  container: string;
  cpu: string;
  memory: string;
  gpu: string;
}
interface SystemInfo {
  host_cpu_usage: string;
  host_gpu_usage: string;
  host_gpu_temp: string;
  host_cpu_temp: string;
  host_memory_usage: string;
  container_info: ContainerInfo[];
  logs_data: string;
  total_container_cpus: number;
}
