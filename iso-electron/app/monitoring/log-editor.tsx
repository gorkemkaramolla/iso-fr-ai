// components/LogEditor.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Check, Copy, Expand } from 'lucide-react';

interface LogEditorProps {
  systemInfo: any;
}

const LogEditor: React.FC<LogEditorProps> = ({ systemInfo }) => {
  const [logCopied, setLogCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [editorContent, setEditorContent] = useState('');
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

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_UTILS_URL
        }/search_logs?query=${encodeURIComponent(query)}`
      );

      setSearchResults(JSON.stringify(response.data, null, 2));
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

  return (
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
  );
};

export default LogEditor;
