'use client';
import React, { useState } from 'react';
import {
  RefreshCwIcon,
  PlusIcon,
  PlayCircleIcon,
  StopCircleIcon,
  XIcon,
  CircleIcon,
} from 'lucide-react';
import { Camera, Quality } from '@/utils/enums';
const VideoStream: React.FC = () => {
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([
    {
      id: 1,
      selectedCamera: Camera.CAM1,
      selectedQuality: null,
      isPlaying: true,
    },
  ]);

  const addCameraStream = () => {
    if (cameraStreams.length < 6) {
      const newCameraId = cameraStreams.length + 1;
      setCameraStreams([
        ...cameraStreams,
        {
          id: newCameraId,
          selectedCamera: Camera.CAM1,
          selectedQuality: null,
          isPlaying: true,
          isLoading: true,
        },
      ]);

      setTimeout(() => {
        setCameraStreams((prevStreams) =>
          prevStreams.map((stream) =>
            stream.id === newCameraId ? { ...stream, isLoading: false } : stream
          )
        );
      }, 5000);
    }
  };

  const removeCameraStream = (id: number) => {
    setCameraStreams(cameraStreams.filter((camera) => camera.id !== id));
  };

  const handleCameraChange = (id: number, selectedCamera: Camera) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id ? { ...camera, selectedCamera } : camera
      )
    );
  };

  const handleQualityChange = (id: number, selectedQuality: string | null) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id ? { ...camera, selectedQuality } : camera
      )
    );
  };

  const togglePlay = (id: number) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id ? { ...camera, isPlaying: !camera.isPlaying } : camera
      )
    );
  };

  return (
    <div className=' h-screen overflow-y-scroll pb-20'>
      <div className='container mx-auto mb-10'>
        <div
          className='tooltip tooltip-bottom'
          data-tip={
            cameraStreams.length < 6
              ? 'Yeni kamera ekle'
              : 'Maximum 6 kamera eklenebilir'
          }
        >
          <button
            className='btn btn-default btn-outline rounded-3xl text-semibold my-4'
            onClick={addCameraStream}
            disabled={cameraStreams.length >= 6}
          >
            <PlusIcon className='w-5 h-5' /> Kamera Ekle
          </button>
        </div>

        <div className='flex flex-wrap justify-center items-start mx-auto gap-4'>
          {cameraStreams.map((camera) => (
            <div
              key={camera.id}
              className='rounded-lg border border-black min-h-[300px] shadow-lg '
            >
              <div className='text-sm text-center text-white bg-black border-none rounded-md py-1 m-0 border border-black'>
                Yayın {camera.id}
              </div>
              <div className='flex flex-row space-x-4 gap-4 items-center justify-center p-4'>
                <div className='dropdown dropdown-hover'>
                  <div tabIndex={0} role='button' className='btn '>
                    {camera.isLoading ? (
                      <span className='loading loading-spinner'></span>
                    ) : (
                      <CircleIcon className='w-6 h-6 text-red-500 rounded-full bg-red-500' />
                    )}
                  </div>
                  <ul
                    tabIndex={0}
                    className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
                  >
                    <li>
                      <a
                        onClick={() => togglePlay(camera.id)}
                        className='transition-all duration-1000'
                      >
                        {camera.isPlaying ? (
                          <>
                            <StopCircleIcon className='w-6 h-6' />
                            Stop
                          </>
                        ) : (
                          <>
                            <PlayCircleIcon className='w-6 h-6' />
                            Start
                          </>
                        )}
                      </a>
                    </li>
                    <li>
                      <a onClick={() => togglePlay(camera.id)}>
                        <RefreshCwIcon className='w-6 h-6' />
                        Yenile
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() => removeCameraStream(camera.id)}
                        className='text-red-500'
                      >
                        <XIcon className='w-6 h-6' />
                        Kapat
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <select
                    value={camera.selectedCamera}
                    onChange={(e) =>
                      handleCameraChange(camera.id, e.target.value as Camera)
                    }
                    className='select select-bordered select-primary w-full max-w-xs'
                  >
                    <option disabled value='' className='select-option'>
                      Kamera
                    </option>
                    {Object.keys(Camera).map((key) => (
                      <option
                        key={key}
                        value={Camera[key as keyof typeof Camera]}
                        className='select-option'
                      >
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={String(camera.selectedQuality)}
                    onChange={(e) =>
                      handleQualityChange(camera.id, e.target.value as Quality)
                    }
                    className='select select-bordered w-full max-w-xs'
                  >
                    <option disabled value='' className='select-option'>
                      Çözünürlük
                    </option>
                    {Object.keys(Quality).map((quality) => (
                      <option
                        className='select-option'
                        key={quality}
                        value={quality}
                      >
                        {Quality[quality as keyof typeof Quality]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {camera.isPlaying && (
                <img
                  className='w-fit h-fit'
                  src={`http://localhost:5002/stream/${camera.id}?camera=${camera.selectedCamera}`}
                  alt={`Video Stream ${camera.id}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoStream;

// import React, { useState } from 'react';
// import { Dropdown } from 'primereact/dropdown';
// import { Button } from 'primereact/button';

// enum Cameras {
//   CAM1 = 'http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality',
//   CAM2 = 'http://localhost:5555',
// }
// const cameraOptions = Object.entries(Cameras).map(([label, value]) => ({
//   label,
//   value,
// }));
// const imageQualities = [
//   { name: 'Motion JPEG', code: 'MJPEG' },
//   { name: 'H.264', code: 'H264' },
//   { name: 'Quality', code: 'Quality' },
//   { name: 'Balanced', code: 'Balanced' },
//   { name: 'Bandwidth', code: 'Bandwidth' },
//   { name: 'Mobile', code: 'Mobile' },
//   { name: 'Max', code: 'Max' },
//   { name: 'High', code: 'High' },
//   { name: 'Low', code: 'Low' },
//   { name: 'Medium', code: 'Medium' },
// ];
// const VideoStream = () => {
//   const [selectedQuality1, setSelectedQuality1] = useState(null);
//   const [quality2, setQuality2] = useState('Quality');
//   const [selectedCamera1, setSelectedCamera1] = useState(Cameras.CAM1);
//   const [selectedCamera2, setSelectedCamera2] = useState(Cameras.CAM2);
//   const [isPlaying1, setIsPlaying1] = useState(true);
//   const [isPlaying2, setIsPlaying2] = useState(true);
//   const [cameraStreams, setCameraStreams] = useState([1]);

//   const response1 = `http://localhost:5002/stream1?camera=${selectedCamera1}`;
//   const response2 = `http://localhost:5002/stream2?camera=${selectedCamera2}`;

//   const handleCameraChange1 = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCamera1(event.target.value as Cameras);
//   };

//   const handleCameraChange2 = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCamera2(event.target.value as Cameras);
//   };

//   const togglePlay1 = () => {
//     setIsPlaying1(!isPlaying1);
//   };

//   const togglePlay2 = () => {
//     setIsPlaying2(!isPlaying2);
//   };

//   const handleAddCamera = () => {
//     const newCameraStreams = [...cameraStreams, cameraStreams.length + 1];
//     setCameraStreams(newCameraStreams);
//   };

//   return (
//     <div className='container mx-auto'>
//       <button
//         className='btn btn-info rounded-3xl text-white text-semibold my-4'
//         onClick={handleAddCamera}
//       >
//         + Kamera Ekle
//       </button>

//       <div
//         className='grid grid-cols-3 justify-center items-start gap-4 mx-auto
//       overflow-y-scroll max-h-[80vh]'
//       >
//         {cameraStreams.map((index) => (
//           <div
//             key={index}
//             className='rounded-lg border border-black min-h-[300px] shadow-lg'
//           >
//             <div className='flex gap-4 items-center justify-center'>
//               <div>
//                 <Dropdown
//                   value={selectedCamera1}
//                   options={cameraOptions}
//                   showClear
//                   checkmark
//                   onChange={(e) => setSelectedCamera1(e.value)}
//                   placeholder='Kamera'
//                   className='w-full m-4'
//                 />
//               </div>
//               <div>
//                 <Dropdown
//                   value={selectedQuality1}
//                   onChange={(e) => setSelectedQuality1(e.target.value)}
//                   options={imageQualities}
//                   optionLabel='name'
//                   showClear
//                   checkmark
//                   placeholder='Çözünürlük'
//                   className='w-full m-4'
//                 />
//               </div>
//             </div>
//             <button onClick={index === 1 ? togglePlay1 : togglePlay2}>
//               {index === 1
//                 ? isPlaying1
//                   ? 'Stop'
//                   : 'Start'
//                 : isPlaying2
//                 ? 'Stop'
//                 : 'Start'}
//             </button>
//             {index === 1 && isPlaying1 && (
//               <img
//                 className='w-full h-full'
//                 src={response1}
//                 alt='Video Stream 1'
//               />
//             )}
//             {index !== 1 && isPlaying2 && (
//               <img
//                 className='w-full h-full'
//                 src={response2}
//                 alt='Video Stream 2'
//               />
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default VideoStream;
