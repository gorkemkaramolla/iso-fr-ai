import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ChatSideMenuSkeleton = () => {
  return (
    <div className='p-4'>
      {/* Header Skeleton */}
      <Skeleton height={25} width={150} className='mb-4' />

      {/* List Items Skeleton */}
      <div className='space-y-2'>
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
        <Skeleton height={40} width='100%' />
      </div>

      {/* Pagination Buttons Skeleton */}
      <div className='mt-4 flex justify-between text-sm text-gray-600'>
        <Skeleton height={40} width={60} />
        <Skeleton height={40} width={60} />
      </div>
    </div>
  );
};

export default ChatSideMenuSkeleton;
