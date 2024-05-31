'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Expand } from 'lucide-react';
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
import DraggableWrapper from '@/components/utility/DraggableWrapper';
import MonitorWidget from '@/components/widgets/MonitorWidget';
import { useFloating } from '@floating-ui/react';
import CodeHighlighter from '@/components/utility/Highlight';
import GaugeWidget from '@/components/widgets/GaugeWidget';
const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);
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

  return (
    <div className='h-[91.5vh]  flex gap-2 overflow-y-scroll'>
      <div className='w-3/12  relative items-start flex flex-wrap h-full '>
        <DraggableWrapper uniqueId='1'>
          <MonitorWidget />
        </DraggableWrapper>
      </div>
      <div className='w-9/12 flex flex-col gap-3'>
        <div className='h-1/2 p-4  z-50 relative mockup-code'>
          <button onClick={goFullScreen}>
            <div className='bg-green-500 flex group justify-center items-center w-3 h-3 rounded-full absolute top-4 left-[5.20rem]'>
              <Expand className='w-2 h-2 text-black group-hover:opacity-100 opacity-0 transition-opacity ' />
            </div>
          </button>
          <div
            ref={elementRef}
            className='code-scroll h-full overflow-scroll  p-2 w-full z-10 '
          >
            <CodeHighlighter
              language='json'
              code={`{"time": "2024-05-31 11:32:21,634", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:23,643", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:24,688", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:26,692", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:27,746", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:29,752", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:30,781", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:32,788", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:33,805", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:35,811", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:36,859", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:38,866", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:39,906", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:41,912", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:42,955", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:44,962", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:46,002", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:48,009", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:49,027", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:51,033", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:52,075", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:54,082", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:55,123", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:32:57,129", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:32:58,162", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:00,169", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:01,211", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:03,218", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:04,242", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:06,248", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:07,265", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:09,271", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:10,290", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:12,294", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:13,309", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:15,315", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:16,344", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:18,352", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:19,381", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:21,390", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:22,406", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:24,408", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:25,423", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:27,429", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:28,440", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:30,444", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:31,468", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:33,475", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:34,490", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:36,496", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:37,509", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:39,515", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:40,529", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:42,534", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:43,550", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:45,553", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:46,572", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:48,577", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:49,608", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:51,615", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:52,635", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:54,637", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:55,654", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
{"time": "2024-05-31 11:33:57,660", "name": "audio_processing", "level": "INFO", "message": "Unsupported platform: Darwin"}
{"time": "2024-05-31 11:33:58,676", "name": "audio_processing", "level": "ERROR", "message": "Failed to get GPU stats: [Errno 2] No such file or directory: 'nvidia-smi'"}
      `}
            />
          </div>
        </div>
        <div className='h-1/2 w-full flex '>
          <div className=' w-5/12'>
            <div className='flex flex-col  justify-center h-full items-center  flex-wrap w-full'>
              <div className='w-full h-1/2 flex justify-center items-center '>
                <h2>CPU Temperature</h2>
                <GaugeWidget value={parseValue(systemInfo.cpu_temperature)} />
              </div>
              <div className='w-full h-1/2 flex justify-center items-center '>
                <h2>GPU Temperature</h2>

                <GaugeWidget value={parseValue(systemInfo.gpu_temperature)} />
              </div>
            </div>
          </div>
          <div className='w-7/12'>
            <h2>CPU Usage</h2>
            <LineChart width={600} height={150} data={cpuUsageData}>
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
            <h2>GPU Usage</h2>
            <LineChart width={600} height={150} data={gpuUsageData}>
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
      </div>

      {/* <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Object.entries(systemInfo.cpu_core_temps || {}).map(([core, temp]) => (
          <div key={core} className='flex gap-2'>
            <h2>{core} : </h2>
            <p>{temp}°C</p>
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default Dashboard;
