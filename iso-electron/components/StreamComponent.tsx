'use client';
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

// If your server's URL is different, change it here

// Change the URL to your server's URL and specify CORS options
const socket = io('https://10.15.95.233:5000', {
  // withCredentials: true, // If your server requires credentials
  extraHeaders: {
    'my-custom-header': 'abcd', // If you need to pass custom headers
  },
  transports: ['websocket'], // To avoid CORS issues related to HTTP long-polling
});

interface VideoFrameCaptureProps {
  video: HTMLVideoElement;
  width: number;
  height: number;
}
interface FaceData {
  label: string;
  similarity: number;
  emotion: string;
  emotion_probability: number;
  bounding_box: number[];
}
const captureVideoFrame = ({
  video,
  width,
  height,
}: VideoFrameCaptureProps): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get canvas context');
  }
  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.25); // Adjust quality as needed
};

const WebcamStreamCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }

          const sendFrame = () => {
            if (videoRef.current) {
              const frame = captureVideoFrame({
                video: videoRef.current,
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
              });
              socket.emit('frame', frame);
            }
          };

          // Send frames every 100 ms (adjust interval as needed)
          const intervalId = setInterval(sendFrame, 100);

          return () => clearInterval(intervalId);
        })
        .catch(console.error);
    }
  }, []);

  // State to store the processed data
  const [faceData, setFaceData] = useState<FaceData[] | null>(null);

  useEffect(() => {
    // Listen for 'webrtc' events from the server
    socket.on('webrtc', (data: FaceData[]) => {
      // Update the state with the received processed data
      setFaceData(data);
    });

    // Clean up the event listener when the component unmounts
    return () => {
      socket.off('webrtc');
    };
  }, []);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This runs once on mount, and nowhere on the server
    setIsClient(true);
  }, []);
  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        className='container mx-auto p-8'
        // style={{ width: '720px' }}
        width={720}
        height={480}
        autoPlay
        playsInline
      />

      {faceData !== null &&
        typeof faceData !== 'undefined' &&
        faceData?.length > 0 && (
          <DataTable value={faceData}>
            <Column field='label' header='Label' />
            <Column field='similarity' header='Similarity' />
            <Column field='emotion' header='Emotion' />
            <Column field='emotion_probability' header='Emotion Probability' />
            <Column field='bounding_box' header='Bounding Box' />
          </DataTable>
        )}
    </div>
  );
};

export default WebcamStreamCapture;
