'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Expand, Copy, Check } from 'lucide-react';

import useSystemInfo from '@/hooks/useSystemInfo';
// import MonitorWidget from '@/components/widgets/MonitorWidget';
import CodeHighlighter from '@/components/utility/Highlight';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import UsageChart from '@/components/charts/usage';

const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);
  const [logCopied, setLogCopied] = useState(false);

  useEffect(() => {
    console.log(systemInfo);
  }, [systemInfo]);

  useEffect(() => {
    if (logCopied) {
      setTimeout(() => setLogCopied(false), 2000);
    }
  }, [logCopied]);

  const elementRef = useRef<HTMLDivElement>(null);

  const goFullScreen = () => {
    if (elementRef.current?.requestFullscreen) {
      elementRef.current.requestFullscreen();
    }
  };

  const handleLogCopy = () => {
    if (systemInfo.logs_data) {
      navigator.clipboard.writeText(JSON.stringify(systemInfo.logs_data));
      setLogCopied(true);
    }
  };

  useEffect(() => {
    setIsClient(true);
    elementRef.current?.scrollTo(0, elementRef.current.scrollHeight);
  }, []);

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (!isClient) return null;

  return (
    <div className='flex flex-col md:flex-row gap-4 p-4 bg-gray-100 min-h-screen'>
      <div className='w-full md:w-2/12'>{/* <MonitorWidget /> */}</div>
      <div className='w-full md:w-10/12 space-y-4'>
        <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
          <div className='bg-gray-800 text-white p-4 flex justify-between items-center'>
            <h2 className='text-xl font-semibold'>System Logs</h2>
            <div className='space-x-2'>
              <button
                onClick={handleLogCopy}
                className='p-2 rounded hover:bg-gray-700 transition-colors'
                title={logCopied ? 'Copied!' : 'Copy logs'}
              >
                {logCopied ? <Check size={20} /> : <Copy size={20} />}
              </button>
              <button
                onClick={goFullScreen}
                className='p-2 rounded hover:bg-gray-700 transition-colors'
                title='Fullscreen'
              >
                <Expand size={20} />
              </button>
            </div>
          </div>
          <div ref={elementRef} className='h-64 overflow-auto p-4'>
            <CodeHighlighter
              language='json'
              code={JSON.stringify(systemInfo.logs_data, null, 2)}
            />
          </div>
        </div>

        <div className='flex flex-col md:flex-row gap-4'>
          <div className='w-full md:w-5/12 bg-white shadow-lg rounded-lg p-4'>
            <h2 className='text-xl font-semibold mb-4'>
              CPU & GPU Sıcaklıkları
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-2'>CPU Sıcaklığı</h3>
                <GaugeWidget
                  value={Number(
                    parseValue(systemInfo.host_cpu_temp).toFixed(2)
                  )}
                />
              </div>
              <div>
                <h3 className='text-lg font-medium mb-2'>GPU Sıcaklığı</h3>
                <GaugeWidget
                  value={Number(
                    parseValue(systemInfo.host_gpu_temp).toFixed(2)
                  )}
                />
              </div>
            </div>
          </div>
          <div className='w-full md:w-7/12 bg-white shadow-lg rounded-lg p-4'>
            <h2 className='text-xl font-semibold mb-4'>
              CPU ve GPU kullanım grafiği
            </h2>
            <div className='h-64'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        </div>

        <div className='bg-white shadow-lg rounded-lg p-4'>
          <h2 className='text-xl font-semibold mb-4'>Container Bilgileri</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {systemInfo.container_info.map((container, index) => (
              <div
                key={index}
                className='border rounded-lg p-4 hover:shadow-md transition-shadow'
              >
                <h3 className='text-lg font-medium mb-2'>
                  {container.container}
                </h3>
                <p>
                  CPU Usage:{' '}
                  <span className='font-semibold'>{container.cpu}</span>
                </p>
                <p>
                  Memory Usage:{' '}
                  <span className='font-semibold'>{container.memory}</span>
                </p>
                <p>
                  GPU Usage:{' '}
                  <span className='font-semibold'>{container.gpu}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
