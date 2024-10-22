import React, { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const CameraStream: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_FLASK_URL!);
    
    async function getCameraStream() {
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

    function sendVideoFrames() {
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
  }, []);

  return (
    <>
      <video ref={videoRef} autoPlay style={{ display: 'none' }} />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
    </>
  );
};

export default CameraStream;
