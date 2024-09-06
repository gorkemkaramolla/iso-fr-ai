'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import createApi from '@/utils/axios_instance';
import { Personel } from '@/types';
import RecogList from '@/components/personnel/RecogList';
import Emotion from '@/components/personnel/Emotion';
import CalendarComponent from '@/components/camera/Calendar';
import { Nullable } from 'primereact/ts-helpers';

const ClientProfile = dynamic(() => import('./profile'), {
  ssr: false,
});

function ProfileContent() {
  const searchParams = useSearchParams();
  const [profileData, setProfileData] = useState<Personel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = searchParams.get('id');

  useEffect(() => {
    async function fetchProfileData(profileId: string) {
      setIsLoading(true);
      setError(null);
      const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
      try {
        const response = await api.get(`/personel/${profileId}`);
        const data: Personel = await response.json();
        setProfileData(data);
      } catch (error) {
        setError('Failed to fetch profile data');
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchProfileData(id);
    } else {
      setIsLoading(false);
      setError('No profile ID provided');
    }
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!profileData) return <div>No profile data available.</div>;

  return <ClientProfile profileData={profileData} />;
}

export default function Page() {
  const [selectedDate, setSelectedDate] = useState<Nullable<Date>>(new Date());
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className='flex w-full items-center justify-around flex-col xl:flex-row gap-4 '>
        <div className=''>
          <ProfileContent />
          <Emotion />
        </div>
        <div>
          <div className='flex my-4 items-center justify-between px-2'>
            <h1 className='nunito-700  text-gray-700 '>Son Tanınmalar</h1>
            <CalendarComponent
              className='h-8 [&_.p-inputtext]:bg-[rgb(244,244,245)] [&_.p-inputtext]:rounded-l-xl [&_.p-inputtext]:border-none [&_.p-inputtext]:shadow-sm [&_button]:rounded-r-xl [&_button]:shadow-sm'
              minDate={new Date('2024-08-01')}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
          <hr className='mb-4 w-5/6 mx-auto' />
          <div className='h-[82vh] overflow-scroll'>
            <RecogList selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
