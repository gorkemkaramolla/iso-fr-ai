'use client';
import React, { useState, useEffect } from 'react';
import { Quality } from '@/utils/enums';
import AddCameraButton from '@/components/camera/AddCameraButton';
import CameraStreamControl from '@/components/camera/CameraStreamControl';
import axios from 'axios';
import CameraDropdown from '@/components/camera/CameraDropdown';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';
import api from '@/utils/axios_instance';
import RecogFaces from '@/components/camera/RecogFace';

const VideoStream: React.FC = () => {
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraUrls, setCameraUrls] = useState<{ [key: string]: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableIds, setAvailableIds] = useState([1, 2, 3, 4, 5, 6]);
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);

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
      }
    }
  }, []);

  useEffect(() => {
    const fetchCameraUrls = async () => {
      try {
        const response = await api.get('/camera-urls');
        const data = response.data;
        setCameraUrls(data);
      } catch (error) {
        console.error('Error fetching camera URLs:', error);
      }
    };
    fetchCameraUrls();
  }, []);

  const addCameraStream = (cameraLabel: string) => {
    if (availableIds.length > 0) {
      const newId = availableIds[0]; // Take the smallest available ID
      setAvailableIds(availableIds.slice(1)); // Remove the new ID from the available IDs
      const newCameraStream = {
        id: newId,
        selectedCamera: cameraLabel,
        streamSrc: `${
          process.env.NEXT_PUBLIC_FLASK_URL
        }/stream/${newId}?camera=${selectedCamera}&quality=${
          Object.keys(Quality)[0]
        }&is_recording=${false}`,
        selectedQuality: Object.keys(Quality)[0],
        isPlaying: true,
        isLoading: true,
        isRecording: false,
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
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
      setSelectedCamera('');
    }
  };

  const saveCameraStreamPosition = (
    id: number,
    position: { x: number; y: number }
  ) => {
    if (typeof window !== 'undefined') {
      const savedStreams = localStorage.getItem('cameraStreams');
      let cameraStreamsList: CameraStream[] = savedStreams
        ? JSON.parse(savedStreams)
        : [];

      // Update the position of the cameraStream with the specified id
      cameraStreamsList = cameraStreamsList.map((camera) =>
        camera.id === id ? { ...camera, position } : camera
      );

      // Save the updated list back to localStorage
      localStorage.setItem('cameraStreams', JSON.stringify(cameraStreamsList));
    }
  };

  const saveCameraStreamSize = (
    id: number,
    size: { width: string | number; height: string | number }
  ) => {
    if (typeof window !== 'undefined') {
      const savedStreams = localStorage.getItem('cameraStreams');
      let cameraStreamsList: CameraStream[] = savedStreams
        ? JSON.parse(savedStreams)
        : [];

      // Update the size of the cameraStream with the specified id
      cameraStreamsList = cameraStreamsList.map((camera) =>
        camera.id === id ? { ...camera, size } : camera
      );

      // Save the updated list back to localStorage
      localStorage.setItem('cameraStreams', JSON.stringify(cameraStreamsList));
    }
  };

  return (
    <div className='h-full w-full overflow-auto'>
      <div className='container mx-auto mb-20'>
        <div className='flex justify-center items-center'>
          <AddCameraButton
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
        <div className='relative flex justify-center items-start mx-auto gap-4 min-h-screen'>
          {cameraStreams
            .sort((a, b) => a.id - b.id)
            .map((camera) => {
              return (
                <Draggable
                  key={camera.id}
                  defaultPosition={camera.position || { x: 0, y: 0 }} // Set the initial position from the saved position
                  handle='.drag-handle'
                  bounds='parent'
                  onStop={(e, data) =>
                    saveCameraStreamPosition(camera.id, {
                      x: data.x,
                      y: data.y,
                    })
                  }
                >
                  <Resizable
                    key={camera.id}
                    defaultSize={
                      camera.size || {
                        width: '100%',
                        height: '100%',
                      }
                    }
                    minHeight={400}
                    minWidth={600}
                    maxWidth='100%'
                    maxHeight='100%'
                    className='bg-slate-100 rounded-lg border border-slate-400 shadow-lg'
                    onResizeStop={(e, direction, ref) =>
                      saveCameraStreamSize(camera.id, {
                        width: ref.style.width,
                        height: ref.style.height,
                      })
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
                    />
                  </Resizable>
                </Draggable>
              );
            })}
          <RecogFaces />
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
