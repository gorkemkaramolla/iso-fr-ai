import React from 'react';

const RecogDetailsInfoItem = ({
  label,
  value,
}: {
  label: string | number;
  value: string | number;
}) => (
  <div className='flex items-center mb-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300'>
    <p className='text-sm w-full'>
      <span className='font-semibold text-indigo-700 mr-2'>{label}:</span>
      <span className='text-gray-700 font-medium'>{value}</span>
    </p>
  </div>
);

export default RecogDetailsInfoItem;
