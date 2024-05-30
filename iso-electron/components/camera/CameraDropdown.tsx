import React from 'react';

interface CameraDropdownProps {
  selectedCamera: string;
  setSelectedCamera: React.Dispatch<React.SetStateAction<string>>;
  cameraStreams: CameraStream[];
  cameraUrls: { [key: string]: string };
  addCameraStream: (cameraLabel: string) => void;
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
  return (
    <div
      className={`bg-slate-100 p-4 rounded-xl m-4 flex gap-2 items-start ${
        showAddCamera ? 'hidden' : ''
      }`}
    >
      <select
        value={selectedCamera}
        onChange={(e) => setSelectedCamera(e.target.value)}
        className='select select-bordered select-primary w-fit'
      >
        <option disabled value='' className='select-option'>
          Kamera
        </option>
        {Object.keys(cameraUrls)
          .filter(
            (label) =>
              !cameraStreams.find((stream) => stream.selectedCamera === label)
          )
          .map((label) => (
            <option key={label} value={label} className='select-option'>
              {label}
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
          onClick={() => addCameraStream(selectedCamera)}
          className='btn btn-neutral text-white'
          disabled={cameraStreams.length >= 6 || selectedCamera === ''}
          aria-disabled={cameraStreams.length >= 6 || selectedCamera === ''}
        >
          Yayın Başlat
        </button>
      </div>
    </div>
  );
};

export default CameraDropdown;