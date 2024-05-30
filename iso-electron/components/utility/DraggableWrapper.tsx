import React, { useState } from 'react';
import Draggable from 'react-draggable';
interface DraggableWrapperProps {
  children: React.ReactNode;
}
const DraggableWrapper = ({ children }: DraggableWrapperProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Draggable
      onStart={() => setIsDragging(true)}
      bounds='parent'
      handle='.drag-handle'
      onStop={() => setIsDragging(false)}
    >
      <div
        className={`group overflow-x-auto linear duration-100 ${
          isDragging ? 'dragging' : ''
        }`}
      >
        {children}
      </div>
    </Draggable>
  );
};

export default DraggableWrapper;
