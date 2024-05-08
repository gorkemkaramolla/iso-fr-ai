'use client';
import { Mic, MicOff, Chrome } from 'lucide-react';
import { Button } from 'primereact/button';
import React, { useEffect, useState, FC } from 'react';

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (event: any) => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => ISpeechRecognition;
    electronAPI?: {
      send: (channel: string, data: any) => void;
    };
  }
}

const GoogleLive: FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(
    null
  );

  const [transcripts, setTranscripts] = useState<
    { transcript: string; timestamp: string }[]
  >([]);
  const startListening = () => {
    setIsListening((prevState) => !prevState);
  };
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const webkitRecognition = new window.webkitSpeechRecognition();
      webkitRecognition.continuous = true;
      webkitRecognition.interimResults = false;
      webkitRecognition.lang = 'tr-TR';

      webkitRecognition.onresult = (event) => {
        const currentTimestamp = new Date().toLocaleTimeString();
        if (event.results[0].isFinal) {
          const newTranscript = event.results[event.resultIndex][0].transcript;
          setTranscripts((prevTranscripts) => [
            ...prevTranscripts,
            { transcript: newTranscript, timestamp: currentTimestamp },
          ]);
        }
      };

      webkitRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      // webkitRecognition.onend = () => {
      //   webkitRecognition.start();
      // };

      setRecognition(webkitRecognition);
    } else {
      alert('Web Speech API is not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    if (recognition) {
      if (isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    }
  }, [isListening, recognition]);
  return (
    <div className='w-full h-full'>
      {window.navigator.userAgent.includes('Electron') && (
        <a
          href='#'
          onClick={(event) => {
            event.preventDefault();
            window.electronAPI?.send(
              'open-url',
              'http://localhost:3000/speech'
            );
          }}
        >
          <span className='flex gap-2'>
            <Chrome />
            Google Chrome da aç
          </span>
        </a>
      )}
      <div className='max-h-[80vh] p-8  overflow-y-scroll container mx-auto bg-base-100 my-8'>
        <button onClick={startListening}>
          {isListening ? <MicOff /> : <Mic />}
        </button>
        {/* <h2 className='text-2xl text-center'>
          <span className='relative flex h-full w-full'>
            <span className='animate-ping absolute inline-flex  h-24 w-1/4 rounded-full bg-gray-500 opacity-25'></span>
          </span>
          {!isListening ? (
            <button className='flex justify-center'>
              <Mic className=' w-16 h-16' />
            </button>
          ) : (
            <button>
              <MicOff className=' w-16 h-16' />
            </button>
          )}
        </h2> */}
        <ul>
          {transcripts
            .map((entry, index) => (
              <li key={index} className='flex gap-2'>
                <div>{entry.timestamp}:</div> <span>{entry.transcript}</span>
              </li>
            ))
            .reverse()}
        </ul>
      </div>
      <div className='flex gap-3'></div>
    </div>
  );
};

export default GoogleLive;
