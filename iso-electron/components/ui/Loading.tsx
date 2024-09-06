import React from 'react';
import Image from 'next/image';
const RotatingWheel = () => {
  return (
    <div className='absolute rounded-full   top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  '>
      <Image
        width={100}
        height={100}
        src='/outer_wheel.png'
        alt='Outer Wheel'
        className='w-24 h-24  slow-animation '
      />
      <Image
        width={100}
        height={100}
        src='/inner_circle.png'
        alt='Inner Circle'
        className='absolute rounded-full  bg-white  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[57.5px] h-[57.5px]'
      />
    </div>
  );
};

export default RotatingWheel;
