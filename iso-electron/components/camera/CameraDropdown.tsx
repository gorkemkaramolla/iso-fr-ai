import React from 'react';

interface CameraDropdownProps {
  selectedCamera: Camera | undefined;
  setSelectedCamera: React.Dispatch<React.SetStateAction<Camera | undefined>>;
  cameraStreams: CameraStream[];
  cameraUrls: Camera[];
  addCameraStream: (camera: Camera) => void;
  showAddCamera: boolean;
}

const CameraDropdown: React.FC<CameraDropdownProps> = ({
  selectedCamera,
  setSelectedCamera,
  cameraStreams,
  cameraUrls,
  addCameraStream,
  showAddCamera,
}) => {
  const streams = Array.isArray(cameraStreams) ? cameraStreams : [];
  return (
    <div
      className={`bg-slate-100 p-4 rounded-xl m-4 flex gap-2 items-start ${
        showAddCamera ? 'hidden' : ''
      }`}
    >
      <select
        value={selectedCamera?.url}
        onChange={(e) => {
          console.log(e.target.value);
          setSelectedCamera({
            label: e.target.childNodes[e.target.selectedIndex].textContent!,
            url: e.target.value,
          });
        }}
        className='select select-bordered select-primary w-fit'
      >
        <option disabled value='' className='select-option' selected>
          Kamera Seçiniz
        </option>
        {cameraUrls?.length !== 0 &&
          cameraUrls
            ?.filter(
              (camera) =>
                !streams.find(
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
          cameraStreams.length >= 6 ? 'Maksimum 6 kamera eklenebilir' : null
        }
      >
        <button
          onClick={() => {
            selectedCamera && addCameraStream(selectedCamera);
          }}
          className='btn btn-neutral text-white'
          disabled={cameraStreams.length >= 6 || selectedCamera === undefined}
          aria-disabled={
            cameraStreams.length >= 6 || selectedCamera === undefined
          }
        >
          Yayın Başlat
        </button>
      </div>
    </div>
  );
};

export default CameraDropdown;
