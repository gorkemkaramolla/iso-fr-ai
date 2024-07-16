'use client';

import React, { useState, useRef, useEffect } from 'react';
import useStore from '@/library/store';

interface MusicPlayerProps {
  audioSrc: string;
  date: string;
  title: string;
}

const MusicPlayer = ({ audioSrc, date, title }: MusicPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const currentTime = useStore((state) => state.currentTime);
  const setCurrentTime = useStore((state) => state.setCurrentTime);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(audioSrc);
    audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
    audioRef.current.addEventListener('timeupdate', whilePlaying);
    audioRef.current.addEventListener('ended', onEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener(
          'loadedmetadata',
          onLoadedMetadata
        );
        audioRef.current.removeEventListener('timeupdate', whilePlaying);
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [audioSrc]);

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (progressBarRef.current) {
      progressBarRef.current.value = '0';
    }
  };

  const play = () => {
    if (audioRef.current) {
      setIsPlaying(true);
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      setIsPlaying(false);
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    if (!prevValue) {
      play();
    } else {
      pause();
    }
  };

  const whilePlaying = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (progressBarRef.current) {
        progressBarRef.current.value = String(audioRef.current.currentTime);
      }
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };

  const changeRange = () => {
    if (progressBarRef.current && audioRef.current) {
      audioRef.current.currentTime = Number(progressBarRef.current.value);
      setCurrentTime(Number(progressBarRef.current.value));
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(
        Math.max(audioRef.current.currentTime + seconds, 0),
        duration
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (progressBarRef.current) {
        progressBarRef.current.value = String(newTime);
      }
    }
  };

  const formatTime = (time: number) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const seconds = Math.floor(time % 60);
      const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formatMinutes}:${formatSeconds}`;
    }
    return '00:00';
  };

  return (
    <div className='my-2 relative z-10 rounded-xl w-3/4 shadow-xl'>
      <div className='bg-white border-slate-100 transition-all duration-500 dark:bg-slate-800 dark:border-slate-500 border-b rounded-t-xl p-4 pb-6 sm:p-10 sm:pb-8 lg:p-6 '>
        <div className='flex items-center space-x-4'>
          <div className='min-w-0 flex-auto space-y-1 font-semibold'>
            <p className='text-cyan-500 transition-all duration-500 dark:text-cyan-400 text-sm leading-6'>
              <abbr title={date}>{date}</abbr>
            </p>
            <h2 className='text-slate-500 transition-all duration-500 dark:text-slate-400 text-sm leading-6 truncate'>
              Istanbul Sanayi Odası
            </h2>
            <p className='text-slate-900 transition-all duration-500 dark:text-slate-50 text-lg'>
              {title}
            </p>
          </div>
        </div>
        <div className='space-y-2'>
          <div className='relative'>
            <div className='bg-slate-100 transition-all duration-500 dark:bg-slate-700 rounded-full overflow-hidden'>
              <input
                type='range'
                ref={progressBarRef}
                defaultValue='0'
                onChange={changeRange}
                min='0'
                max={duration}
                step='0.01'
                className='w-full h-2 appearance-none'
                style={{
                  backgroundSize: `${(currentTime / duration) * 100}% 100%`,
                }}
              />
            </div>
            {/* <div
              className='ring-cyan-500 transition-all duration-500 dark:ring-cyan-400 ring-2 absolute top-1/2 w-4 h-4 -mt-2 -ml-2 flex items-center justify-center bg-white rounded-full shadow'
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className='w-1.5 h-1.5 bg-cyan-500 transition-all duration-500 dark:bg-cyan-400 rounded-full ring-1 ring-inset ring-slate-900/5'></div>
            </div> */}
          </div>
          <div className='flex justify-between text-sm leading-6 font-medium tabular-nums'>
            <div className='text-cyan-500 transition-all duration-500 dark:text-slate-100'>
              {formatTime(currentTime)}
            </div>
            <div className='text-slate-500 transition-all duration-500 dark:text-slate-400'>
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>
      <div className='bg-slate-50 text-slate-500 transition-all duration-500 dark:bg-slate-600 dark:text-slate-200 rounded-b-xl flex items-center'>
        <div className='flex-auto flex items-center justify-evenly'>
          <button
            type='button'
            aria-label='Rewind 10 seconds'
            onClick={() => handleSkip(-10)}
          >
            <svg width='24' height='24' fill='none'>
              <path
                d='M6.492 16.95c2.861 2.733 7.5 2.733 10.362 0 2.861-2.734 2.861-7.166 0-9.9-2.862-2.733-7.501-2.733-10.362 0A7.096 7.096 0 0 0 5.5 8.226'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              ></path>
              <path
                d='M5 5v3.111c0 .491.398.889.889.889H9'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              ></path>
            </svg>
          </button>
        </div>
        <button
          type='button'
          className='bg-white text-slate-900 transition-all duration-500 dark:bg-slate-100 dark:text-slate-700 flex-none -my-2 mx-auto w-12 h-12 rounded-full ring-1 ring-slate-900/5 shadow-md flex items-center justify-center'
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <svg width='30' height='32' fill='currentColor'>
              <rect x='6' y='4' width='4' height='24' rx='2'></rect>
              <rect x='20' y='4' width='4' height='24' rx='2'></rect>
            </svg>
          ) : (
            <svg width='30' height='32' fill='currentColor'>
              <path d='M9 5v24l18-12z'></path>
            </svg>
          )}
        </button>
        <div className='flex-auto flex items-center justify-evenly'>
          <button
            type='button'
            aria-label='Skip 10 seconds'
            onClick={() => handleSkip(10)}
          >
            <svg width='24' height='24' fill='none'>
              <path
                d='M17.509 16.95c-2.862 2.733-7.501 2.733-10.363 0-2.861-2.734-2.861-7.166 0-9.9 2.862-2.733 7.501-2.733 10.363 0 .38.365.711.759.991 1.176'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              ></path>
              <path
                d='M19 5v3.111c0 .491-.398.889-.889.889H15'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              ></path>
            </svg>
          </button>
          <button
            type='button'
            className='rounded-lg text-xs leading-6 font-semibold px-2 ring-2 ring-inset ring-slate-500 text-slate-500 transition-all duration-500 dark:text-slate-100 dark:bg-slate-500'
          >
            1x
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
