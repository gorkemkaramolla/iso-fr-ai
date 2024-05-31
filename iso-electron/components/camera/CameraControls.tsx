import React from "react";
import {
  RefreshCwIcon,
  PlayCircleIcon,
  StopCircleIcon,
  XIcon,
  CircleIcon,
  Video,
  VideoOff,
} from "lucide-react";

interface CameraControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  stopStream: () => void;
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
  reloadStream,
  removeStream,
  startRecording,
  stopRecording,
}) => {
  return (
    <div className="dropdown dropdown-hover ">
      <div tabIndex={0} role="button" className="btn btn-sm bg-white">
        {isLoading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : isPlaying ? (
          <CircleIcon
            className={`w-4 h-4 rounded-full 
                ${
                  isRecording
                    ? " animate-pulse bg-red-500 text-red-500"
                    : " text-[#41B06EE6] bg-[#41B06EE6]"
                }`}
          />
        ) : (
          <CircleIcon className="w-4 h-4 text-slate-800 rounded-full bg-slate-800" />
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <>
            {isPlaying ? (
              <a
                onClick={() => stopStream()}
                className="transition-all duration-1000"
              >
                <StopCircleIcon className="w-6 h-6" />
                Yayını Durdur
              </a>
            ) : (
              <a
                onClick={() => reloadStream()}
                className="transition-all duration-1000"
              >
                <PlayCircleIcon className="w-6 h-6" />
                Yayını Başlat
              </a>
            )}
          </>
        </li>
        <li>
          <>
            {isRecording ? (
              <a
                onClick={() => stopRecording()}
                className="transition-all duration-1000"
              >
                <VideoOff className="w-6 h-6" />
                Kayıt Durdur
              </a>
            ) : (
              <a
                onClick={() => startRecording()}
                className="transition-all duration-1000"
              >
                <Video className="w-6 h-6" />
                Kayıt Başlat
              </a>
            )}
          </>
        </li>
        <li>
          <a onClick={() => reloadStream()}>
            <RefreshCwIcon className="w-6 h-6" />
            Yenile
          </a>
        </li>
        <li>
          <a onClick={() => removeStream()} className="text-red-500">
            <XIcon className="w-6 h-6" />
            Kapat
          </a>
        </li>
      </ul>
    </div>
  );
};

export default CameraControls;
