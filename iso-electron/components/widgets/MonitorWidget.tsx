import React from 'react';
import useSystemInfo from '@/hooks/useSystemInfo';
import DraggableWrapper from '@/components/utility/DraggableWrapper';
import { Move } from 'lucide-react';
import Image from 'next/image';

function MonitorWidget() {
  const { systemInfo } = useSystemInfo();

  return (
    <table className='table-zebra cursor-grab table drag-handle border-2 py-2 px-4 rounded'>
      <tbody>
        <tr className='text-center hover'>
          <td className='border px-4 py-2'>Component</td>
          <td className='border px-4 py-2'>CPU</td>
        </tr>
        <tr className='text-center hover'>
          <td className='border px-4 py-2'>Temperature</td>
          <td className='border px-4 py-2'>{systemInfo.cpu_temperature}</td>
        </tr>
        <tr className='text-center hover'>
          <td className='border px-4 py-2'>Usage</td>
          <td className='border px-4 py-2'>{systemInfo.cpu_usage}</td>
        </tr>
        <tr className='text-center hover'>
          <td className='border px-4 py-2'>Memory Usage</td>
          <td className='border px-4 py-2'>N/A</td>
        </tr>
        <tr className='text-center hover'>
          <td className='border px-4 py-2'>Component</td>
          <td className='border px-4 py-2'>Memory</td>
        </tr>
      </tbody>
    </table>
  );
}

export default MonitorWidget;
