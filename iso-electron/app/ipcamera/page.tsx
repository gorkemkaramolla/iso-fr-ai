// 'use client';
// import React, { useState } from 'react';
// import {
//   RefreshCwIcon,
//   PlusIcon,
//   PlayCircleIcon,
//   StopCircleIcon,
//   XIcon,
//   CircleIcon,
// } from 'lucide-react';
// import { Camera, Quality } from '@/utils/enums';
// const VideoStream: React.FC = () => {
//   const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([
//     {
//       id: 1,
//       selectedCamera: Camera.CAM1,
//       selectedQuality: Quality.Quality,
//       isPlaying: true,
//       isLoading: true,
//       isRecording: false,
//     },
//   ]);

//   const addCameraStream = () => {
//     if (cameraStreams.length < Object.keys(Camera).length) {
//       // Create an array of all possible cameras
//       const allCameras = Object.values(Camera);

//       // Filter out the cameras that are already in use
//       const availableCameras = allCameras.filter(
//         (camera) =>
//           !cameraStreams.some((stream) => stream.selectedCamera === camera)
//       );

//       // Select the first available camera
//       const newSelectedCamera = availableCameras[0];

//       setCameraStreams([
//         ...cameraStreams,
//         {
//           id: cameraStreams.length + 1,
//           selectedCamera: newSelectedCamera,
//           selectedQuality: Quality.Quality,
//           isPlaying: true,
//           isLoading: true,
//           isRecording: false,
//         },
//       ]);
//     }
//   };

//   const removeCameraStream = (id: number) => {
//     setCameraStreams(cameraStreams.filter((camera) => camera.id !== id));
//   };

//   const handleCameraChange = (id: number, selectedCamera: Camera) => {
//     setCameraStreams(
//       cameraStreams.map((camera) =>
//         camera.id === id ? { ...camera, selectedCamera } : camera
//       )
//     );
//   };

//   const handleQualityChange = (id: number, selectedQuality: string | null) => {
//     setCameraStreams(
//       cameraStreams.map((camera) =>
//         camera.id === id ? { ...camera, selectedQuality } : camera
//       )
//     );
//   };

//   const togglePlay = (id: number) => {
//     setCameraStreams(
//       cameraStreams.map((camera) =>
//         camera.id === id ? { ...camera, isPlaying: !camera.isPlaying } : camera
//       )
//     );
//   };

//   return (
//     <div className=' h-screen overflow-y-scroll pb-20'>
//       <div className='container mx-auto mb-10'>
//         <div
//           className='tooltip tooltip-bottom'
//           data-tip={
//             cameraStreams.length < 6
//               ? 'Yeni kamera ekle'
//               : 'Maximum 6 kamera eklenebilir'
//           }
//         >
//           <button
//             className='btn btn-default btn-outline rounded-3xl text-semibold my-4'
//             onClick={addCameraStream}
//             disabled={cameraStreams.length >= 6}
//           >
//             <PlusIcon className='w-5 h-5' /> Kamera Ekle
//           </button>
//         </div>

//         <div className='flex flex-wrap  justify-center items-start mx-auto gap-4'>
//           {cameraStreams
//             .sort((a, b) => a.id - b.id)
//             .map((camera) => (
//               <div
//                 key={camera.id}
//                 className='rounded-lg border border-black min-h-[400px] max-h-fit w-3/4 shadow-lg '
//               >
//                 <div className='text-sm text-center font-bold text-white bg-black border-none rounded-md py-1 m-0 border border-black'>
//                   Yayın {camera.id}
//                 </div>
//                 <div className='flex flex-row space-x-4 gap-4 items-center justify-center p-4'>
//                   <div className='dropdown dropdown-hover'>
//                     <div tabIndex={0} role='button' className='btn '>
//                       {camera.isLoading ? (
//                         <span className='loading loading-spinner'></span>
//                       ) : camera.isPlaying ? (
//                         <CircleIcon className='w-6 h-6 text-green-500 rounded-full bg-green-500' />
//                       ) : (
//                         <CircleIcon className='w-6 h-6 text-red-500 rounded-full bg-red-500' />
//                       )}
//                     </div>
//                     <ul
//                       tabIndex={0}
//                       className='dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52'
//                     >
//                       <li>
//                         <a
//                           onClick={() => togglePlay(camera.id)}
//                           className='transition-all duration-1000'
//                         >
//                           {camera.isPlaying ? (
//                             <>
//                               <StopCircleIcon className='w-6 h-6' />
//                               Stop
//                             </>
//                           ) : (
//                             <>
//                               <PlayCircleIcon className='w-6 h-6' />
//                               Start
//                             </>
//                           )}
//                         </a>
//                       </li>
//                       <li>
//                         <a onClick={() => togglePlay(camera.id)}>
//                           <RefreshCwIcon className='w-6 h-6' />
//                           Yenile
//                         </a>
//                       </li>
//                       <li>
//                         <a
//                           onClick={() => removeCameraStream(camera.id)}
//                           className='text-red-500'
//                         >
//                           <XIcon className='w-6 h-6' />
//                           Kapat
//                         </a>
//                       </li>
//                     </ul>
//                   </div>
//                   <div>
//                     <select
//                       value={camera.selectedCamera}
//                       onChange={(e) =>
//                         handleCameraChange(camera.id, e.target.value as Camera)
//                       }
//                       className='select select-bordered select-primary w-full max-w-xs'
//                     >
//                       <option disabled value='' className='select-option'>
//                         Kamera
//                       </option>
//                       {Object.keys(Camera)
//                         .filter(
//                           (key) =>
//                             !cameraStreams.some(
//                               (stream) =>
//                                 stream.selectedCamera ===
//                                 Camera[key as keyof typeof Camera]
//                             ) ||
//                             Camera[key as keyof typeof Camera] ===
//                               camera.selectedCamera
//                         )
//                         .map((key) => (
//                           <option
//                             key={key}
//                             value={Camera[key as keyof typeof Camera]}
//                             className='select-option'
//                           >
//                             {key}
//                           </option>
//                         ))}
//                     </select>
//                   </div>

//                   <div>
//                     <select
//                       value={String(camera.selectedQuality)}
//                       onChange={(e) =>
//                         handleQualityChange(
//                           camera.id,
//                           e.target.value as Quality
//                         )
//                       }
//                       className='select select-bordered w-full max-w-xs'
//                     >
//                       <option disabled value='' className='select-option'>
//                         Çözünürlük
//                       </option>
//                       {Object.keys(Quality).map((quality) => (
//                         <option
//                           className='select-option'
//                           key={quality}
//                           value={quality}
//                         >
//                           {Quality[quality as keyof typeof Quality]}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//                 <div>
//                   {camera.isPlaying && (
//                     <img
//                       className='h-fit'
//                       src={`http://localhost:5004/stream/${camera.id}?camera=${camera.selectedCamera}&quality=${camera.selectedQuality}`}
//                       alt={`Video Stream ${camera.id}`}
//                       onLoad={() => {
//                         setCameraStreams((prevStreams) =>
//                           prevStreams.map((stream) =>
//                             stream.id === camera.id
//                               ? { ...stream, isLoading: false }
//                               : stream
//                           )
//                         );
//                       }}
//                     />
//                   )}
//                 </div>
//               </div>
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoStream;

const VideoStream: React.FC = () => {
  return <div></div>;
};
export default VideoStream;
