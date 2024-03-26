'use client';
import { useState } from 'react';

export default function Home() {
  const [streamOn, setStreamOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleStream = () => {
    if (!streamOn) {
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
    setStreamOn(!streamOn);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='w-full h-full flex items-center justify-center flex-col '>
        <button onClick={toggleStream}>
          {!loading && (streamOn ? 'Close Stream' : 'Open Stream')}
        </button>

        {streamOn ? (
          <div>
            {loading && <div>Loading stream...</div>}
            <iframe
              className=''
              width={640}
              height={480}
              src='http://127.0.0.1:5002/video_feed'
              onLoad={handleIframeLoad}
              style={{ display: loading ? 'none' : 'block' }} // Hide iframe while loading
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
