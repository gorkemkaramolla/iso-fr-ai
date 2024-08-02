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
// import toast, { Toaster } from 'react-hot-toast';
import StreamUtilButtons from '@/components/camera/StreamUtilButtons';
const BASE_URL = process.env.NEXT_PUBLIC_FLASK_URL;
const socket = io(BASE_URL!);

const VideoStream: React.FC = () => {
  const toast = useRef<Toast>(null);

  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraUrls, setCameraUrls] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera>();
  const [availableIds, setAvailableIds] = useState([1, 2, 3, 4]);
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isGrid, setIsGrid] = useState(false);
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

  useEffect(() => {
    socket.on('new_camera', (newCamera) => {
      setCameraUrls((prevCameraUrls) => [...prevCameraUrls, newCamera]);
    });

    return () => {
      socket.off('new_camera');
    };
  }, []);
  // Step 3: Load `isGrid` from localStorage when the component mounts
  useEffect(() => {
    const storedIsGrid = localStorage.getItem('isGrid');
    if (storedIsGrid) {
      setIsGrid(JSON.parse(storedIsGrid));
    }
  }, []);

  // Step 4: Update localStorage when `isGrid` changes
  useEffect(() => {
    localStorage.setItem('isGrid', JSON.stringify(isGrid));
  }, [isGrid]);
  const addCameraStream = (camera: Camera) => {
    if (availableIds.length > 0) {
      const newId = availableIds[0]; // Take the smallest available ID
      setAvailableIds(availableIds.slice(1)); // Remove the new ID from the available IDs
      const isLocalCamera = camera.url === '0'; // Check if the URL is "0"
      const newCameraStream = {
        id: newId,
        selectedCamera: camera,
        streamSrc: isLocalCamera
          ? ''
          : `${BASE_URL}/stream/${newId}?camera=${
              selectedCamera?.url
            }&quality=${Object.keys(Quality)[0]}&is_recording=${false}`,
        selectedQuality: Object.keys(Quality)[0],
        isPlaying: true,
        isLoading: true,
        isRecording: false,
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
        isLocalCamera: isLocalCamera, // Add a flag for local camera
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

      // Save the updated streams to localStorage
      localStorage.setItem('cameraStreams', JSON.stringify(updatedStreams));

      return updatedStreams;
    });
  };

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

      // Save the updated streams to localStorage
      localStorage.setItem('cameraStreams', JSON.stringify(updatedStreams));

      return updatedStreams;
    });
  };

  const deleteAllCameraStreams = () => {
    const confirmed = window.confirm(
      'Tüm yayınları kapatmak istediğinizden emin misiniz?'
    );
    if (confirmed) {
      // Clear local storage
      localStorage.removeItem('cameraStreams');
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

  const resetCameraStreams = () => {
    // Get the current cameraStreams state
    setCameraStreams((currentStreams) => {
      // Map through the camera streams and reset the position and size properties
      const resetStreams = currentStreams.map((stream) => ({
        ...stream,
        position: { x: 0, y: 0 }, // Set the default position
        size: { width: '100%', height: '100%' }, // Set the default size
      }));

      // Update local storage
      localStorage.setItem('cameraStreams', JSON.stringify(resetStreams));

      // Return the updated streams
      return resetStreams;
    });
    setIsModified(false); // Reset the isModified state
  };

  return (
    <div className='h-full w-full overflow-auto'>
      {/* <Toaster /> */}
      <Toast ref={toast} />

      <div className='container mx-auto mb-20'>
        <div className='flex items-center'>
          <div className='flex flex-grow items-center justify-center'>
            <AddCameraButton
              toast={toast}
              showAddCamera={showAddCamera}
              setShowAddCamera={setShowAddCamera}
              disabled={false}
            />
            <CameraDropdown
              selectedCamera={selectedCamera}
              setSelectedCamera={setSelectedCamera}
              cameraStreams={cameraStreams}
              cameraUrls={cameraUrls}
              addCameraStream={addCameraStream}
              showAddCamera={showAddCamera}
            />
          </div>

          <StreamUtilButtons
            isModified={isModified}
            resetCameraStreams={resetCameraStreams}
            deleteAllCameraStreams={deleteAllCameraStreams}
            setIsGrid={setIsGrid}
            isGrid={isGrid}
            cameraStreamsLength={cameraStreams.length}
          />
        </div>
        <div className={`grid grid-cols-12  gap-4 relative`}>
          <div className={`relative col-span-9 `}>
            <div
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
                            streamSrc={camera.streamSrc}
                            availableIds={availableIds}
                            setAvailableIds={setAvailableIds}
                            cameraStreams={cameraStreams}
                            setCameraStreams={setCameraStreams}
                            isLocalCamera={camera.isLocalCamera}
                            toast={toast}
                          />
                        </Resizable>
                      </Draggable>
                    );
                  })}
            </div>
          </div>
          <div className={`col-span-3 fixed top-40 right-16`}>
            <RecogFaces toast={toast} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
