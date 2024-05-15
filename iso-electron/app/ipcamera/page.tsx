'use client';
import React, { useState } from 'react';

enum Cameras {
  CAM1 = 'http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality',
  CAM2 = 'http://localhost:5555',
}
enum Quality {
  MotionJPEG = 'Motion JPEG',
  H264 = 'H.264',
  Quality = 'Quality',
  Balanced = 'Balanced',
  Bandwidth = 'Bandwidth',
  Mobile = 'Mobile',
  Max = 'Max',
  High = 'High',
  Low = 'Low',
  Medium = 'Medium',
}
interface CameraStream {
  id: number;
  selectedCamera: Cameras;
  selectedQuality: string | null;
  isPlaying: boolean;
  isLoading?: boolean;
}

const VideoStream: React.FC = () => {
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([
    {
      id: 1,
      selectedCamera: Cameras.CAM1,
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
          selectedCamera: Cameras.CAM1,
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

  const handleCameraChange = (id: number, selectedCamera: Cameras) => {
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
    <div className='container mx-auto'>
      <button
        className='btn btn-info rounded-3xl text-white text-semibold my-4'
        onClick={addCameraStream}
      >
        + Kamera Ekle
      </button>

      <div
        className='grid grid-cols-3 justify-center items-start gap-4 mx-auto 
      overflow-y-scroll max-h-[80vh]'
      >
        {cameraStreams.map((camera) => (
          <div
            key={camera.id}
            className='rounded-lg border border-black min-h-[300px] shadow-lg'
          >
            <div className='flex flex-row space-x-4 gap-4 items-center justify-center'>
              <div>
                {camera.isLoading ? (
                  <span className='loading loading-spinner'></span>
                ) : (
                  <span style={{ color: 'red' }}>🔴</span>
                )}
              </div>

              <div>
                <select
                  value={camera.selectedCamera}
                  onChange={(e) =>
                    handleCameraChange(camera.id, e.target.value as Cameras)
                  }
                  className='select select-bordered select-primary w-full max-w-xs m-4'
                >
                  <option disabled value='' className='select-option'>
                    Kamera
                  </option>
                  {Object.keys(Cameras).map((key) => (
                    <option
                      key={key}
                      value={Cameras[key as keyof typeof Cameras]}
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
            <button
              className='btn btn-default btn-outline m-4'
              onClick={() => togglePlay(camera.id)}
            >
              {camera.isPlaying ? 'Stop' : 'Start'}
            </button>
            <button
              className='btn btn-default btn-outline m-4'
              onClick={() => togglePlay(camera.id)}
            >
              Yenile
            </button>
            {camera.isPlaying && (
              <img
                className='w-full h-full'
                src={
                  camera.selectedCamera === Cameras.CAM1
                    ? Cameras.CAM1
                    : Cameras.CAM2
                }
                alt={`Video Stream ${camera.id}`}
              />
            )}

            <button
              className='btn btn-circle btn-outline inline-flex items-center'
              onClick={() => removeCameraStream(camera.id)}
            >
              <span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </span>
              <span>Kapat</span>
            </button>
          </div>
        ))}
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
