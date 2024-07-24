import axios from 'axios';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

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

interface UsageData {
  name: string;
  usage: number;
}

const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    host_cpu_usage: 'N/A',
    host_gpu_usage: 'N/A',
    host_gpu_temp: 'N/A',
    host_cpu_temp: 'N/A',
    host_memory_usage: 'N/A',
    total_container_cpus: 0,
    container_info: [],
    logs_data: '',
  });

  const [cpuUsageData, setCpuUsageData] = useState<UsageData[]>([]);
  const [gpuUsageData, setGpuUsageData] = useState<UsageData[]>([]);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_UTILS_URL}/search_logs?query=${'2024'}`)
      .then((res) => {
        console.log(res.data);
        setSystemInfo((prev) => ({ ...prev, logs_data: res.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  useEffect(() => {
    const socket = io('http://localhost:5004');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('system_info', (data: SystemInfo) => {
      console.log('Received system_info:', data);
      setSystemInfo(data);

      // Update CPU usage data
      setCpuUsageData((prevData) =>
        [
          ...prevData,
          {
            name: new Date().toLocaleTimeString(),
            usage: parseFloat(data.host_cpu_usage),
          },
        ].slice(-20)
      );

      // Update GPU usage data
      setGpuUsageData((prevData) =>
        [
          ...prevData,
          {
            name: new Date().toLocaleTimeString(),
            usage: parseFloat(data.host_gpu_usage),
          },
        ].slice(-20)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { systemInfo, cpuUsageData, gpuUsageData };
};

export default useSystemInfo;
