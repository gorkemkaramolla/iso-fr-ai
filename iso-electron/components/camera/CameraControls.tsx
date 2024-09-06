import React from 'react';
import {
  PlayCircleIcon,
  StopCircleIcon,
  XIcon,
  CircleIcon,
  Video,
  VideoOff,
} from 'lucide-react';
import { IoReload } from 'react-icons/io5';
interface CameraControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  stopStream: () => void;
  startStream: () => void;
  reloadStream: () => void;
  removeStream: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  isPlaying,
  isLoading,
  isRecording,
  stopStream,
  startStream,
  reloadStream,
  removeStream,
  startRecording,
  stopRecording,
}) => {
  const [tooltipText, setTooltipText] = React.useState('');
  const handleTooltip = () => {
    if (isLoading) {
      setTooltipText('Yayın yükleniyor...');
    } else if (isPlaying && !isRecording) {
      setTooltipText('Yayın devam ediyor...');
    } else if (isPlaying && isRecording) {
      setTooltipText('Video kaydı alınıyor...');
    } else {
      setTooltipText('Yayın durdu!');
    }
  };

  React.useEffect(() => {
    handleTooltip();
  }, [isLoading, isPlaying, isRecording]);

  return (
    <div className='dropdown dropdown-bottom dropdown-end'>
      <div
        tabIndex={0}
        role='button'
        className='btn btn-sm btn-outline  tooltip tooltip-left flex items-center justify-center border-slate-300'
        data-tip={tooltipText}
      >
        {isLoading ? (
          <span className='loading loading-spinner loading-sm'></span>
        ) : isPlaying ? (
          <CircleIcon
            className={`w-[1.4rem] h-[1.4rem] rounded-full 
                ${
                  isRecording
                    ? ' animate-pulse bg-red-600 text-red-600'
                    : ' text-[#41B06EE6] bg-[#41B06EE6]'
                }`}
          />
        ) : (
          <CircleIcon className='w-[1.4rem] h-[1.4rem] text-slate-800 rounded-full bg-slate-800' />
        )}
      </div>
      <ul
        tabIndex={0}
        className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
      >
        {isPlaying && (
          <li>
            <>
              <a onClick={reloadStream}>
                <IoReload className='w-6 h-6' /> Yenile
              </a>
            </>
          </li>
        )}
        <li>
          <>
            {isPlaying ? (
              <a
                onClick={() => stopStream()}
                className='transition-all duration-1000'
              >
                <StopCircleIcon className='w-6 h-6' />
                Yayını Durdur
              </a>
            ) : (
              <a
                onClick={() => startStream()}
                className='transition-all duration-1000'
              >
                <PlayCircleIcon className='w-6 h-6' />
                Yayını Başlat
              </a>
            )}
          </>
        </li>
        {!isLoading && isPlaying && (
          <li>
            <>
              {isRecording ? (
                <a
                  onClick={() => stopRecording()}
                  className='transition-all duration-1000'
                >
                  <VideoOff className='w-6 h-6' />
                  Kayıt Durdur
                </a>
              ) : (
                <button
                  onClick={() => startRecording()}
                  className='transition-all duration-1000 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Video className='w-6 h-6' />
                  Kayıt Başlat
                </button>
              )}
            </>
          </li>
        )}

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
