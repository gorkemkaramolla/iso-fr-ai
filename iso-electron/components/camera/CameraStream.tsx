import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Toast } from 'primereact/toast'; // Import PrimeReact Toast
import { Quality } from '@/utils/enums';
import { Camera } from '@/types';
import { CameraStream as CameraStreamType } from '@/types';

interface CameraStreamProps {
  id: number;
  streamSrc?: string;
  selectedCamera: Camera | undefined;
  selectedQuality: keyof typeof Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isLocalCamera?: boolean;
  isRecording?: boolean;
  isClose?: boolean;
  cameraStreams: CameraStreamType[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStreamType[]>>;
  toast: React.RefObject<Toast>; // Add this prop
  localCameraId?: number;
}

const CameraStream: React.FC<CameraStreamProps> = ({
  id,
  streamSrc,
  isPlaying,
  setCameraStreams,
  isLocalCamera,
  isRecording,
  isClose,
  toast,
  localCameraId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedVideoRef = useRef<HTMLImageElement>(null);
  const socket = useRef<Socket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for the frame sending interval

  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalCamera && !isClose) {
      socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);

      socket.current.emit('join', { room: `camera-${id}` });
      socket.current.on('joined', (data) => {
        console.log(`Joined room: ${data.room}`);
      });

      socket.current.on('processed_frames', (data: { frames: string[] }) => {
        if (processedVideoRef.current) {
          processedVideoRef.current.src = data.frames[0]; // Handle multiple frames if needed
        }
      });

      const getCameraStream = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === 'videoinput'
          );
          console.log(videoDevices); // Debug: Log the available video devices

