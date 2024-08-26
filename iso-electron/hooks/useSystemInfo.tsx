import { SystemInfo } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

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
    const fetchLogsData = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_UTILS_URL}/search_logs?query=`
        );
        console.log(res.data);
        setSystemInfo((prev) => ({ ...prev, logs_data: res.data }));
      } catch (err) {
        console.error('Error fetching logs data:', err);
      }
    };

    fetchLogsData();
  }, []);

  useEffect(() => {
    const socket: Socket = io('http://localhost:5004');

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

      const timestamp = new Date().toLocaleTimeString();

      // Update CPU usage data
      setCpuUsageData((prevData) =>
        [
          ...prevData,
          {
            name: timestamp,
            usage: parseFloat(data.host_cpu_usage),
          },
        ].slice(-20)
      );

      // Update GPU usage data
      setGpuUsageData((prevData) =>
        [
          ...prevData,
          {
            name: timestamp,
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
