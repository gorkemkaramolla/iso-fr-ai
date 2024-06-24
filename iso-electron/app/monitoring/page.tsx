'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Expand } from 'lucide-react';

import useSystemInfo from '@/hooks/useSystemInfo';
import MonitorWidget from '@/components/widgets/MonitorWidget';
import CodeHighlighter from '@/components/utility/Highlight';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import UsageChart from '@/components/charts/usage';
const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  useEffect(() => {
    if (logCopied) {
      setTimeout(() => {
        setLogCopied(false);
      }, 400);
    }
  }, [logCopied]);

  const elementRef = useRef<HTMLDivElement>(null);
  const goFullScreen = () => {
    if (elementRef.current) {
      if (elementRef.current.requestFullscreen) {
        elementRef.current.requestFullscreen();
      } else if ((elementRef.current as any).mozRequestFullScreen) {
        /* Firefox */
        (elementRef.current as any).mozRequestFullScreen();
      } else if ((elementRef.current as any).webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        (elementRef.current as any).webkitRequestFullscreen();
      } else if ((elementRef.current as any).msRequestFullscreen) {
        /* IE/Edge */
        (elementRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleLogCopy = () => {
    if (systemInfo.logs_data) {
      navigator.clipboard.writeText(JSON.stringify(systemInfo.logs_data));
    }
    setLogCopied(true);
  };
  useEffect(() => {
    setIsClient(true);
    if (elementRef.current) {
      elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }
  }, []);

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (!isClient) {
    return null; // Return null on the server-side render
  }
  const fakeGPUData = [
    { name: '00:00', usage: 35 },
    { name: '01:00', usage: 30 },
    { name: '02:00', usage: 25 },
    { name: '03:00', usage: 20 },
    { name: '04:00', usage: 18 },
    { name: '05:00', usage: 15 },
    { name: '06:00', usage: 20 },
    { name: '07:00', usage: 25 },
    { name: '08:00', usage: 45 },
    { name: '09:00', usage: 50 },
    { name: '10:00', usage: 55 },
    { name: '11:00', usage: 60 },
    { name: '12:00', usage: 65 },
    { name: '13:00', usage: 70 },
    { name: '14:00', usage: 75 },
    { name: '15:00', usage: 80 },
    { name: '16:00', usage: 85 },
    { name: '17:00', usage: 90 },
    { name: '18:00', usage: 80 },
    { name: '19:00', usage: 70 },
    { name: '20:00', usage: 60 },
    { name: '21:00', usage: 55 },
    { name: '22:00', usage: 50 },
    { name: '23:00', usage: 45 },
  ];

  return (
    <div className='h-full  flex gap-2 overflow-y-scroll'>
      <div className='w-0 md:w-2/12  relative items-start flex flex-wrap h-full '>
        {/* <DraggableWrapper uniqueId='1'> */}
        <MonitorWidget />
        {/* </DraggableWrapper> */}
      </div>
      <div className='w-full code-scroll overflow-scroll md:w-10/12 flex flex-col gap-3 px-2'>
        <div className='h-1/2 p-4  z-50 relative mockup-code border-primary border rounded-xl  bg-black'>
          <button
            onClick={handleLogCopy}
            className={`hover:text-[#00FF00] absolute right-5 top-4 ${
              logCopied ? 'animate-ping duration-700' : ''
            }`}
          >
            {logCopied ? 'copied' : 'copy'}
          </button>{' '}
          <button onClick={goFullScreen}>
            <div className='bg-green-500 flex group justify-center items-center w-3 h-3 rounded-full absolute top-4 left-[5.20rem]'>
              <Expand className='w-2 h-2  group-hover:opacity-100 opacity-0 transition-opacity ' />
            </div>
          </button>
          <div ref={elementRef} className=' h-full code-scroll '>
            <CodeHighlighter
              language='json'
              code={`${JSON.stringify(systemInfo.logs_data, null, 2)} `}
            />
          </div>
        </div>
        <div className='h-1/2 w-full md:flex-row flex-col-reverse flex '>
          <div className='w-full  md:w-5/12'>
            <div className='flex flex-col  justify-center h-full items-center  flex-wrap w-full'>
              <div className='w-full h-1/2 flex justify-center items-center '>
                <h2>CPU Temperature</h2>
                <GaugeWidget
                  value={Number(
                    parseValue(systemInfo.cpu_temperature).toFixed(2)
                  )}
                />
              </div>
              <div className='w-full h-1/2 flex justify-center items-center '>
                <h2>GPU Temperature</h2>

                <GaugeWidget
                  value={Number(
                    parseValue(systemInfo.gpu_temperature).toFixed(2)
                  )}
                />
              </div>
            </div>
          </div>
          <div className='flex flex-col h-full md:w-7/12'>
            <div className='flex-grow w-full h-full relative'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
