import React, { useEffect } from 'react';
import { Quality } from '@/utils/enums';
import Image from 'next/image';

interface CameraStreamProps {
  id: number;
  streamSrc?: string;
  selectedCamera: string;
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
          className='h-fit'
          src={streamSrc || ''}
          alt={`Video Stream`}
          width={1920}
          height={1080}
          onLoad={() => {
            setCameraStreams((prevStreams) =>
              prevStreams.map((stream) =>
                stream.id === id ? { ...stream, isLoading: false } : stream
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default CameraStream;