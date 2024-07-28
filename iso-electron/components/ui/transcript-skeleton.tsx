import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const SkeletonLoader = () => {
  return (
    <div className='p-4'>
      {/* Title Skeleton */}
      <Skeleton height={30} width={200} />

      {/* Audio Player Skeleton */}
      <div className='bg-white rounded shadow p-4 w-9/12 mb-4 mt-4'>
        <Skeleton height={80} width='100% ' />
        <Skeleton height={20} width='50%' style={{ marginTop: '10px' }} />
      </div>

      {/* Buttons Skeleton */}
      <div className='flex justify-end space-x-2 mb-4 w-9/12 '>
        <Skeleton height={45} width={180} />
        <Skeleton height={45} width={180} />
      </div>

      {/* Transcription Segments Skeleton */}
      <div className='bg-white rounded shadow p-4 w-9/12'>
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
        <Skeleton height={40} width='100%' style={{ marginBottom: '10px' }} />
      </div>
    </div>
  );
};

export default SkeletonLoader;
