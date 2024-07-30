'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FiPlay, FiPause } from 'react-icons/fi';

interface WaveAudioProps {
  audio_name: string;
}

const WaveAudio: React.FC<WaveAudioProps> = ({ audio_name }) => {
  const waveAudioRef = useRef<WaveSurfer | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    if (audioContainerRef.current) {
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

      waveform.load(audio_name);
      waveAudioRef.current = waveform;

      waveform.on('ready', () => {
        setDuration(waveform.getDuration());
      });

      waveform.on('audioprocess', () => {
        setCurrentTime(waveform.getCurrentTime());
      });

      //   waveform.on('seek', () => {
      //     setCurrentTime(waveform.getCurrentTime());
      //   });

      waveform.on('play', () => setIsPlaying(true));
      waveform.on('pause', () => setIsPlaying(false));

      return () => {
        waveform.destroy();
      };
    }
  }, [audio_name]);

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
