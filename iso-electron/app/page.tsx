'use client';

import React, { useEffect } from 'react';
import ShowPersonel from './settings/personel_settings/personel-list';
import SearchComponent from '@/components/search/main-search-component';
import { useRouter } from 'next/navigation';
const Page: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, []);
  return (
    <div className='h-[91vh] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl  mx-auto my-12'>
        <SearchComponent />
      </div>
      <div className='container mx-auto'>{/* <ShowPersonel /> */}</div>
    </div>
  );
};

export default Page;
