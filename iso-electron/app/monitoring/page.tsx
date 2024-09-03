'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSystemInfo from '@/hooks/useSystemInfo';
import { Thermometer, Activity, FileText, Box } from 'lucide-react';
import TemperatureGraphs from './temperature-graphs';
import UsageChart from '@/components/charts/usage';
import LogEditor from './log-editor';
import ContainerInformation from './container-information';

const Dashboard = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();

  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Set the active component after the component has mounted
  useEffect(() => {
    const storedComponent =
      localStorage.getItem('activeComponent') || 'temperature';
    setActiveComponent(storedComponent);
  }, []);

  // Update localStorage whenever the activeComponent changes
  useEffect(() => {
    if (activeComponent) {
      localStorage.setItem('activeComponent', activeComponent);
    }
  }, [activeComponent]);

  const menuItems = [
    { id: 'log', label: 'Sistem günlükleri', icon: FileText },
    {
      id: 'temperature',
      label: 'Donanım Sıcaklık Değerleri',
      icon: Thermometer,
    },
    { id: 'usage', label: 'Donanım Kullanımı', icon: Activity },
    { id: 'container', label: 'Container Kullanımı', icon: Box },
  ];

  const renderActiveComponent = () => {
    if (!activeComponent) {
      return null; // Return null or a loading indicator while the active component is being determined
    }
    switch (activeComponent) {
      case 'temperature':
        return (
          <TemperatureGraphs
            host_cpu_temp={systemInfo.host_cpu_temp}
            host_gpu_temp={systemInfo.host_gpu_temp}
          />
        );
      case 'usage':
        return (
          <div className='bg-white shadow-lg rounded-lg p-6'>
            <h2 className='text-2xl font-bold mb-4'>CPU & GPU Usage</h2>
            <div className='h-80'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        );
      case 'log':
        return <LogEditor systemInfo={systemInfo} />;
      case 'container':
        return (
          <ContainerInformation containerInfos={systemInfo.container_info} />
        );
      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen text-sm  bg-gray-100'>
      <header className='bg-white shadow-md'>
        <nav className='container mx-auto px-4'>
          <ul className='flex justify-center items-center h-16'>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveComponent(item.id)}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                    activeComponent === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} className='mr-2' />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className='container mx-auto px-4 py-8 w-full'>
        <motion.div
          key={activeComponent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveComponent()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
