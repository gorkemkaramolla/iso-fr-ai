'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Cpu,
  MemoryStick,
  Box,
  Expand,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import useSystemInfo from '@/hooks/useSystemInfo';
import GaugeWidget from '@/components/widgets/GaugeWidget';
import UsageChart from '@/components/charts/usage';
import Image from 'next/image';
import { debounce } from 'lodash';

const Dashboard: React.FC = () => {
  const { systemInfo, cpuUsageData, gpuUsageData } = useSystemInfo();
  const [isClient, setIsClient] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [highlightTerm, setHighlightTerm] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const triggerSearch = (searchText: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      const matches = model.findMatches(
        searchText,
        true,
        false,
        false,
        null,
        true
      );

      // Highlight matches
      if (matches.length > 0) {
        editor.setSelections(
          matches.map((match: any) => {
            return {
              selectionStartLineNumber: match.range.startLineNumber,
              selectionStartColumn: match.range.startColumn,
              positionLineNumber: match.range.endLineNumber,
              positionColumn: match.range.endColumn,
            };
          })
        );

        // Scroll to the first match
        editor.revealRange(matches[0].range);
      }
    }
  };
  useEffect(() => {
    setEditorContent(JSON.stringify(systemInfo.logs_data, null, 2));
  }, [systemInfo.logs_data]);

  useEffect(() => {
    if (logCopied) {
      setTimeout(() => setLogCopied(false), 2000);
    }
  }, [logCopied]);

  useEffect(() => {
    if (searchResults) {
      setEditorContent(searchResults);
    } else {
      setEditorContent(JSON.stringify(systemInfo.logs_data, null, 2));
    }
  }, [searchResults, systemInfo.logs_data]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
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
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, []);

  const parseValue = (value: string) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_UTILS_URL
        }/search_logs?query=${encodeURIComponent(query)}`
      );

      setSearchResults(JSON.stringify(response.data, null, 2));

      console.log(searchQuery);
      setTimeout(() => {
        triggerSearch(searchQuery);
      }, 1000);
    } catch (error) {
      console.error('Error searching logs:', error);
      setSearchResults('Error searching logs');
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.updateOptions({ readOnly: true });
    editorRef.current = editor;
  };

  if (!isClient) return null;

  return (
    <div className='flex flex-col overflow-y-scroll md:flex-row gap-4 p-4 bg-gray-100 min-h-screen'>
      <div className='w-full container mx-auto space-y-4'>
        <div className='bg-white shadow-lg rounded-lg overflow-hidden'>
          <div ref={containerRef} className='flex flex-col h-full'>
            <div className='bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between items-center'>
              <h2 className='text-xl font-semibold mb-2 sm:mb-0'>
                Sistem Günlükleri
              </h2>
              <div className='flex items-center space-x-2'>
                <input
                  type='search'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Sistem Günlüklerinde Ara...'
                  className='px-2 py-1 rounded text-black w-40 sm:w-64'
                />
                <button
                  onClick={handleLogCopy}
                  className='p-2 rounded hover:bg-gray-700 transition-colors'
                  title={logCopied ? 'Copied!' : 'Copy logs'}
                >
                  {logCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
                <button
                  onClick={toggleFullScreen}
                  className='p-2 rounded hover:bg-gray-700 transition-colors'
                  title='Fullscreen'
                >
                  <Expand size={20} />
                </button>
              </div>
            </div>
            <div className='flex-grow h-96'>
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
        </div>

        <div className='flex flex-col md:flex-row gap-4'>
          <div className='w-full md:w-5/12 bg-white shadow-lg rounded-lg p-4'>
            <h2 className='text-xl font-semibold mb-4'>
              İşlemci & Ekran kartı Sıcaklıkları
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-2'>İşlemci Sıcaklığı</h3>
                <GaugeWidget
                  value={Number(
                    parseValue(systemInfo.host_cpu_temp).toFixed(2)
                  )}
                />
              </div>
              <div>
                <h3 className='text-lg font-medium mb-2'>
                  Ekran kartı Sıcaklığı
                </h3>
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
              İşlemci & Ekran kartı Kullanım Grafiği
            </h2>
            <div className='h-64'>
              <UsageChart cpuData={cpuUsageData} gpuData={gpuUsageData} />
            </div>
          </div>
        </div>

        <div className='bg-white shadow-lg rounded-lg p-4'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            <Box className='mr-2' /> Container Bilgileri
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {systemInfo.container_info.length === 0 ? (
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
                    İşlemci Kullanımı:{' '}
                    <span className='font-semibold ml-1'>{container.cpu}</span>
                  </p>
                  <p className='flex items-center mb-1'>
                    <MemoryStick className='mr-2' size={16} />
                    Bellek Kullanımı:{' '}
                    <span className='font-semibold ml-1'>
                      {container.memory}
                    </span>
                  </p>
                  <p className='flex items-center'>
                    <Image
                      width={900}
                      height={900}
                      alt=''
                      className='mr-2 w-4 h-4'
                      src={'/nvidia.svg'}
                    />
                    Ekran Kartı Kullanımı:{' '}
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
