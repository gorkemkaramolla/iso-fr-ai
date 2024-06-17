import React, { useEffect } from 'react';
import { Quality } from '@/utils/enums';
import Image from 'next/image';

interface CameraStreamProps {
  id: number;
  streamSrc?: string;
  selectedCamera: Camera | undefined;
  selectedQuality: Quality;
  isPlaying: boolean;
  isLoading: boolean;

  cameraStreams: CameraStream[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
  // onLoad: () => void;
}

const CameraStream: React.FC<CameraStreamProps> = ({
  id,
  streamSrc,
  isPlaying,
  setCameraStreams,
  // onLoad,
}) => {
  return (
    <div>
      {isPlaying && (
        <Image
          className='h-fit rounded-b-lg aspect-video'
          src={streamSrc || ''}
          alt={`Video Stream ${id}`}
          width={1920}
          height={1080}
          objectFit='cover'
          onLoad={() => {
            setCameraStreams((prevStreams) =>
              prevStreams.map((stream) =>
                stream.id === id ? { ...stream, isLoading: false } : stream
              )
            );
          }}
          onError={() => {
            console.log('Error loading stream');
            setCameraStreams((prevStreams) =>
              prevStreams.map((stream) =>
                stream.id === id ? { ...stream, isLoading: true } : stream
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default CameraStream;
