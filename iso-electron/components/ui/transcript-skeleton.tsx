import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import UiWrapper from './Wrapper';
import ChatSideMenuSkeleton from './transcription-history-skeleton';

const TranscriptionSkeleton = () => {
  return (
    <UiWrapper>
      <span className='flex'>
        <div className='p-4 w-9/12'>
          {/* Skeleton for the back button */}
          <div className='mb-4'>
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
            <Skeleton width={'100%'} height={40} />
          </div>

          {/* Skeleton for the title */}
          <div className='mb-4'>
            <Skeleton width={`60%`} height={40} />
          </div>

          {/* Skeleton for the view mode buttons */}
          <div className='flex space-x-2 mb-4'>
            <Skeleton width={60} height={30} />
            <Skeleton width={60} height={30} />
          </div>

          {/* Skeleton for the speaker dropdown */}
          <div className='flex space-x-2 mb-4'>
            <Skeleton width={120} height={40} />
          </div>

          {/* Skeleton for the transcription segments */}
          <div className='overflow-y-auto h-[600px]'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className='mb-2'>
                <div className='flex items-center space-x-2 mb-2'>
                  <Skeleton width={50} height={20} />
                  <Skeleton width={100} height={20} />
                </div>
                <Skeleton count={2} />
              </div>
            ))}
          </div>
        </div>
        <div className='p-4 w-3/12'>
          <ChatSideMenuSkeleton />
        </div>
      </span>
    </UiWrapper>
  );
};

export default TranscriptionSkeleton;
