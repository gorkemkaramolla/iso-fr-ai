'use client';
import { Button } from 'primereact/button';
import React, { useEffect, useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
interface Video {
  filename: string;
  title: string;
}

const Home: React.FC = () => {
  const toast = useRef<Toast>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_FLASK_URL}/videos`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        setVideos(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Unknown error');
        }
      }
    };

    fetchVideos();
  }, []);

  const downloadVideo = async (filename: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${filename}`
      );

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video.mp4'; // or whatever the file name is
      a.click();
      toast.current?.show({
        severity: 'info',
        summary: 'Info',
        detail: filename + ' indirildi',
      });
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Unknown error');
      }
    }
  };

  if (!videos) {
    return <p>Loading...</p>;
  }

  if (videos.length === 0) 
    return <div className='min-h-screen bg-gray-100 p-8 overflow-y-scroll'>
    <p className='text-center'>Video Kaydı Henüz Yok</p></div>;

  return (
    <div className='max-h-screen bg-gray-100 p-8 overflow-y-scroll'>
      <Toast ref={toast} />
      <h1 className='text-3xl font-bold text-center mb-8'>Video Galeri</h1>
      {error && <p className='text-red-500 text-center'>{error}</p>}
      <div className='container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {videos.map((video) => (
          <div
            key={video.filename}
            className='bg-white shadow-md rounded-lg p-4 relative'
          >
            <h2 className='text-xl font-semibold mb-4'>{video.title}</h2>
            <video
              src={`${process.env.NEXT_PUBLIC_FLASK_URL}/videos/${video.filename}`}
              controls
              width='100%'
              height='100%'
              className='mb-16'
            />
            <div className='absolute bottom-4 left-4'>
              <Button onClick={() => downloadVideo(video.filename)}>
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
