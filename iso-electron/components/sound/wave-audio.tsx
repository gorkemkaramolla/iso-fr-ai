import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FiPlay, FiPause } from 'react-icons/fi';
import axios from 'axios';
import useStore from '@/library/store';

interface WaveAudioProps {
  audio_name?: string;
  transcript_id?: string;
}

const WaveAudio: React.FC<WaveAudioProps> = ({ audio_name, transcript_id }) => {
  const waveAudioRef = useRef<WaveSurfer | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const setStoreCurrentTime = useStore((state) => state.setCurrentTime);

  const handleClick = () => {
    if (waveAudioRef.current) {
      if (!waveAudioRef.current.isPlaying()) {
        waveAudioRef.current.play();
      } else {
        waveAudioRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const fetchAudio = async () => {
      if (audioContainerRef.current) {
        try {
          const audioUrl = audio_name
            ? audio_name
            : `${process.env.NEXT_PUBLIC_DIARIZE_URL}/stream-audio/${transcript_id}`;

          const response = await axios.get(audioUrl, {
            withCredentials: true,
            responseType: 'blob',
          });

          const blobUrl = URL.createObjectURL(response.data);

          if (waveAudioRef.current) {
            waveAudioRef.current.destroy();
          }

          const waveform = WaveSurfer.create({
            container: audioContainerRef.current,
            waveColor: '#818cf8',
            progressColor: '#4f46e5',
            cursorColor: '#4f46e5',
            barWidth: 2,
            barRadius: 3,
            height: 60,
            normalize: true,
          });

          waveform.load(blobUrl);
          waveAudioRef.current = waveform;

          waveform.on('ready', () => {
            setDuration(waveform.getDuration());
          });

          waveform.on('audioprocess', () => {
            const current = waveform.getCurrentTime();
            setCurrentTime(current);
            setStoreCurrentTime(current);
          });

          waveform.on('play', () => setIsPlaying(true));
          waveform.on('pause', () => setIsPlaying(false));

          return () => {
            waveform.destroy();
            URL.revokeObjectURL(blobUrl);
          };
        } catch (error) {
          console.error('Failed to fetch audio:', error);
        }
      }
    };

    fetchAudio();

    return () => {
      if (waveAudioRef.current) {
        waveAudioRef.current.destroy();
      }
    };
  }, [audio_name, transcript_id, setStoreCurrentTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div>
      <div ref={audioContainerRef} style={{ cursor: 'pointer' }}></div>
      <div className='controls mt-2 flex items-center justify-center'>
        <button
          onClick={handleClick}
          className='bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors'
        >
          {isPlaying ? <FiPause /> : <FiPlay />}
        </button>
        <div className='ml-4 text-indigo-800'>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};

export default WaveAudio;
