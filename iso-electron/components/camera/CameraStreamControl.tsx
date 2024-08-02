import React from "react";
import QualityDropdown from "./QualityDropdown";
import CameraControls from "./CameraControls";
import CameraStream from "./CameraStream";
import { Quality } from "@/utils/enums";
import { Toast } from "primereact/toast";

interface CameraStreamProps {
  id: number;
  selectedCamera: Camera | undefined;
  selectedQuality: keyof typeof Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isRecording: boolean;
  isClose: boolean;
  streamSrc?: string;
  availableIds: number[];
  setAvailableIds: React.Dispatch<React.SetStateAction<number[]>>;
  stopStream?: (id: number) => void;
  startStream?: (id: number) => void;
  onRemoveStream?: (id: number) => void;
  addCameraStream?: () => void;
  cameraStreams: CameraStream[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
  isLocalCamera?: boolean;
  toast: React.RefObject<Toast>;
}

const CameraStreamControl: React.FC<CameraStreamProps> = ({
  id,
  selectedCamera,
  selectedQuality,
  isPlaying,
  isLoading,
  isRecording,
  isClose,
  streamSrc,
  cameraStreams,
  isLocalCamera,
  setCameraStreams,
  setAvailableIds,
  toast,
}) => {
  // const [isClose, setIsClose] = React.useState(false);
  const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
  const startRecording = () => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              isLoading: false,
              isPlaying: true,
              isRecording: true,
              streamSrc: `${BASE_URL}/stream/${id}?camera=${
                selectedCamera?.url
              }&quality=${camera.selectedQuality}&is_recording=${true}`,
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
              isLoading: false,
              isPlaying: true,
              isRecording: false,
              streamSrc: `${BASE_URL}/stream/${id}?camera=${
                selectedCamera?.url
              }&quality=${camera.selectedQuality}&is_recording=${false}`,
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
              isRecording: false,
              isClose: true,
            }
          : camera
      )
    );
  };

  const startStream = () => {
   
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              isLoading: true,
              isPlaying: true,
              isRecording: false,
              isClose: false,
              streamSrc: `${BASE_URL}/stream/${id}?camera=${
                selectedCamera?.url
              }&quality=${camera.selectedQuality}&is_recording=${false}`,
            }
          : camera
      )
    );
  };
  const removeStream = () => {
    // stopStream();

    setAvailableIds((prevIds) => [...prevIds, id].sort((a, b) => a - b));

    setCameraStreams((prevStreams) => {
      const updatedStreams = prevStreams.filter((camera) => camera.id !== id);

      if (typeof window !== "undefined") {
        // Save the updated list to localStorage
        localStorage.setItem("cameraStreams", JSON.stringify(updatedStreams));
      }

      return updatedStreams;
    });
  };
  const handleQualityChange = (id: number, selectedQuality: string | null) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id
          ? {
              ...camera,
              selectedQuality: selectedQuality,
              streamSrc: `${BASE_URL}/stream/${id}?camera=${selectedCamera?.url}&quality=${selectedQuality}&is_recording=${camera.isRecording}`,
            }
          : camera
      )
    );
    console.log(cameraStreams);
  };
  return (
    <div className={`rounded-lg min-h-[350px] max-h-fit w-full`}>
      <div
        className="text-sm text-center font-bold  bg-slate-50 
      border-none rounded-md py-1 m-0 border border-black drag-handle
      cursor-move"
      >
        <div className="flex flex-row space-x-4 gap-4 items-center justify-between  px-20">
          <div className="">
            Yayın {id} -{" "}
            <span className="text-red-500">{selectedCamera?.label}</span>
          </div>
          <div className="flex flex-row gap-4 items-center">
            {isNaN(parseFloat(selectedCamera?.url ?? "")) ? (
              <QualityDropdown
                id={id}
                selectedQuality={selectedQuality}
                handleQualityChange={handleQualityChange}
              />
            ) : null}
            <CameraControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              isRecording={isRecording}
              stopStream={() => stopStream()}
              startStream={() => startStream()}
              removeStream={() => removeStream()}
              startRecording={() => startRecording()}
              stopRecording={() => stopRecording()}
            />
          </div>
        </div>
      </div>
      {/* <div>{streamSrc}</div> */}
      <CameraStream
        id={id}
        streamSrc={streamSrc}
        selectedCamera={selectedCamera}
        selectedQuality={selectedQuality}
        cameraStreams={cameraStreams}
        setCameraStreams={setCameraStreams}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isLocalCamera={isLocalCamera}
        isRecording={isRecording}
        isClose={isClose}
        toast={toast}
        // onLoad={() => onCameraChange(id, selectedCamera)}
      />
    </div>
  );
};

export default CameraStreamControl;
