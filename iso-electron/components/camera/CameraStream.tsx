import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { Toast } from 'primereact/toast'; // Import PrimeReact Toast
import { Quality } from '@/utils/enums';
import { Camera } from '@/types';
import { CameraStream as CameraStreamType } from '@/types';
import Loading from '@/components/ui/Loading';

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
  selectedCamera,
  isPlaying,
  isLoading,
  setCameraStreams,
  isLocalCamera,
  isRecording,
  selectedQuality,
  isClose,
  toast,
  localCameraId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processedVideoRef = useRef<HTMLImageElement>(null);
  const socket = useRef<Socket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null); // Reference for the frame sending interval
  const [imageSrc, setImageSrc] = useState('');
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

          // let resolution;
          // let compression;
          // switch (selectedQuality) {
          //   case 'Quality':
          //     resolution = { width: 1920, height: 1080 };
          //     compression = 0.9;
          //     break;
          //   case 'Balanced':
          //     resolution = { width: 1280, height: 720 };
          //     compression = 0.5;
          //     break;
          //   case 'Bandwidth':
          //     resolution = { width: 1280, height: 720 };
          //     compression = 0.25;
          //     break;
          //   case 'Mobile':
          //     resolution = { width: 800, height: 450 };
          //     compression = 0.25;
          //     break;
          //   default:
          //     resolution = { width: 1280, height: 720 };
          //     compression = 0.5;
          // }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: selectedDeviceId
                ? { exact: selectedDeviceId }
                : undefined,
              // width: resolution.width,
              // height: resolution.height,
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          sendVideoFrames();
          // sendVideoFrames(compression);
        } catch (error) {
          console.error('Error accessing camera:', error);
        }
      };

      const sendVideoFrames = (compression?: number) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        const video = videoRef.current;

        if (!context || !video || !canvas) return;

        frameIntervalRef.current = setInterval(() => {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg', compression);
          socket.current?.emit('video_frames', {
            room: `camera-${id}`,
            streamId: id,
            frames: [frame],
            cameraName: selectedCamera?.label,
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
  }, [isLocalCamera, isRecording, isClose, selectedQuality]);

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

  useEffect(() => {
    if (isPlaying) {
      // Force a new image by appending a timestamp
      setImageSrc(`${streamSrc}?t=${new Date().getTime()}`);
    }
  }, [isPlaying, streamSrc]);

  console.log(imageSrc);
  return (
    <div>
      {isLoading && (
        <div className='inset-0 flex items-center justify-center'>
          <Loading />
        </div>
      )}
      {isPlaying ? (
        <img
          ref={isLocalCamera ? processedVideoRef : undefined}
          className={`h-fit rounded-b-lg aspect-video ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          src={imageSrc}
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
      ) : (
        <div className='h-fit flex items-center justify-center rounded-b-lg aspect-video '>
          <span className='text-xl'>Yayın Durdu</span>
        </div>
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
