import React, { useEffect, useRef, useState, useCallback } from 'react';
import qs from 'qs';
import Editor from '@monaco-editor/react';
import { Check, Copy, Expand, Download } from 'lucide-react';
import FilterChip from '@/components/ui/chip';
import NextDateRangePicker from '@/components/ui/date-range-picker';
import createApi from '@/utils/axios_instance';
import { Input } from '@nextui-org/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { debounce } from 'lodash';
import { motion } from 'framer-motion';
import Tooltip from '@/components/ui/tool-tip';
type LogField =
  | 'date'
  | 'log'
  | 'source'
  | 'id'
  | 'container_name'
  | 'container_id'
  | 'date_formatted';

interface LogEditorProps {
  systemInfo: any;
}

const LogEditor: React.FC<LogEditorProps> = ({ systemInfo }) => {
  const [logCopied, setLogCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<LogField[]>([
    'date',
    'log',
    'source',
    'id',
    'container_name',
    'container_id',
  ]);
  const [dateFilter, setDateFilter] = useState<{
    start?: number;
    end?: number;
    singleDate?: string;
  }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    setEditorContent(JSON.stringify(systemInfo.logs_data, null, 2));
  }, [systemInfo.logs_data]);

  useEffect(() => {
    if (logCopied) {
      const timer = setTimeout(() => setLogCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [logCopied]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editor.updateOptions({ readOnly: true });
    editorRef.current = editor;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleLogCopy = () => {
    if (editorContent) {
      navigator.clipboard.writeText(editorContent);
      setLogCopied(true);
    }
  };

  const handleLogExport = () => {
    if (editorContent) {
      const blob = new Blob([editorContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'logs.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

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

      if (matches.length > 0) {
        editor.setSelections(
          matches.map((match: any) => ({
            selectionStartLineNumber: match.range.startLineNumber,
            selectionStartColumn: match.range.startColumn,
            positionLineNumber: match.range.endLineNumber,
            positionColumn: match.range.endColumn,
          }))
        );

        editor.revealRange(matches[0].range);
      }
    }
  };

  const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);

  const performSearchWithFilter = useCallback(
    async (
      query: string,
      dateFilter: { start?: number; end?: number; singleDate?: string }
    ) => {
      setIsSearching(true);
      try {
        // Combine search query and date filter parameters
        const queryParams = {
          query: query || undefined,
          fields: activeFilters,
          ...(dateFilter.singleDate && {
            single_datetime: dateFilter.singleDate,
          }),
          ...(dateFilter.start && { start_date: dateFilter.start }),
          ...(dateFilter.end && { end_date: dateFilter.end }),
        };

        // Create query string from parameters
        const queryString = qs.stringify(queryParams, {
          arrayFormat: 'repeat',
        });
        console.log(queryString);

        // Send request to the API with the combined query string
        const response = await api.get(
          `/search_logs_with_filter?${queryString}`
        );
        const data = await response.json();

        // Filter the logs based on active filters
        const filteredLogs = data.filter((log: any) =>
          activeFilters.every((filter) => log.hasOwnProperty(filter))
        );

        // Update editor content and trigger visual search
        setEditorContent(JSON.stringify(filteredLogs, null, 2));
        setTimeout(() => triggerSearch(query), 1000);
      } catch (error) {
        console.error('Error searching logs:', error);
        setEditorContent('Filtrelerle eşleşen herhangi bir log bulunamadı.');
      } finally {
        setIsSearching(false);
      }
    },
    [activeFilters, api]
  );

  const debouncedSearch = useCallback(debounce(performSearchWithFilter, 300), [
    activeFilters,
    dateFilter,
  ]);

  useEffect(() => {
    debouncedSearch(searchQuery, dateFilter);
    return () => debouncedSearch.cancel();
  }, [searchQuery, dateFilter, debouncedSearch]);

  const handleFilterChange = (filters: LogField[]) => {
    setActiveFilters(filters);
    debouncedSearch(searchQuery, dateFilter);
  };

  const handleDateRangeChange = (dateRange: { start: number; end: number }) => {
    setDateFilter(dateRange);
    debouncedSearch(searchQuery, dateRange);
  };

  const handleDateChange = (date: string) => {
    setDateFilter({ singleDate: date });
    debouncedSearch(searchQuery, { singleDate: date });
  };

  return (
    <div className='bg-white shadow-md rounded-lg overflow-hidden'>
      <div ref={containerRef} className='flex flex-col h-full'>
        <div className='text-gray-900 p-4 flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>Sistem Günlükleri</h2>
          <div className='flex w-6/12 justify-center items-center flex-col space-y-2'>
            <NextDateRangePicker
              onDateChange={handleDateChange}
              onDateRangeChange={handleDateRangeChange}
            />
            <Input
              size='sm'
              type='search'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Logları Ara'
              className='py-1 rounded max-w-xl text-gray-900 w-full'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Tooltip content='Kopyala'>
              <motion.button
                onClick={handleLogCopy}
                className='p-2 rounded hover:bg-gray-200 transition-colors'
                title={logCopied ? 'Copied!' : 'Copy logs'}
                whileTap={{ scale: 0.95 }}
                animate={logCopied ? { rotate: [0, 360] } : { rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {logCopied ? <Check size={20} /> : <Copy size={20} />}
              </motion.button>
            </Tooltip>

            <Tooltip content='JSON olarak dışa aktar'>
              <motion.button
                onClick={handleLogExport}
                className='p-2 rounded hover:bg-gray-200 transition-colors'
                whileTap={{ scale: 0.95 }}
              >
                <Download size={20} />
              </motion.button>
            </Tooltip>

            <Tooltip content='Tam Ekran'>
              <motion.button
                onClick={toggleFullScreen}
                className='p-2 rounded hover:bg-gray-200 transition-colors'
                whileTap={{ scale: 0.95 }}
              >
                <Expand size={20} />
              </motion.button>
            </Tooltip>
          </div>
        </div>
        <div className={isFullScreen ? 'h-[100vh]' : 'h-[75vh]'}>
          <PanelGroup
            direction='horizontal'
            className={isFullScreen ? 'h-[100vh]' : 'h-[75vh]'}
          >
            <Panel defaultSize={75} minSize={50}>
              <Editor
                height='100%'
                defaultLanguage='json'
                value={editorContent}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  readOnly: true,
                  theme: 'vs-light',
                }}
                onMount={handleEditorDidMount}
              />
            </Panel>
            <PanelResizeHandle className='w-1 bg-gray-300 hover:bg-gray-400 transition-colors' />
            <Panel defaultSize={25} maxSize={40} minSize={0}>
              <div className='h-full bg-gray-100 p-4 overflow-y-auto'>
                <FilterChip onFilterChange={handleFilterChange} />
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
};

export default LogEditor;
