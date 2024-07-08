import React, { useEffect, useRef } from 'react';
import { Quality } from '@/utils/enums';
import Image from 'next/image';
import io, { Socket } from 'socket.io-client';
interface CameraStreamProps {
  id: number;
  streamSrc?: string;
  selectedCamera: Camera | undefined;
  selectedQuality: keyof typeof Quality;
  isPlaying: boolean;
  isLoading: boolean;
  isLocalCamera?: boolean; // Add this prop
  cameraStreams: CameraStream[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
}

const CameraStream: React.FC<CameraStreamProps> = ({
  id,
  streamSrc,
  isPlaying,
  setCameraStreams,
  isLocalCamera,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedVideoRef = useRef<HTMLImageElement>(null);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    if (isLocalCamera) {
      socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
      socket.current.on('processed_frame', (data: string) => {
        if (processedVideoRef.current) {
          processedVideoRef.current.src = data;
        }
      });

     const getCameraStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          sendVideoFrames();
        } catch (error) {
          console.error('Error accessing camera:', error);
        }
      }

      const sendVideoFrames = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        const video = videoRef.current;

        if (!context || !video || !canvas) return;

        setInterval(() => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg');
          socket.current?.emit('video_frame', frame);
        }, 100);
      }

      getCameraStream();

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [isLocalCamera]);

  return (
    <div>
      {isPlaying && (
        <img
          ref={isLocalCamera ? processedVideoRef : undefined}
          className='h-fit rounded-b-lg aspect-video'
          src={streamSrc=='' ? undefined :  streamSrc}
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
      {isLocalCamera && (
        <>
          <video ref={videoRef} width="640" height="480" autoPlay style={{ display: 'none' }} />
          <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </>
      )}
    </div>
  );
};

export default CameraStream;


// import React, { useEffect } from 'react';
// import { Quality } from '@/utils/enums';
// import Image from 'next/image';

// interface CameraStreamProps {
//   id: number;
//   streamSrc?: string;
//   selectedCamera: Camera | undefined;
//   selectedQuality: keyof typeof Quality;
//   isPlaying: boolean;
//   isLoading: boolean;

//   cameraStreams: CameraStream[];
//   setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
//   // onLoad: () => void;
// }

// const CameraStream: React.FC<CameraStreamProps> = ({
//   id,
//   streamSrc,
//   isPlaying,
//   setCameraStreams,
//   // onLoad,
// }) => {
//   return (
//     <div>
//       {isPlaying && (
//         <Image
//           className='h-fit rounded-b-lg aspect-video'
//           src={streamSrc || ''}
//           alt={`Video Stream ${id}`}
//           width={1920}
//           height={1080}
//           objectFit='cover'
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
//     </div>
//   );
// };

// export default CameraStream;