          // Set the deviceId of the external webcam if available
          const externalCamera = videoDevices.find((device) =>
            device.label.toLowerCase().includes('external')
          );
          const selectedDeviceId = externalCamera
            ? externalCamera.deviceId
            : videoDevices[localCameraId || 0].deviceId;
          setDeviceId(selectedDeviceId);

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: selectedDeviceId
                ? { exact: selectedDeviceId }
                : undefined,
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          sendVideoFrames();
        } catch (error) {
          console.error('Error accessing camera:', error);
        }
      };

      const sendVideoFrames = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        const video = videoRef.current;

        if (!context || !video || !canvas) return;

        frameIntervalRef.current = setInterval(() => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg');
          socket.current?.emit('video_frames', {
            room: `camera-${id}`,
            frames: [frame],
            isRecording,
          });
        }, 100);
      };

      getCameraStream();
    }

    // Cleanup function when component unmounts or isClose becomes true
    return () => {
      if (isClose && socket.current) {
        socket.current.emit('leave', { room: `camera-${id}` });
        socket.current.disconnect();
        socket.current = null;
        // Show success toast
        toast.current?.show({
          severity: 'warn',
          summary: 'Success',
          detail: 'Camera stream stopped successfully',
          life: 3000,
        });
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isLocalCamera, isRecording, isClose]);

  useEffect(() => {
    if (isClose && isLocalCamera) {
      // Cleanup the interval for sending frames
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }

      // Disconnect the socket connection
      if (socket.current) {
        socket.current.emit('leave', { room: `camera-${id}` });
        socket.current.disconnect();
        socket.current = null;

        // Show success toast
        toast.current?.show({
          severity: 'warn',
          summary: 'Success',
          detail: 'Camera stream stopped successfully',
          life: 3000,
        });
      }
    }
  }, [isClose, isLocalCamera, id, isPlaying]);

  return (
    <div>
      {isPlaying && (
        <img
          ref={isLocalCamera ? processedVideoRef : undefined}
          className='h-fit rounded-b-lg aspect-video'
          src={streamSrc === '' ? undefined : streamSrc}
          alt={`Video Stream ${id}`}
          width={1920}
          height={1080}
          onLoad={() => {
            setCameraStreams((prevStreams) =>
              prevStreams.map((stream) =>
                stream.id === id ? { ...stream, isLoading: false } : stream
              )
            );
          }}
          onError={() => {
            console.log('Error loading stream');
            setCameraStreams((prevStreams) =>
              prevStreams.map((stream) =>
                stream.id === id ? { ...stream, isLoading: true } : stream
              )
            );
          }}
        />
      )}
      {isLocalCamera && !isClose && (
        <>
          <video
            ref={videoRef}
            width='1920'
            height='1080'
            autoPlay
            style={{ display: 'none' }}
          />
          <canvas
            ref={canvasRef}
            width='1920'
            height='1080'
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default CameraStream;

// import React, { useEffect, useRef, useState } from 'react';
// import io, { Socket } from 'socket.io-client';
// import { Toast } from 'primereact/toast'; // Import PrimeReact Toast
// import { Quality } from '@/utils/enums';

// interface CameraStreamProps {
//   id: number;
//   streamSrc?: string;
//   selectedCamera: Camera | undefined;
//   selectedQuality: keyof typeof Quality;
//   isPlaying: boolean;
//   isLoading: boolean;
//   isLocalCamera?: boolean;
//   isRecording?: boolean;
//   isClose?: boolean;
//   cameraStreams: CameraStream[];
//   setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
//   toast: React.RefObject<Toast>; // Add this prop
//   localCameraId?: number;
// }

// const CameraStream: React.FC<CameraStreamProps> = ({
//   id,
//   streamSrc,
//   isPlaying,
//   setCameraStreams,
//   isLocalCamera,
//   isRecording,
//   isClose,
//   toast,
//   localCameraId,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const processedVideoRef = useRef<HTMLImageElement>(null);
//   const socket = useRef<Socket | null>(null);
//   const frameIntervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for the frame sending interval
//   const [deviceId, setDeviceId] = useState<string | null>(null);
//   console.log(streamSrc);

//   useEffect(() => {
//     if (isLocalCamera && !isClose) {
//       socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
//       socket.current.on('processed_frame', (data: string) => {
//         if (processedVideoRef.current) {
//           processedVideoRef.current.src = data;
//         }
//       });

//       const getCameraStream = async () => {
//         try {
//           const devices = await navigator.mediaDevices.enumerateDevices();
//           const videoDevices = devices.filter(
//             (device) => device.kind === 'videoinput'
//           );
//           console.log(videoDevices); // Debug: Log the available video devices

//           // Set the deviceId of the external webcam if available
//           const externalCamera = videoDevices.find((device) =>
//             device.label.toLowerCase().includes('external')
//           );
//           const selectedDeviceId = externalCamera
//             ? externalCamera.deviceId
//             : videoDevices[localCameraId || 0].deviceId;
//           setDeviceId(selectedDeviceId);

//           const stream = await navigator.mediaDevices.getUserMedia({
//             video: {
//               deviceId: selectedDeviceId
//                 ? { exact: selectedDeviceId }
//                 : undefined,
//             },
//           });

//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//           }
//           sendVideoFrames();
//         } catch (error) {
//           console.error('Error accessing camera:', error);
//         }
//       };

//       const sendVideoFrames = () => {
//         const canvas = canvasRef.current;
//         const context = canvas?.getContext('2d');
//         const video = videoRef.current;

//         if (!context || !video || !canvas) return;

//         frameIntervalRef.current = setInterval(() => {
//           context.drawImage(video, 0, 0, canvas.width, canvas.height);
//           const frame = canvas.toDataURL('image/jpeg');
//           socket.current?.emit('video_frame', { frame, isRecording });
//         }, 100);
//       };

//       getCameraStream();
//     }

//     // Cleanup function when component unmounts or isClose becomes true
//     return () => {
//       if (isClose && socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//         // Show success toast
//         toast.current?.show({
//           severity: 'warn',
//           summary: 'Success',
//           detail: 'Camera stream stopped successfully',
//           life: 3000,
//         });
//       }
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }
//     };
//   }, [isLocalCamera, isRecording, isClose]);

//   useEffect(() => {
//     if (isClose && isLocalCamera) {
//       // Cleanup the interval for sending frames
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }

//       // Disconnect the socket connection
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;

//         // Show success toast
//         toast.current?.show({
//           severity: 'warn',
//           summary: 'Success',
//           detail: 'Camera stream stopped successfully',
//           life: 3000,
//         });
//       }
//     }
//   }, [isClose, isLocalCamera, id, isPlaying]);

//   return (
//     <div>
//       {isPlaying && (
//         <img
//           ref={isLocalCamera ? processedVideoRef : undefined}
//           className='h-fit rounded-b-lg aspect-video'
//           src={streamSrc === '' ? undefined : streamSrc}
//           alt={`Video Stream ${id}`}
//           width={1920}
//           height={1080}
//           onLoad={() => {
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: false } : stream
//               )
//             );
//           }}
//           onError={() => {
//             console.log('Error loading stream');
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: true } : stream
//               )
//             );
//           }}
//         />
//       )}
//       {isLocalCamera && !isClose && (
//         <>
//           <video
//             ref={videoRef}
//             width='1920'
//             height='1080'
//             autoPlay
//             style={{ display: 'none' }}
//           />
//           <canvas
//             ref={canvasRef}
//             width='1920'
//             height='1080'
//             style={{ display: 'none' }}
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default CameraStream;

