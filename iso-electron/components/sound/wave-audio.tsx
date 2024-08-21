import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import { FaAngleDown } from 'react-icons/fa';
import createApi from '@/utils/axios_instance';
import useStore from '@/library/store';

interface Segment {
  start_time: number;
  end_time: number;
  speaker: string;
}

interface WaveAudioProps {
  audio_name?: string;
  transcript_id?: string;
  segments?: Segment[];
  onTimeUpdate?: (currentTime: number) => void;
  speakerColors?: Record<string, string>;
  handleHidePlayer?: () => void;
  isVisible: boolean; // Prop to control visibility
  onHidden?: () => void; // Callback for when the animation completes
  skipAnimation?: boolean; // Flag to skip animation on initial load
  viewMode: number;
}

const WaveAudio: React.FC<WaveAudioProps> = ({
  audio_name,
  segments,
  speakerColors,
  transcript_id,
  onTimeUpdate,
  handleHidePlayer,
  isVisible,
  onHidden,
  viewMode,
  skipAnimation = false, // Default to false
}) => {
  const waveAudioRef = useRef<WaveSurfer | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const setStoreCurrentTime = useStore((state) => state.setCurrentTime);
  const api = useMemo(() => createApi(process.env.NEXT_PUBLIC_DIARIZE_URL), []); // Create API instance with the base URL

  const customTimelinePlugin = useMemo(
    () =>
      Timeline.create({
        container: timelineContainerRef.current as HTMLElement,
        height: 12,
        timeInterval: 45,
      }),
    [timelineContainerRef]
  );

  const regionsPlugin = useMemo(() => RegionsPlugin.create(), []);

  const handlePlayPause = () => {
    if (waveAudioRef.current) {
      waveAudioRef.current.playPause();
      setIsPlaying(waveAudioRef.current.isPlaying());
    }
  };

  const handleSkipBackward = () => {
    if (waveAudioRef.current) {
      waveAudioRef.current.skip(-10);
    }
  };

  const handleSkipForward = () => {
    if (waveAudioRef.current) {
      waveAudioRef.current.skip(10);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadAudio = async () => {
      if (audioContainerRef.current) {
        try {
          let blobUrl: string;

          if (viewMode === 0 && audio_name) {
            // Load audio from file picker
            blobUrl = audio_name; // The file picker provides a blob URL directly
          } else if (viewMode === 1 && transcript_id) {
            // Fetch audio from backend
            const response = await api.get(`/stream-audio/${transcript_id}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob(); // Convert the response to a blob
            blobUrl = URL.createObjectURL(blob);
          } else {
            throw new Error('Invalid viewMode or missing identifiers');
          }

          if (waveAudioRef.current) {
            waveAudioRef.current.destroy();
          }

          const waveform = WaveSurfer.create({
            container: audioContainerRef.current!,
            waveColor: '#818cf8',
            progressColor: '#4f46e5',
            cursorColor: '#4f46e5',
            barWidth: 4,
            barRadius: 12,
            height: 60,
            normalize: true,
            plugins: [customTimelinePlugin, regionsPlugin],
          });

          waveform.load(blobUrl);
          waveAudioRef.current = waveform;

          waveform.on('ready', () => {
            if (!isMounted) return;

            setDuration(waveform.getDuration());

            segments &&
              segments.forEach((segment: Segment) => {
                regionsPlugin.addRegion({
                  start: segment.start_time,
                  end: segment.end_time,
                  color: speakerColors
                    ? speakerColors[segment.speaker]
                    : 'rgba(0,0,0,0.1)',
                  resize: false,
                  drag: false,
                });
              });
          });

          waveform.on('audioprocess', () => {
            if (!isMounted) return;

            const current = waveform.getCurrentTime();
            setCurrentTime(current);
            setStoreCurrentTime(current);

            if (onTimeUpdate) {
              onTimeUpdate(current); // Pass current time to parent
            }
          });

          waveform.on('play', () => {
            if (isMounted) setIsPlaying(true);
          });

          waveform.on('pause', () => {
            if (isMounted) setIsPlaying(false);
          });

          return () => {
            waveform.destroy();
            if (viewMode === 1) {
              URL.revokeObjectURL(blobUrl); // Revoke object URL if fetched
            }
          };
        } catch (error) {
          console.error('Failed to load audio:', error);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (waveAudioRef.current) {
        waveAudioRef.current.destroy();
        waveAudioRef.current = null;
      }
    };
  }, [
    audio_name,
    transcript_id,
    segments,
    customTimelinePlugin,
    regionsPlugin,
    setStoreCurrentTime,
    onTimeUpdate,
    api,
    speakerColors,
    viewMode, // Ensure it re-loads on viewMode change
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (viewMode === 0)
    return (
      <div className='flex  flex-col w-full py-4 mx-auto space-y-2'>
        <div className='flex items-center space-x-4'>
          <div className='flex-grow'>
            <div ref={audioContainerRef} className='w-full h-16'></div>
            <div ref={timelineContainerRef} className='w-full'></div>
          </div>
          <div className='flex flex-col items-center space-y-2'>
            <div className='text-indigo-800 font-medium text-sm'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={handleSkipBackward}
                className='text-indigo-600 hover:text-indigo-800 transition-colors'
                aria-label='Skip Backward'
              >
                <FiSkipBack size={20} />
              </button>
              <button
                onClick={handlePlayPause}
                className='bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors'
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>
              <button
                onClick={handleSkipForward}
                className='text-indigo-600 hover:text-indigo-800 transition-colors'
                aria-label='Skip Forward'
              >
                <FiSkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  else
    return (
      <motion.div
        initial={skipAnimation ? { y: 0 } : { y: 100, opacity: 0 }} // Skip animation if flag is set
        animate={{ y: isVisible ? 0 : 100, opacity: 1 }} // Animate into view or out of view
        exit={{ y: 100 }} // Move out of view when exiting
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        onAnimationComplete={() => !isVisible && onHidden?.()} // Callback when animation completes
        className='flex flex-col w-full   py-4 mx-auto space-y-2
        
        
        '
      >
        <div className='flex items-center relative space-x-4 px-12 w-full py-2 rounded-xl glass-effect'>
          <button
            onClick={handleHidePlayer}
            className='absolute left-5 bg-primary text-white p-1 cursor-pointer text-xl rounded-full'
          >
            <FaAngleDown />
          </button>

          <div className='flex-grow'>
            <div ref={audioContainerRef} className='w-full'></div>
            <div ref={timelineContainerRef} className='w-full'></div>
          </div>

          <div className='flex flex-col items-center space-y-2'>
            <div className='text-indigo-800 font-medium text-sm'>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className='flex items-center space-x-2'>
              <button
                onClick={handleSkipBackward}
                className='text-indigo-600 hover:text-indigo-800 transition-colors'
                aria-label='Skip Backward'
              >
                <FiSkipBack size={20} />
              </button>

              <button
                onClick={handlePlayPause}
                className='bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors'
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>

              <button
                onClick={handleSkipForward}
                className='text-indigo-600 hover:text-indigo-800 transition-colors'
                aria-label='Skip Forward'
              >
                <FiSkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
};

export default WaveAudio;
