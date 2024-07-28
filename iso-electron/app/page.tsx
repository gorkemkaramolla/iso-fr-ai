'use client';

import React from 'react';
import ShowPersonel from './settings/personel_settings/personel-list';
import SearchComponent from '@/components/search/main-search-component';

const Page: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      {/* <div className='container mx-auto'>
        <ShowPersonel />
      </div> */}
      <div className='max-w-3xl mx-auto mt-8'>
        <SearchComponent />
      </div>
    </div>
  );
};

export default Page;
