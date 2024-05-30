'use client';
import React, { useEffect, useState } from 'react';
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
import useSystemInfo from '@/hooks/useSystemInfo'; // Adjust the import path as necessary

const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (!isClient) {
    return null; // Return null on the server-side render
  }

  return (
    <div className='h-screen overflow-y-scroll'>
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
