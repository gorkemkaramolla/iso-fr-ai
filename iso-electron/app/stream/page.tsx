'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { io } from 'socket.io-client';
import AddCameraButton from '@/components/camera/AddCameraButton';
import CameraDropdown from '@/components/camera/CameraDropdown';
import RecogFaces from '@/components/camera/RecogFace';
import CameraStreamControl from '@/components/camera/CameraStreamControl';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import { Quality } from '@/utils/enums';
import StreamUtilButtons from '@/components/camera/StreamUtilButtons';
import { Camera, CameraStream } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
const socket = io(BASE_URL!);

const VideoStream: React.FC = () => {
  const toast = useRef<Toast>(null);


  const [cameraUrls, setCameraUrls] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera>();
  const [availableIds, setAvailableIds] = useState([1, 2, 3, 4]);
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isGrid, setIsGrid] = useState(false);

  // Load camera streams from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStreams = localStorage.getItem('cameraStreams');
      if (savedStreams) {
        const parsedStreams = JSON.parse(savedStreams);
        setCameraStreams(parsedStreams);

        // Update availableIds to remove ids that are already used
        setAvailableIds((prevAvailableIds) => {
          return prevAvailableIds.filter(
            (id) =>
              !parsedStreams.some((stream: CameraStream) => stream.id === id)
          );
        });
        setIsModified(true); // Reset the isModified state
      }
    }
  }, []);

  // Fetch camera URLs
  useEffect(() => {
    const fetchCameraUrls = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_FLASK_URL + '/camera-urls'
        );
        const data = await response.json();
        setCameraUrls(data);
      } catch (error) {
        console.error('Error fetching camera URLs:', error);
      }
    };
    fetchCameraUrls();
  }, []);

  // Socket listener for new cameras
  useEffect(() => {
    socket.on('new_camera', (newCamera) => {
      setCameraUrls((prevCameraUrls) => [...prevCameraUrls, newCamera]);
    });

    return () => {
      socket.off('new_camera');
    };
  }, []);

  // Load `isGrid` from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIsGrid = localStorage.getItem('isGrid');
      if (storedIsGrid) {
        setIsGrid(JSON.parse(storedIsGrid));
      }
    }
  }, []);

  // Update localStorage when `isGrid` changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isGrid', JSON.stringify(isGrid));
    }
  }, [isGrid]);

  // Add new camera stream
  const addCameraStream = (camera: Camera) => {
    if (availableIds.length > 0) {
      const newId = availableIds[0]; // Take the smallest available ID
      setAvailableIds(availableIds.slice(1)); // Remove the new ID from the available IDs
      const isLocalCamera = !isNaN(Number(camera.url)); // Check if the URL can be converted to a number
      const newCameraStream = {
        id: newId,
        selectedCamera: camera,
        streamSrc: isLocalCamera
          ? ''
          : `${BASE_URL}/stream/${newId}?camera=${encodeURIComponent(
              selectedCamera?.url || ''
            )}&streamProfile=${encodeURIComponent(
              Object.keys(Quality)[0]
            )}&is_recording=${encodeURIComponent(false)}`,

        selectedQuality: Object.keys(Quality)[0],
        isPlaying: true,
        isLoading: true,
        isRecording: false,
        isClose: false,
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
        isLocalCamera: isLocalCamera, // Add a flag for local camera
        localCameraId: isLocalCamera ? Number(camera.url) : undefined,
      };

      setCameraStreams([...cameraStreams, newCameraStream]);
      if (typeof window !== 'undefined') {
        // Retrieve the existing list of cameraStreams from localStorage
        const savedStreams = localStorage.getItem('cameraStreams');
        let cameraStreamsList = savedStreams ? JSON.parse(savedStreams) : [];

        // Append the new cameraStream to the list
        cameraStreamsList.push(newCameraStream);

        // Save the updated list back to localStorage
        localStorage.setItem(
          'cameraStreams',
          JSON.stringify(cameraStreamsList)
        );
      }
      setSelectedCamera(undefined);
    }
  };

  // Save camera stream position
  const saveCameraStreamPosition = (
    id: number,
    position: { x: number; y: number }
  ) => {
    setIsModified(true); // Set isModified to true when a stream is dragged
    // Update the cameraStreams state
    setCameraStreams((prevStreams) => {
      const updatedStreams = prevStreams.map((camera) =>
        camera.id === id ? { ...camera, position } : camera
      );

      if (typeof window !== 'undefined') {
        // Save the updated streams to localStorage
        localStorage.setItem('cameraStreams', JSON.stringify(updatedStreams));
      }

      return updatedStreams;
    });
  };

  // Save camera stream size
  const saveCameraStreamSize = (
    id: number,
    size: { width: string | number; height: string | number }
  ) => {
    setIsModified(true); // Set isModified to true when a stream is resized
    // Update the cameraStreams state
    setCameraStreams((prevStreams) => {
      const updatedStreams = prevStreams.map((camera) =>
        camera.id === id ? { ...camera, size } : camera
      );

      if (typeof window !== 'undefined') {
        // Save the updated streams to localStorage
        localStorage.setItem('cameraStreams', JSON.stringify(updatedStreams));
      }

      return updatedStreams;
    });
  };

  // Delete all camera streams
  const deleteAllCameraStreams = () => {
    const confirmed = window.confirm(
      'Tüm yayınları kapatmak istediğinizden emin misiniz?'
    );
    if (confirmed) {
      if (typeof window !== 'undefined') {
        // Clear local storage
        localStorage.removeItem('cameraStreams');
      }
      // Clear the state
      setCameraStreams([]);
      setAvailableIds([1, 2, 3, 4]);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Tüm yayınlar kapatıldı!',
        life: 2000,
      });
      setIsModified(false); // Reset the isModified state
    }
  };

  // Reset camera streams to default positions and sizes
  const resetCameraStreams = () => {
    // Get the current cameraStreams state
    setCameraStreams((currentStreams) => {
      // Map through the camera streams and reset the position and size properties
      const resetStreams = currentStreams.map((stream) => ({
        ...stream,
        position: { x: 0, y: 0 }, // Set the default position
        size: { width: '100%', height: '100%' }, // Set the default size
      }));

      if (typeof window !== 'undefined') {
        // Update local storage
        localStorage.setItem('cameraStreams', JSON.stringify(resetStreams));
      }

      // Return the updated streams
      return resetStreams;
    });
    setIsModified(false); // Reset the isModified state
  };

  return (
    <div className='min-h-screen w-full overflow-scroll mt-8'>
      <Toast ref={toast} />

      <div className='mx-auto px-10 mb-20'>
   
        <div
          className={`flex flex-col-reverse xl:flex-row gap-4 flex-wrap-reverse xl:flex-nowrap`}
          // style={{ flexFlow: 'row wrap' }}
        >
          <div className={`relative flex-1 w-full flex-shrink flex-grow`}>
            <div
            id='app'
              className={`grid gap-4 ${
                isGrid ? 'grid-cols-2 grid-rows-2' : ''
              }`}
            >
     
              {cameraStreams.length > 0 &&
                cameraStreams
                  .sort((a, b) => a.id - b.id)
                  .map((camera) => {
                    return (
                      <Draggable
                        key={camera.id}
                        position={camera.position || { x: 0, y: 0 }}
                        handle='.drag-handle'
                        bounds='parent'
                        onStop={(e, data) =>
                          saveCameraStreamPosition(camera.id, {
                            x: data.x,
                            y: data.y,
                          })
                        }
                        disabled={isGrid}
                      >
                        <Resizable
                          key={camera.id}
                          size={
                            camera.size || { width: '100%', height: '100%' }
                          }
                          minHeight={350}
                          minWidth={550}
                          maxWidth={'100%'}
                          maxHeight={'100%'}
                          className='bg-slate-100 rounded-lg border border-slate-400 shadow-lg'
                          onResizeStop={(e, direction, ref) =>
                            saveCameraStreamSize(camera.id, {
                              width: ref.style.width,
                              height: ref.style.height,
                            })
                          }
                          enable={
                            isGrid
                              ? {
                                  top: false,
                                  right: false,
                                  bottom: false,
                                  left: false,
                                  topRight: false,
                                  bottomRight: false,
                                  bottomLeft: false,
                                  topLeft: false,
                                }
                              : undefined
                          }
                        >
                          <CameraStreamControl
                            id={camera.id}
                            selectedCamera={camera.selectedCamera}
                            selectedQuality={camera.selectedQuality}
                            isPlaying={camera.isPlaying}
                            isLoading={camera.isLoading}
                            isRecording={camera.isRecording}
                            isClose={camera.isClose}
                            streamSrc={camera.streamSrc}
                            availableIds={availableIds}
                            setAvailableIds={setAvailableIds}
                            cameraStreams={cameraStreams}
                            setCameraStreams={setCameraStreams}
                            isLocalCamera={camera.isLocalCamera}
                            localCameraId={camera.localCameraId}
                            toast={toast}
                          />
                        </Resizable>
                      </Draggable>
                    );
                  })}
            </div>
          </div>
          <aside
            className={`xl:min-w-[400px] xl:max-w-[440px] ml-auto`}
            style={{ position: 'sticky' }}
          >
        <div className='flex items-center justify-between mx-2 mb-2'>
          <CameraDropdown
            selectedCamera={selectedCamera}
            setSelectedCamera={setSelectedCamera}
            cameraStreams={cameraStreams}
            cameraUrls={cameraUrls}
            addCameraStream={addCameraStream}
          />
          <StreamUtilButtons
            isModified={isModified}
            resetCameraStreams={resetCameraStreams}
            deleteAllCameraStreams={deleteAllCameraStreams}
            setIsGrid={setIsGrid}
            isGrid={isGrid}
            cameraStreamsLength={cameraStreams.length}
            toast={toast}
          />
        </div>
        <hr className='w-[90%] mx-auto' />
            <RecogFaces toast={toast} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
