'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu_temperature: 'N/A',
    cpu_core_temps: {},
    cpu_usage: 'N/A',
    gpu_temperature: 'N/A',
    gpu_usage: 'N/A',
    gpu_memory_usage: 'N/A',
    memory_usage: 'N/A',
    logs_data: '',
  });

  const [cpuUsageData, setCpuUsageData] = useState<UsageData[]>([]);
  const [gpuUsageData, setGpuUsageData] = useState<UsageData[]>([]);

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
            usage: parseFloat(data.cpu_usage),
          },
        ].slice(-20)
      );

      // Update GPU usage data
      setGpuUsageData((prevData) =>
        [
          ...prevData,
          {
            name: new Date().toLocaleTimeString(),
            usage: parseFloat(data.gpu_usage),
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
