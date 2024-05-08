'use client';
import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';

const VideoStream = () => {
  const [quality, setQuality] = useState('Low');
  const videoStreamUrl = `http://localhost:5002/?quality=${quality}`; // URL where your Flask app is serving the video stream

  const handleQualityChange = (event: any) => {
    setQuality(event.target.value);
  };

  return (
    <div className='container mx-auto max-h-[40vh] '>
      <select
        defaultValue={quality}
        className='select max-w-xs'
        onChange={handleQualityChange}
      >
        <option value={'Quality'} disabled selected>
          Video Kalitesi
        </option>
        <option value={'Max'}>Max</option>
        <option value='High'>High</option>
        <option value={'Medium'}>Medium</option>
        <option value={'Low'}>Low</option>
      </select>
      <img className='w-full h-full' src={videoStreamUrl} alt='Video Stream' />
    </div>
  );
};

export default VideoStream;