// import React, { useEffect, useRef } from 'react';
// import io, { Socket } from 'socket.io-client';
// import { Toast } from 'primereact/toast'; // Import PrimeReact Toast
// import { Quality } from '@/utils/enums';

// interface CameraStreamProps {
//   id: number;
//   streamSrc?: string;
//   selectedCamera: Camera | undefined;
//   selectedQuality: keyof typeof Quality;
//   isPlaying: boolean;
//   isLoading: boolean;
//   isLocalCamera?: boolean;
//   isRecording?: boolean;
//   isClose?: boolean;
//   cameraStreams: CameraStream[];
//   setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
//   toast: React.RefObject<Toast>; // Add this prop
// }

// const CameraStream: React.FC<CameraStreamProps> = ({
//   id,
//   streamSrc,
//   isPlaying,
//   setCameraStreams,
//   isLocalCamera,
//   isRecording,
//   isClose,
//   toast,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const processedVideoRef = useRef<HTMLImageElement>(null);
//   const socket = useRef<Socket | null>(null);
//   const frameIntervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for the frame sending interval

//   useEffect(() => {
//     if (isLocalCamera && !isClose) {
//       socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
//       socket.current.on('processed_frame', (data: string) => {
//         if (processedVideoRef.current) {
//           processedVideoRef.current.src = data;
//         }
//       });

//       const getCameraStream = async () => {
//         try {
//           const stream = await navigator.mediaDevices.getUserMedia({
//             video: true,
//           });
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//           }
//           sendVideoFrames();
//         } catch (error) {
//           console.error('Error accessing camera:', error);
//         }
//       };

//       const sendVideoFrames = () => {
//         const canvas = canvasRef.current;
//         const context = canvas?.getContext('2d');
//         const video = videoRef.current;

//         if (!context || !video || !canvas) return;

//         frameIntervalRef.current = setInterval(() => {
//           context.drawImage(video, 0, 0, canvas.width, canvas.height);
//           const frame = canvas.toDataURL('image/jpeg');
//           socket.current?.emit('video_frame', { frame, isRecording });
//         }, 100);
//       };

//       getCameraStream();
//     }

//     // Cleanup function when component unmounts or isClose becomes true
//     return () => {
//       if (isClose && socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//         // Show success toast
//         toast.current?.show({
//           severity: 'warn',
//           summary: 'Success',
//           detail: 'Camera stream stopped successfully',
//           life: 3000,
//         });
//       }
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }
//     };
//   }, [isLocalCamera, isRecording, isClose]);

//   useEffect(() => {
//     if (isClose && isLocalCamera) {
//       // Cleanup the interval for sending frames
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }

//       // Disconnect the socket connection
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;

