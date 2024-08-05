import React, { useEffect, useRef, useState, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
import axios from 'axios';
import useStore from '@/library/store';

interface Segment {
  start_time: number;
  end_time: number;
  speaker: string;
}

interface WaveAudioProps {
  audio_name?: string;
  transcript_id?: string;
  segments: Segment[];
  onTimeUpdate?: (currentTime: number) => void;
  speakerColors: Record<string, string>;
}

const WaveAudio: React.FC<WaveAudioProps> = ({
  audio_name,
  segments,
  speakerColors,
  transcript_id,
  onTimeUpdate,
}) => {
  const waveAudioRef = useRef<WaveSurfer | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const setStoreCurrentTime = useStore((state) => state.setCurrentTime);

  const customTimelinePlugin = useMemo(
    () =>
      Timeline.create({
        container: timelineContainerRef.current as HTMLElement,
        height: 12,
        timeInterval: 15,
        primaryLabelInterval: 60,
        secondaryLabelInterval: 15,
        formatTimeCallback: (seconds) => {
          const minutes = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        },
      }),
    []
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
                  color: speakerColors[segment.speaker],
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
            URL.revokeObjectURL(blobUrl);
          };
        } catch (error) {
          console.error('Failed to fetch audio:', error);
        }
      }
    };

    fetchAudio();

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
    onTimeUpdate, // Add this dependency to ensure the callback is up-to-date
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className='flex  flex-col w-full py-4 conati mx-auto space-y-2'>
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
};

export default WaveAudio;
