import React from 'react';
import useSystemInfo from '@/hooks/useSystemInfo';
import DraggableWrapper from '@/components/utility/DraggableWrapper';
import { Move } from 'lucide-react';

function MonitorWidget() {
  const { systemInfo } = useSystemInfo();

  return (
    <DraggableWrapper>
      <table className='cursor-grab table drag-handle border-2 py-2 px-4 w-64'>
        {/* <Move className='absolute top-1/2 left-1/2 -translate-x-1/2 w-8 h-8 hidden group-hover:block -translate-y-1/2 cursor-grab text-gray-400 animation-pulse'></Move> */}

        <thead>
          <tr className='bg-base-200 hover text-center'>
            <th className='px-4 border py-2'>Component</th>
            <th className='px-4 border py-2'>Temperature</th>
            <th className='px-4 border py-2'>Usage</th>
            <th className='px-4 border py-2'>Memory Usage</th>
          </tr>
        </thead>
        <tbody>
          <tr className='text-center bg-base-200 hover'>
            <td className='border px-4 py-2'>CPU</td>
            <td className='border px-4 py-2'>{systemInfo.cpu_temperature}</td>
            <td className='border px-4 py-2'>{systemInfo.cpu_usage}</td>
            <td className='border px-4 py-2'>N/A</td>
          </tr>
          <tr className='text-center bg-base-200 hover'>
            <td className='border px-4 py-2'>Memory</td>
            <td className='border px-4 py-2'>N/A</td>
            <td className='border px-4 py-2'>N/A</td>
            <td className='border px-4 py-2'>{systemInfo.memory_usage}</td>
          </tr>
          <tr className='text-center bg-base-200 hover'>
            <td className='border px-4 py-2'>GPU</td>
            <td className='border px-4 py-2'>{systemInfo.gpu_temperature}</td>
            <td className='border px-4 py-2'>{systemInfo.gpu_usage}</td>
            <td className='border px-4 py-2'>{systemInfo.gpu_memory_usage}</td>
          </tr>
        </tbody>
      </table>
    </DraggableWrapper>
  );
}

export default MonitorWidget;