//         // Show success toast
//         toast.current?.show({
//           severity: 'warn',
//           summary: 'Success',
//           detail: 'Camera stream stopped successfully',
//           life: 3000,
//         });
//       }
//     }
//   }, [isClose, isLocalCamera, id, isPlaying]);
//   // useEffect(() => {
//   //   const intervalId = setInterval(() => {
//   //     console.log("StreamSRC: " + streamSrc);
//   //   }, 1000);

//   //   // Cleanup interval on component unmount
//   //   return () => clearInterval(intervalId);
//   // }, [streamSrc]);

//   return (
//     <div>
//       {isPlaying && (
//         <img
//           ref={isLocalCamera ? processedVideoRef : undefined}
//           className='h-fit rounded-b-lg aspect-video'
//           src={streamSrc === '' ? undefined : streamSrc}
//           alt={`Video Stream ${id}`}
//           width={1920}
//           height={1080}
//           onLoad={() => {
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: false } : stream
//               )
//             );
//           }}
//           onError={() => {
//             console.log('Error loading stream');
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: true } : stream
//               )
//             );
//           }}
//         />
//       )}
//       {isLocalCamera && !isClose && (
//         <>
//           <video
//             ref={videoRef}
//             width='1920'
//             height='1080'
//             autoPlay
//             style={{ display: 'none' }}
//           />
//           <canvas
//             ref={canvasRef}
//             width='1920'
//             height='1080'
//             style={{ display: 'none' }}
//           />
//         </>
//       )}
//     </div>
//   );
// };

// export default CameraStream;

// import React, { useEffect, useRef } from 'react';
// import io, { Socket } from 'socket.io-client';
// import { Quality } from '@/utils/enums';

// interface CameraStreamProps {
//   id: number;
//   streamSrc?: string;
//   selectedCamera: Camera | undefined;
//   selectedQuality: keyof typeof Quality;
//   isPlaying: boolean;
//   isLoading: boolean;
//   isLocalCamera?: boolean;
//   isRecording?: boolean;
//   isClose?: boolean; // Add this prop
//   cameraStreams: CameraStream[];
//   setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
// }

// const CameraStream: React.FC<CameraStreamProps> = ({
//   id,
//   streamSrc,
//   isPlaying,
//   setCameraStreams,
//   isLocalCamera,
//   isRecording,
//   isClose,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const processedVideoRef = useRef<HTMLImageElement>(null);
//   const socket = useRef<Socket | null>(null);
//   const frameIntervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for the frame sending interval

//   useEffect(() => {
//     if (isLocalCamera && !isClose) {
//       socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
//       socket.current.on('processed_frame', (data: string) => {
//         if (processedVideoRef.current) {
//           processedVideoRef.current.src = data;
//         }
//       });

//       const getCameraStream = async () => {
//         try {
//           const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//           }
//           sendVideoFrames();
//         } catch (error) {
//           console.error('Error accessing camera:', error);
//         }
//       };

//       const sendVideoFrames = () => {
//         const canvas = canvasRef.current;
//         const context = canvas?.getContext('2d');
//         const video = videoRef.current;

//         if (!context || !video || !canvas) return;

//         frameIntervalRef.current = setInterval(() => {
//           context.drawImage(video, 0, 0, canvas.width, canvas.height);
//           const frame = canvas.toDataURL('image/jpeg');
//           socket.current?.emit('video_frame', { frame, isRecording });
//         }, 100);
//       };

//       getCameraStream();
//     }

//     // Cleanup function when component unmounts or isClose becomes true
//     return () => {
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//       }
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }
//     };
//   }, [isLocalCamera, isRecording, isClose]);

//   useEffect(() => {
//     if (isClose && isLocalCamera) {
//       // Cleanup the interval for sending frames
//       if (frameIntervalRef.current) {
//         clearInterval(frameIntervalRef.current);
//         frameIntervalRef.current = null;
//       }

//       // Disconnect the socket connection
//       if (socket.current) {
//         socket.current.disconnect();
//         socket.current = null;
//       }

