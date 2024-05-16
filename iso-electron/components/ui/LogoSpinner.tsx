import React from 'react';

const RotatingWheel = () => {
  return (
    <div className='relative'>
      <img
        src='/outer_wheel.png'
        alt='Outer Wheel'
        className='w-24 h-24 slow-animation'
      />
      <img
        src='/inner_circle.png'
        alt='Inner Circle'
        className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[57.5px] h-[57.5px]'
      />
    </div>
  );
};

export default RotatingWheel;
