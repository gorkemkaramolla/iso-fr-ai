'use client';

import React, { useState } from 'react';
import useSystemInfo from '@/hooks/useSystemInfo';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import UsageChart from '@/components/charts/usage';
import Image from 'next/image';
import LogEditor from './log-editor';
import { Box, Cpu, MemoryStick } from 'lucide-react';
import TemparatureGraphs from './temparature-graphs';
import ContainerInformations from './container-information';

const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [activeComponent, setActiveComponent] = useState('temperature');

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'temperature':
        return (
          <TemparatureGraphs
            host_cpu_temp={systemInfo.host_cpu_temp}
            host_gpu_temp={systemInfo.host_gpu_temp}
          />
        );
      case 'usage':
        return (
          <div className='w-full bg-white shadow-lg rounded-lg p-4'>
            <h2 className='text-xl font-semibold mb-4'>
              İşlemci & Ekran kartı Kullanım Grafiği
            </h2>
            <div className='h-64'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        );
      case 'log':
        return <LogEditor systemInfo={systemInfo} />;
      case 'container':
        return (
          <ContainerInformations containerInfos={systemInfo.container_info} />
        );
      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col overflow-y-scroll gap-4 p-4 bg-gray-100 min-h-screen'>
      {/* Navigation Menu */}
      <nav className='flex justify-around mb-4'>
        <button
          onClick={() => setActiveComponent('temperature')}
          className={`p-2 rounded ${
            activeComponent === 'temperature'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Temperature Graphs
        </button>
        <button
          onClick={() => setActiveComponent('usage')}
          className={`p-2 rounded ${
            activeComponent === 'usage'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Usage Chart
        </button>
        <button
          onClick={() => setActiveComponent('log')}
          className={`p-2 rounded ${
            activeComponent === 'log' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Log Editor
        </button>
        <button
          onClick={() => setActiveComponent('container')}
          className={`p-2 rounded ${
            activeComponent === 'container'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Container Information
        </button>
      </nav>

      {/* Render the active component */}
      {renderActiveComponent()}
    </div>
  );
};

export default Dashboard;
