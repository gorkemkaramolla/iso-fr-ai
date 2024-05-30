import React from 'react';
import {
  RefreshCwIcon,
  PlayCircleIcon,
  StopCircleIcon,
  XIcon,
  CircleIcon,
} from 'lucide-react';

interface CameraControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  stopStream: () => void;
  reloadStream: () => void;
  removeStream: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isPlaying,
  isLoading,
  stopStream,
  reloadStream,
  removeStream,
}) => {
  return (
    <div className='dropdown dropdown-hover '>
      <div tabIndex={0} role='button' className='btn btn-sm bg-white'>
        {isLoading ? (
          <span className='loading loading-spinner loading-xs'></span>
        ) : isPlaying ? (
          <CircleIcon className='w-4 h-4 text-green-500 rounded-full bg-green-500' />
        ) : (
          <CircleIcon className='w-4 h-4 text-red-500 rounded-full bg-red-500' />
        )}
      </div>
      <ul
        tabIndex={0}
        className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
      >
        <li>
          <>
            {isPlaying ? (
              <a
                onClick={() => stopStream()}
                className='transition-all duration-1000'
              >
                <StopCircleIcon className='w-6 h-6' />
                Stop
              </a>
            ) : (
              <a
                onClick={() => reloadStream()}
                className='transition-all duration-1000'
              >
                <PlayCircleIcon className='w-6 h-6' />
                Start
              </a>
            )}
          </>
        </li>
        <li>
          <a onClick={() => reloadStream()}>
            <RefreshCwIcon className='w-6 h-6' />
            Yenile
          </a>
        </li>
        <li>
          <a onClick={() => removeStream()} className='text-red-500'>
            <XIcon className='w-6 h-6' />
            Kapat
          </a>
        </li>
      </ul>
    </div>
  );
};

export default CameraControls;
