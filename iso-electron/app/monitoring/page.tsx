'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Cpu, MemoryStick, Box } from 'lucide-react';

import { Expand, Copy, Check, Search } from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

import useSystemInfo from '@/hooks/useSystemInfo';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import UsageChart from '@/components/charts/usage';
import Image from 'next/image';

const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    console.log(systemInfo);
  }, [systemInfo]);

  useEffect(() => {
    if (logCopied) {
      setTimeout(() => setLogCopied(false), 2000);
    }
  }, [logCopied]);

  useEffect(() => {
    setEditorContent(JSON.stringify(systemInfo.logs_data, null, 2));
  }, [systemInfo.logs_data]);

  useEffect(() => {
    if (searchResults) {
      setEditorContent(searchResults);
    }
  }, [searchResults]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_UTILS_URL
        }/search_logs?query=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error searching logs:', error);
      setSearchResults('Error searching logs');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.updateOptions({ readOnly: true });
  };

  if (!isClient) return null;

  return (
    <div className='flex flex-col md:flex-row gap-4 p-4 bg-gray-100 min-h-screen'>
      <div className='w-full container mx-auto space-y-4'>
        <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
          <div className='bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between items-center'>
            <h2 className='text-xl font-semibold mb-2 sm:mb-0'>System Logs</h2>
            <div className='flex items-center space-x-2'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder='Search logs...'
                className='px-2 py-1 rounded text-black w-40 sm:w-64'
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className='p-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50'
                title='Search'
              >
                <Search size={20} type='search' />
              </button>
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
          <div ref={elementRef} className='min-h-96 h-96 overflow-hidden'>
            <Editor
              height='100%'
              defaultLanguage='json'
              value={editorContent}
              theme={''}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                readOnly: true,
              }}
              onMount={handleEditorDidMount}
            />
          </div>
        </div>

        <div className='flex flex-col md:flex-row gap-4'>
          <div className='w-full md:w-5/12 bg-white shadow-lg rounded-lg p-4'>
            <h2 className='text-xl font-semibold mb-4'>
              CPU & GPU Temperatures
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-2'>CPU Temperature</h3>
                <GaugeWidget value={Number(parseValue('99').toFixed(2))} />
              </div>
              <div>
                <h3 className='text-lg font-medium mb-2'>GPU Temperature</h3>
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
              CPU and GPU Usage Chart
            </h2>
            <div className='h-64'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        </div>

        <div className='bg-white shadow-lg rounded-lg p-4'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <Box className='mr-2' /> Container Information
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {systemInfo.container_info.length === 0 ||
            !systemInfo.container_info ? (
              <div>Loading</div>
            ) : (
              systemInfo.container_info.map((container, index) => (
                <div
                  key={index}
                  className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <h3 className='text-lg font-medium mb-2 flex items-center'>
                    <Box className='mr-2' size={20} />
                    {container.container}
                  </h3>
                  <p className='flex items-center mb-1'>
                    <Cpu className='mr-2' size={16} />
                    CPU Usage:{' '}
                    <span className='font-semibold ml-1'>{container.cpu}</span>
                  </p>
                  <p className='flex items-center mb-1'>
                    <MemoryStick className='mr-2' size={16} />
                    Memory Usage:{' '}
                    <span className='font-semibold ml-1'>
                      {container.memory}
                    </span>
                  </p>
                  <p className='flex items-center'>
                    {/* <Gpu className='mr-2' size={16} /> */}
                    <Image
                      width={900}
                      height={900}
                      alt=''
                      className='mr-2 w-4 h-4'
                      src={'/nvidia.svg'}
                    />
                    GPU Usage:{' '}
                    <span className='font-semibold ml-1'>{container.gpu}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
