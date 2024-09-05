import React from 'react';
import { FaGripVertical } from 'react-icons/fa';
import { PanelResizeHandle } from 'react-resizable-panels';
const PanelResizeHandler: React.FC = () => {
  return (
    <PanelResizeHandle className='w-1 h-[93dvh] bg-gray-200'></PanelResizeHandle>
  );
};

export default PanelResizeHandler;
