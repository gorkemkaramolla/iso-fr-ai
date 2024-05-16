// 'use client';
// import React, { useState } from 'react';
// import { ResizableBox } from 'react-resizable';

// const VideoStream = () => {
//   const [quality, setQuality] = useState('Low');
//   const videoStreamUrl = `http://localhost:5002/?quality=${quality}`; // URL where your Flask app is serving the video stream

//   const handleQualityChange = (event: any) => {
//     setQuality(event.target.value);
//   };

//   return (
//     <div className='container mx-auto max-h-[40vh] '>
//       <select
//         defaultValue={quality}
//         className='select max-w-xs'
//         onChange={handleQualityChange}
//       >
//         <option value={'Quality'} disabled selected>
//           Video Kalitesi
//         </option>
//         <option value={'Max'}>Max</option>
//         <option value='High'>High</option>
//         <option value={'Medium'}>Medium</option>
//         <option value={'Low'}>Low</option>
//       </select>
//       <img className='w-full h-full' src={videoStreamUrl} alt='Video Stream' />
//     </div>
//   );
// };

// export default VideoStream;
// 'use client';
// import React, { useState } from 'react';
// // import { Button } from 'primereact/button';
// enum Cameras {
//   CAM1 = 'http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality',
//   CAM2 = 'http://localhost:5555',
// }

// const VideoStream = () => {
//   const [quality1, setQuality1] = useState('Quality');
//   const [quality2, setQuality2] = useState('Quality');
//   const [selectedCamera1, setSelectedCamera1] = useState(Cameras.CAM1);
//   const [selectedCamera2, setSelectedCamera2] = useState(Cameras.CAM2);
//   const [isPlaying1, setIsPlaying1] = useState(true);
//   const [isPlaying2, setIsPlaying2] = useState(true);

//   const handleCameraChange1 = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCamera1(event.target.value as Cameras);
//   };

//   const handleCameraChange2 = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCamera2(event.target.value as Cameras);
//   };

//   const response1 = `http://localhost:5002/stream1?camera=${selectedCamera1}`;
//   const response2 = `http://localhost:5002/stream2?camera=${selectedCamera2}`;

//   const handleQualityChange1 = (
//     event: React.ChangeEvent<HTMLSelectElement>
//   ) => {
//     setQuality1(event.target.value);
//   };

//   const handleQualityChange2 = (
//     event: React.ChangeEvent<HTMLSelectElement>
//   ) => {
//     setQuality2(event.target.value);
//   };
//   const togglePlay1 = () => {
//     setIsPlaying1(!isPlaying1);
//   };

//   const togglePlay2 = () => {
//     setIsPlaying2(!isPlaying2);
//   };

