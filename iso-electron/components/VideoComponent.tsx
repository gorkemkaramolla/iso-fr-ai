import React, { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Agent } from 'https';

const WEBSOCKET_URL = 'wss://10.15.95.232:5002'; // Your Flask server URL

const VideoComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('https://10.15.95.232:5002', {
      extraHeaders: {
        'my-custom-header': 'abcd',
      },
      transports: ['websocket'],
    });

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(console.error);

    if (socketRef.current) {
      socketRef.current.on('frame_response', (data) => {
        if (canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            console.log(data);

            drawFaceDetection(context, data);
          }
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg');
        if (socketRef.current) {
          socketRef.current.emit('send_frame', { image: dataURL });
        }
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px' }}>
      <video ref={videoRef} width='640' height='480' autoPlay playsInline />
      <canvas
        ref={canvasRef}
        width='640'
        height='480'
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  );
};

export default VideoComponent;

const drawFaceDetection = (context: CanvasRenderingContext2D, data: any) => {
  console.log(data);
  data.labels[0] != 'Unknown'
    ? (context.strokeStyle = 'green')
    : (context.strokeStyle = 'red');
  context.lineWidth = 2;

  data.bboxes.forEach((bbox: number[]) => {
    const [x1, y1, x2, y2, confidence] = bbox;

    context.beginPath();
    context.rect(x1, y1, x2 - x1, y2 - y1);
    context.stroke();

    data.labels[0] != 'Unknown'
      ? (context.fillStyle = 'green')
      : (context.fillStyle = 'red');
    context.font = '12px Arial';
    context.fillText(
      `${data.labels[0]}, ${confidence.toFixed(2)}`,
      x1,
      y1 - 20
    );
    console.log(data);
    context.fillText(`${data.emotions[0]}`, x1, y2 + 20);
  });
};
