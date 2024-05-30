'use client';
import React, { useState, useEffect } from 'react';
import { Quality } from '@/utils/enums';
import AddCameraButton from '@/components/camera/AddCameraButton';
import CameraStreamControl from '@/components/camera/CameraStreamControl';
import axios from 'axios';
import CameraDropdown from '@/components/camera/CameraDropdown';
import { Resizable } from 're-resizable';

const VideoStream: React.FC = () => {
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [cameraUrls, setCameraUrls] = useState<{ [key: string]: string }>({});
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableIds, setAvailableIds] = useState([1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    const fetchCameraUrls = async () => {
      try {
        const response = await axios.get(
          process.env.NEXT_PUBLIC_FLASK_URL + '/camera-urls'
        );
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

      setCameraStreams([
        ...cameraStreams,
        {
          id: newId,
          selectedCamera: cameraLabel,
          streamSrc: `${process.env.NEXT_PUBLIC_FLASK_URL}/stream/${newId}?camera=${selectedCamera}&quality=${Quality.Quality}`,
          selectedQuality: Quality.Quality,
          isPlaying: true,
          isLoading: true,
        },
      ]);
      setSelectedCamera('');
    }
  };

  const handleCameraChange = (id: number, selectedCamera: string) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id ? { ...camera, selectedCamera } : camera
      )
    );
  };

  const handleQualityChange = (id: number, selectedQuality: string | null) => {
    setCameraStreams(
      cameraStreams.map((camera) =>
        camera.id === id ? { ...camera, selectedQuality } : camera
      )
    );
  };

  return (
    <div className='h-screen overflow-y-scroll pb-20'>
      <div className='container mx-auto mb-10'>
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
        <div className='flex flex-wrap justify-center items-start mx-auto gap-4'>
          {cameraStreams
            .sort((a, b) => a.id - b.id)
            .map((camera) => (
              <Resizable
                key={camera.id}
                defaultSize={{
                  width: 'fit-content',
                  height: '100%',
                }}
                maxWidth='100%'
                maxHeight='100%'
                className='bg-slate-100 rounded-xl border-2 border-black'
              >
                <CameraStreamControl
                  cameraUrls={cameraUrls}
                  id={camera.id}
                  selectedCamera={camera.selectedCamera}
                  selectedQuality={camera.selectedQuality}
                  isPlaying={camera.isPlaying}
                  isLoading={camera.isLoading}
                  streamSrc={camera.streamSrc}
                  onCameraChange={handleCameraChange}
                  onQualityChange={handleQualityChange}
                  availableIds={availableIds}
                  setAvailableIds={setAvailableIds}
                  cameraStreams={cameraStreams}
                  setCameraStreams={setCameraStreams}
                />
              </Resizable>
            ))}
        </div>
      </div>
    </div>
  );
};

export default VideoStream;
