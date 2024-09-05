import React from 'react';
import { FaGripVertical } from 'react-icons/fa';
import { PanelResizeHandle } from 'react-resizable-panels';
const PanelResizeHandler: React.FC = () => {
  return (
    <PanelResizeHandle className='cursor-col-resize w-[2px] max-h-[90vh] bg-gray-200 relative md:flex hidden'>
      <div className='absolute top-1/2 bg-primary text-white py-[6px] px-[3px] rounded-xl left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <FaGripVertical style={{ zIndex: 100 }} className='text-[12px]' />
      </div>
    </PanelResizeHandle>
  );
};

export default PanelResizeHandler;