//   return (
//     <div className='container mx-auto max-h-[40vh]'>
//       <button className='button size-10 text-4xl'>+</button>
//       <div className='flex flex-row justify-center items-start gap-4'>
//         <div className='w-1/2'>
//           <select
//             value={quality1}
//             className='select max-w-xs'
//             onChange={handleQualityChange1}
//           >
//             <option value='MJPEG'>Motion JPEG</option>
//             <option value='H264'>H.264</option>
//             <option value='Quality'>Quality</option>
//             <option value='Balanced'>Balanced</option>
//             <option value='Bandwidth'>Bandwidth</option>
//             <option value='Mobile'>Mobile</option>
//             <option value='Max'>Max</option>
//             <option value='High'>High</option>
//             <option value='Low'>Low</option>
//             <option value='Medium'>Medium</option>
//           </select>
//           <select
//             className='select max-w-xs'
//             value={selectedCamera1}
//             onChange={handleCameraChange1}
//           >
//             {Object.entries(Cameras).map(([key, value]) => (
//               <option key={key} value={value}>
//                 {key}
//               </option>
//             ))}
//           </select>
//           <button onClick={togglePlay1}>{isPlaying1 ? 'Stop' : 'Start'}</button>
//           {isPlaying1 && (
//             <img
//               className='w-full h-full'
//               src={response1}
//               alt='Video Stream 1'
//             />
//           )}
//         </div>
//         <div className='w-1/2'>
//           <select
//             value={quality2}
//             className='select max-w-xs'
//             onChange={handleQualityChange2}
//           >
//             <option value='MJPEG'>Motion JPEG</option>
//             <option value='H264'>H.264</option>
//             <option value='Quality'>Quality</option>
//             <option value='Balanced'>Balanced</option>
//             <option value='Bandwidth'>Bandwidth</option>
//             <option value='Mobile'>Mobile</option>
//             <option value='Max'>Max</option>
//             <option value='High'>High</option>
//             <option value='Low'>Low</option>
//             <option value='Medium'>Medium</option>
//           </select>
//           <select
//             className='select max-w-xs'
//             value={selectedCamera2}
//             onChange={handleCameraChange2}
//           >
//             {Object.entries(Cameras).map(([key, value]) => (
//               <option key={key} value={value}>
//                 {key}
//               </option>
//             ))}
//           </select>
//           <button onClick={togglePlay2}>{isPlaying2 ? 'Stop' : 'Start'}</button>
//           {isPlaying2 && (
//             <img
//               className='w-full h-full'
//               src={response2}
//               alt='Video Stream 2'
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoStream;
'use client';
import React, { useState } from 'react';
enum Cameras {
  CAM1 = 'http://root:N143g144@192.168.100.152/mjpg/video.mjpg?streamprofile=Quality',
  CAM2 = 'http://localhost:5555',
}
const VideoStream = () => {
  const [quality1, setQuality1] = useState('Quality');
  const [quality2, setQuality2] = useState('Quality');
  const [selectedCamera1, setSelectedCamera1] = useState(Cameras.CAM1);
  const [selectedCamera2, setSelectedCamera2] = useState(Cameras.CAM2);
  const [isPlaying1, setIsPlaying1] = useState(true);
  const [isPlaying2, setIsPlaying2] = useState(true);
  const [cameraStreams, setCameraStreams] = useState([1]);

  const response1 = `${process.env.NEXT_PUBLIC_FLASK_URL}/stream1?camera=${selectedCamera1}`;
  const response2 = `${process.env.NEXT_PUBLIC_FLASK_URL}/stream2?camera=${selectedCamera2}`;

  const handleCameraChange1 = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera1(event.target.value as Cameras);
  };

  const handleCameraChange2 = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCamera2(event.target.value as Cameras);
  };

  const handleQualityChange1 = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setQuality1(event.target.value);
  };

  const handleQualityChange2 = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setQuality2(event.target.value);
  };

  const togglePlay1 = () => {
    setIsPlaying1(!isPlaying1);
  };

  const togglePlay2 = () => {
    setIsPlaying2(!isPlaying2);
  };

  const handleAddCamera = () => {
    const newCameraStreams = [...cameraStreams, cameraStreams.length + 1];
    setCameraStreams(newCameraStreams);
  };

  return (
    <div className='container mx-auto max-h-[40vh]'>
      <button className='button size-10 text-4xl' onClick={handleAddCamera}>
        +
      </button>
      <div
        className='grid grid-cols-3 justify-center items-start gap-4 mx-auto 
      overflow-y-scroll max-h-[80vh]'
      >
        {cameraStreams.map((index) => (
          <div key={index} className=''>
            <select
              value={index === 1 ? quality1 : quality2}
              className='select max-w-xs'
              onChange={
                index === 1 ? handleQualityChange1 : handleQualityChange2
              }
            >
              <option value='MJPEG'>Motion JPEG</option>
              <option value='H264'>H.264</option>
              <option value='Quality'>Quality</option>
              <option value='Balanced'>Balanced</option>
              <option value='Bandwidth'>Bandwidth</option>
              <option value='Mobile'>Mobile</option>
              <option value='Max'>Max</option>
              <option value='High'>High</option>
              <option value='Low'>Low</option>
              <option value='Medium'>Medium</option>
            </select>
            <select
              className='select max-w-xs'
              value={index === 1 ? selectedCamera1 : selectedCamera2}
              onChange={index === 1 ? handleCameraChange1 : handleCameraChange2}
            >
              {Object.entries(Cameras).map(([key, value]) => (
                <option key={key} value={value}>
                  {key}
                </option>
              ))}
            </select>
            <button onClick={index === 1 ? togglePlay1 : togglePlay2}>
              {index === 1
                ? isPlaying1
                  ? 'Stop'
                  : 'Start'
                : isPlaying2
                ? 'Stop'
                : 'Start'}
            </button>
            {index === 1 && isPlaying1 && (
              <img
                className='w-full h-full'
                src={response1}
                alt='Video Stream 1'
              />
            )}
            {index !== 1 && isPlaying2 && (
              <img
                className='w-full h-full'
                src={response2}
                alt='Video Stream 2'
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoStream;
