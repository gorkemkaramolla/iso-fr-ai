'use client';

import React, { useState, useRef, useEffect } from 'react';
import useStore from '@/library/store';
import { formatDate } from '@/utils/formatDate';

interface MusicPlayerProps {
  audioSrc: string;
  title: string;
  date: string;
}

const MusicPlayer = ({ audioSrc, title, date }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const currentTime = useStore((state) => state.currentTime);
  const setCurrentTime = useStore((state) => state.setCurrentTime);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioSrc);
    audioRef.current.addEventListener('loadedmetadata', () =>
      setDuration(audioRef.current!.duration)
    );
    audioRef.current.addEventListener('timeupdate', () =>
      setCurrentTime(audioRef.current!.currentTime)
    );
    return () => {
      audioRef.current?.pause();
      audioRef.current?.removeEventListener('loadedmetadata', () => {});
      audioRef.current?.removeEventListener('timeupdate', () => {});
    };
  }, [audioSrc, setCurrentTime]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className='bg-white shadow w-full rounded-lg p-4  mx-auto'>
      <h3 className='text-sm font-medium text-gray-900 truncate mb-2'>
        {formatDate(date)}
      </h3>
      <h3 className='text-sm font-medium text-gray-900 truncate mb-2'>
        {title}
      </h3>
      <div className='flex items-center mb-2'>
        <button
          onClick={togglePlayPause}
          className='text-blue-500 focus:outline-none'
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <input
          type='range'
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleProgressChange}
          className='w-full mx-2'
        />
      </div>
      <div className='text-xs text-gray-500 flex justify-between'>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default MusicPlayer;
