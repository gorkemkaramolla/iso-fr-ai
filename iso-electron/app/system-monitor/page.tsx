'use client';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ReactSpeedometer from 'react-d3-speedometer';

interface SystemInfo {
  cpu_temperature: string;
  cpu_core_temps: { [key: string]: number };
  cpu_usage: string;
  gpu_temperature: string;
  gpu_usage: string;
  gpu_memory_usage: string;
  memory_usage: string;
}

const Dashboard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpu_temperature: 'N/A',
    cpu_core_temps: {},
    cpu_usage: 'N/A',
    gpu_temperature: 'N/A',
    gpu_usage: 'N/A',
    gpu_memory_usage: 'N/A',
    memory_usage: 'N/A',
  });

  const [cpuUsageData, setCpuUsageData] = useState<any[]>([]);
  const [gpuUsageData, setGpuUsageData] = useState<any[]>([]);

  useEffect(() => {
    const socket = io('http://localhost:5004');

    socket.on('system_info', (data: SystemInfo) => {
      setSystemInfo(data);
      console.log(data);
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

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div>
      <h1>System Monitor</h1>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h2>CPU Temperature</h2>
          <ReactSpeedometer
            maxValue={100}
            value={parseValue(systemInfo.cpu_temperature)}
            needleColor='red'
            startColor='green'
            segments={10}
            endColor='red'
          />
        </div>
        <div>
          <h2>GPU Temperature</h2>
          <ReactSpeedometer
            maxValue={100}
            value={parseValue(systemInfo.gpu_temperature)}
            needleColor='red'
            startColor='green'
            segments={10}
            endColor='red'
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h2>CPU Usage</h2>
          <LineChart width={600} height={300} data={cpuUsageData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type='monotone'
              dataKey='usage'
              stroke='#8884d8'
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </div>
        <div>
          <h2>GPU Usage</h2>
          <LineChart width={600} height={300} data={gpuUsageData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type='monotone'
              dataKey='usage'
              stroke='#82ca9d'
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </div>
      </div>
      <div className='flex gap-2'>
        <h2>Memory Usage : </h2>
        <p>{systemInfo.memory_usage}</p>
      </div>
      <div className='flex gap-2'>
        <h2>CPU Usage : </h2>
        <p>{systemInfo.cpu_usage}</p>
      </div>
      <div className='flex gap-2'>
        <h2>CPU Temperature : </h2>
        <p>{systemInfo.cpu_temperature}°C</p>
      </div>
      <div className='flex gap-2'>
        <h2>GPU Usage : </h2>
        <p>{systemInfo.gpu_usage}</p>
      </div>
      <div className='flex gap-2'>
        <h2>GPU Memory Usage : </h2>
        <p>{systemInfo.gpu_memory_usage}</p>
      </div>
      <div className='flex gap-2'>
        <h2>GPU Temperature : </h2>
        <p>{systemInfo.gpu_temperature} °C</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Object.entries(systemInfo.cpu_core_temps || {}).map(([core, temp]) => (
          <div key={core} className='flex gap-2'>
            <h2>{core} : </h2>
            <p>{temp}°C</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
