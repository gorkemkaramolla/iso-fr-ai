'use client';
// React example
// See https://github.com/katspaugh/wavesurfer-react

import * as React from 'react';
const { useMemo, useState, useCallback, useRef } = React;
import { useWavesurfer } from '@wavesurfer/react';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';

const audioUrls = ['test.wav'];

const formatTime = (seconds: number) =>
  [seconds / 60, seconds % 60]
    .map((v) => `0${Math.floor(v)}`.slice(-2))
    .join(':');

// A React component that will render wavesurfer
export default function Test() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [urlIndex, setUrlIndex] = useState(0);

  const { wavesurfer, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
    url: audioUrls[urlIndex],
    plugins: useMemo(() => [Timeline.create()], []),
  });

  const onUrlChange = useCallback(() => {
    setUrlIndex((index) => (index + 1) % audioUrls.length);
  }, []);

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  return (
    <>
      <div ref={containerRef} />

      <p>Current audio: {audioUrls[urlIndex]}</p>

      <p>Current time: {formatTime(currentTime)}</p>

      <div style={{ margin: '1em 0', display: 'flex', gap: '1em' }}>
        <button onClick={onUrlChange}>Change audio</button>

        <button onClick={onPlayPause} style={{ minWidth: '5em' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </>
  );
}
