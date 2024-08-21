import { Camera, CameraStream } from '@/types';
import React from 'react';

interface CameraDropdownProps {
  selectedCamera: Camera | undefined;
  setSelectedCamera: React.Dispatch<React.SetStateAction<Camera | undefined>>;
  cameraStreams: CameraStream[];
  cameraUrls: Camera[];
  addCameraStream: (camera: Camera) => void;

}

const CameraDropdown: React.FC<CameraDropdownProps> = ({
  selectedCamera,
  setSelectedCamera,
  cameraStreams,
  cameraUrls,
  addCameraStream,

}) => {
  const [videoInputDevices, setVideoInputDevices] = React.useState<
    MediaDeviceInfo[]
  >([]);

  React.useEffect(() => {
    const getVideoInputDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === 'videoinput'
        );
        console.log(videoInputs);
        setVideoInputDevices(videoInputs);
      } catch (error) {
        console.error('Error getting video input devices:', error);
      }
    };

    getVideoInputDevices();
  }, []);
  // const streams = Array.isArray(cameraStreams) ? cameraStreams : [];
  return (
    <div
      className={`flex gap-2`}
    >
      <select
        value={selectedCamera?.url || ''}
        onChange={(e) => {
          console.log(e.target.value);
          setSelectedCamera({
            label: e.target.childNodes[e.target.selectedIndex].textContent!,
            url: e.target.value,
          });
        }}
        className='select select-sm w-fit focus:outline-none'
      >
        <option disabled value='' className='select-option'>
          Kamera Seçiniz
        </option>
        {videoInputDevices?.map((device, index) => {
          const cameraUrl = index.toString();
          const isCameraStreamPresent = cameraStreams?.some(
            (stream) => stream.selectedCamera.url === cameraUrl
          );

          if (!isCameraStreamPresent) {
            return (
              <option
                key={device.deviceId}
                value={cameraUrl}
                className='select-option'
              >
                Yerel Kamera - {index + 1}
              </option>
            );
          }

          return null;
        })}
        {cameraUrls?.length !== 0 &&
          cameraUrls
            ?.filter(
              (camera) =>
                !cameraStreams?.find(
                  (stream) => stream.selectedCamera.label === camera.label
                )
            )
            .map((camera) => (
              <option
                key={camera.label}
                value={camera.url}
                className='select-option'
              >
                {camera.label}
              </option>
            ))}
      </select>
      <div
        className='tooltip tooltip-bottom'
        data-tip={
          cameraStreams.length >= 4 ? 'Maksimum 4 kamera eklenebilir' : null
        }
      >
        <button
          onClick={() => {
            selectedCamera && addCameraStream(selectedCamera);
          }}
          className='btn btn-sm btn-neutral text-white'
          disabled={cameraStreams.length >= 4 || selectedCamera === undefined}
          aria-disabled={
            cameraStreams.length >= 4 || selectedCamera === undefined
          }
        >
          Yayın Başlat
        </button>
      </div>
    </div>
  );
};

export default CameraDropdown;