//       setCameraStreams((prevStreams) =>
//         prevStreams.map((stream) =>
//           stream.id === id ? { ...stream, isPlaying: false } : stream
//         )
//       );
//     }
//   }, [isClose, isLocalCamera, id, setCameraStreams]);

//   return (
//     <div>
//       {isPlaying && (
//         <img
//           ref={isLocalCamera ? processedVideoRef : undefined}
//           className='h-fit rounded-b-lg aspect-video'
//           src={streamSrc === '' ? undefined : streamSrc}
//           alt={`Video Stream ${id}`}
//           width={1920}
//           height={1080}
//           onLoad={() => {
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: false } : stream
//               )
//             );
//           }}
//           onError={() => {
//             console.log('Error loading stream');
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: true } : stream
//               )
//             );
//           }}
//         />
//       )}
//       {isLocalCamera && !isClose && (
//         <>
//           <video ref={videoRef} width="1920" height="1080" autoPlay controls style={{ display: 'none' }} />
//           <canvas ref={canvasRef} width="1920" height="1080" style={{ display: 'none' }} />
//         </>
//       )}
//     </div>
//   );
// };

// export default CameraStream;

// import React, { useEffect, useRef } from 'react';
// import io, { Socket } from 'socket.io-client';
// import { Quality } from '@/utils/enums';

// interface CameraStreamProps {
//   id: number;
//   streamSrc?: string;
//   selectedCamera: Camera | undefined;
//   selectedQuality: keyof typeof Quality;
//   isPlaying: boolean;
//   isLoading: boolean;
//   isLocalCamera?: boolean; // Add this prop
//   isRecording?: boolean;
//   cameraStreams: CameraStream[];
//   setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
// }

// const CameraStream: React.FC<CameraStreamProps> = ({
//   id,
//   streamSrc,
//   isPlaying,
//   setCameraStreams,
//   isLocalCamera,
//   isRecording,
// }) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const processedVideoRef = useRef<HTMLImageElement>(null);
//   const socket = useRef<Socket | null>(null);

//   useEffect(() => {
//     if (isLocalCamera) {
//       socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
//       socket.current.on('processed_frame', (data: string) => {
//         if (processedVideoRef.current) {
//           processedVideoRef.current.src = data;
//         }
//       });

//       const getCameraStream = async () => {
//         try {
//           const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream;
//           }
//           sendVideoFrames();
//         } catch (error) {
//           console.error('Error accessing camera:', error);
//         }
//       };

//       const sendVideoFrames = () => {
//         const canvas = canvasRef.current;
//         const context = canvas?.getContext('2d');
//         const video = videoRef.current;

//         if (!context || !video || !canvas) return;

//         setInterval(() => {
//           context.drawImage(video, 0, 0, canvas.width, canvas.height);
//           const frame = canvas.toDataURL('image/jpeg');
//           socket.current?.emit('video_frame', { frame, isRecording });
//         }, 100);
//       };

//       getCameraStream();

//       return () => {
//         if (socket.current) {
//           socket.current.disconnect();
//         }
//       };
//     }
//   }, [isLocalCamera, isRecording]);

//   return (
//     <div>
//       {isPlaying && (
//         <img
//           ref={isLocalCamera ? processedVideoRef : undefined}
//           className='h-fit rounded-b-lg aspect-video'
//           src={streamSrc === '' ? undefined : streamSrc}
//           alt={`Video Stream ${id}`}
//           width={1920}
//           height={1080}
//           onLoad={() => {
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: false } : stream
//               )
//             );
//           }}
//           onError={() => {
//             console.log('Error loading stream');
//             setCameraStreams((prevStreams) =>
//               prevStreams.map((stream) =>
//                 stream.id === id ? { ...stream, isLoading: true } : stream
//               )
//             );
//           }}
//         />
//       )}
//       {isLocalCamera && (
//         <>
//           <video ref={videoRef} width="640" height="480" autoPlay style={{ display: 'none' }} />
//           <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
//         </>
//       )}
//     </div>
//   );
// };

// export default CameraStream;
