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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(
    null
  );
  const startRecording = () => {
    if (!navigator.mediaDevices) {
      alert('Media device not supported in this browser.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const newMediaRecorder = new MediaRecorder(stream);
      newMediaRecorder.ondataavailable = (event) => {
        setRecordedAudio(event.data);
      };
      newMediaRecorder.start();
      setMediaRecorder(newMediaRecorder);
    });
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        const blob = new Blob([recordedAudio!], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      };
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };
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
    <div className='h-auto w-1/2'>
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
      {!window.navigator.userAgent.includes('Electron') && (
        <div className=' p-8  overflow-y-auto container mx-auto bg-base-100 my-8'>
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
          <ul className=' overflow-y-auto bg-base-300 rounded py-2 min-h-64 max-h-[50vh] flex flex-col gap-2 px-2 transition-all'>
            <div className='w-full flex justify-between items-center'>
              {!transcripts.length && (
                <div className='opacity-50'>
                  Mikrofona bas ve konuşmayı kaydet
                </div>
              )}
              <button onClick={mediaRecorder ? stopRecording : startRecording}>
                {mediaRecorder ? 'Kaydetmeyi durdur' : 'Kaydetmeye Başla'}
              </button>
              <button
                className=' p-3  rounded-full outline-1 outline outline-black'
                onClick={startListening}
              >
                {isListening ? (
                  <div className='flex gap-2'>
                    <MicOff />
                    Dinleniyor...
                  </div>
                ) : (
                  <div className='flex gap-2 '>
                    Dinlemeyi Başlat
                    <Mic />
                  </div>
                )}
              </button>
            </div>

            {transcripts
              .map((entry, index) => (
                <li key={index} className='flex gap-2'>
                  <div>{entry.timestamp}:</div> <span>{entry.transcript}</span>
                </li>
              ))
              .reverse()}
          </ul>
        </div>
      )}
      <div className='flex gap-3'></div>
    </div>
  );
};

export default GoogleLive;
