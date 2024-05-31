import React from "react";
import CameraDropdown from "./CameraDropdown";
import QualityDropdown from "./QualityDropdown";
import CameraControls from "./CameraControls";
import CameraStream from "./CameraStream";
import { Quality } from "@/utils/enums";
import axios from "axios";
interface CameraStreamProps {
  id: number;
  selectedCamera: string;
  selectedQuality: Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  streamSrc?: string;
  onCameraChange: (id: number, selectedCamera: string) => void;
  onQualityChange: (id: number, selectedQuality: Quality) => void;
  availableIds: number[];
  setAvailableIds: React.Dispatch<React.SetStateAction<number[]>>;
  stopStream?: (id: number) => void;
  reloadStream?: (id: number) => void;
  onRemoveStream?: (id: number) => void;
  cameraUrls: { [key: string]: string };
  addCameraStream?: () => void;
  cameraStreams: CameraStream[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
}

const CameraStreamControl: React.FC<CameraStreamProps> = ({
  id,
  selectedCamera,
  selectedQuality,
  isPlaying,
  isLoading,
  isRecording,
  streamSrc,
  cameraStreams,
  availableIds,
  setCameraStreams,
  setAvailableIds,
  onCameraChange,
  onQualityChange,
  cameraUrls,
  addCameraStream,
}) => {
  const startRecording = () => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              isLoading: false,
              isPlaying: true,
              isRecording: true,
              streamSrc: `${
                process.env.NEXT_PUBLIC_FLASK_URL
              }/stream/${id}?camera=${selectedCamera}&quality=${
                camera.selectedQuality
              }&is_recording=${true}`,
            }
          : camera
      )
    );
  };

  const stopRecording = () => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              isLoading: true,
              isPlaying: true,
              isRecording: false,
              streamSrc: `${
                process.env.NEXT_PUBLIC_FLASK_URL
              }/stream/${id}?camera=${selectedCamera}&quality=${
                camera.selectedQuality
              }&is_recording=${false}`,
            }
          : camera
      )
    );
  };
  const stopStream = () => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              streamSrc: "",
              isLoading: false,
              isPlaying: false,
            }
          : camera
      )
    );
  };

  const reloadStream = () => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              streamSrc: `${process.env.NEXT_PUBLIC_FLASK_URL}/stream/${id}?camera=${selectedCamera}&quality=${camera.selectedQuality}`,
              isLoading: true,
              isPlaying: true,
            }
          : camera
      )
    );
  };
  const removeStream = () => {
    stopStream();
    setAvailableIds([...availableIds, id].sort((a, b) => a - b));
    setCameraStreams(cameraStreams.filter((camera) => camera.id !== id));
    console.log(cameraStreams);
  };
  return (
    <div className="rounded-lg min-h-[400px] max-h-fit w-full">
      <div className="text-sm text-center font-bold  bg-slate-50 border-none rounded-md py-1 m-0 border border-black drag-handle">
        <div className="flex flex-row space-x-4 gap-4 items-center justify-around p-2">
          <div className="text-black">
            Yayın {id} - <span className="text-red-500">{selectedCamera}</span>
          </div>
          <div className="flex flex-row gap-4">
            <CameraControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              isRecording={isRecording}
              stopStream={() => stopStream()}
              reloadStream={() => reloadStream()}
              removeStream={() => removeStream()}
              startRecording={() => startRecording()}
              stopRecording={() => stopRecording()}
            />
            <QualityDropdown
              selectedQuality={selectedQuality}
              onQualityChange={(quality) => onQualityChange(id, quality)}
            />
          </div>
        </div>
      </div>
      <div>{streamSrc}</div>
      <CameraStream
        id={id}
        streamSrc={streamSrc}
        selectedCamera={selectedCamera}
        selectedQuality={selectedQuality}
        cameraStreams={cameraStreams}
        setCameraStreams={setCameraStreams}
        isPlaying={isPlaying}
        isLoading={isLoading}
        // onLoad={() => onCameraChange(id, selectedCamera)}
      />
    </div>
  );
};

export default CameraStreamControl;
