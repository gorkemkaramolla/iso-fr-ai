'use client';
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
interface FaceData {
  label: string;
  similarity: number;
  emotion: string;
  emotion_probability: number;
  bounding_box: number[];
}

interface StreamedData {
  image: string; // Base64 encoded image
  faces: FaceData[];
}
interface VideoFrameCaptureProps {
  video: HTMLVideoElement;
  width: number;
  height: number;
}
const socket = io('https://10.15.95.233:5000', {
  extraHeaders: {
    'my-custom-header': 'abcd',
  },
  transports: ['websocket'],
});
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
  return canvas.toDataURL('image/jpeg', 0.7); // Adjust quality as needed
};

const WebcamStreamCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamedImage, setStreamedImage] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<FaceData[]>([]);

  useEffect(() => {
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

        const intervalId = setInterval(sendFrame, 500);
        return () => clearInterval(intervalId);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    socket.on('isoai', (data: StreamedData) => {
      setStreamedImage(data.image);
      setFaceData(data.faces);
    });

    return () => {
      socket.off('isoai');
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <video
        hidden
        ref={videoRef}
        width={720}
        height={480}
        autoPlay
        playsInline
      />

      {streamedImage && (
        <img
          src={`data:image/jpeg;base64,${streamedImage}`}
          alt='Processed'
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '720px',
            height: '480px',
          }}
        />
      )}

      {faceData.length > 0 && (
        <DataTable
          value={faceData}
          style={{ position: 'absolute', top: '480px', width: '100%' }}
        >
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
