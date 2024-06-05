import React, { createRef, useState } from 'react';
import Draggable from 'react-draggable';
interface DraggableWrapperProps {
  children: React.ReactNode;
  uniqueId: string;
}
const DraggableWrapper = ({ children, uniqueId }: DraggableWrapperProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = createRef<Draggable>();
  const handleDragStopped = () => {
    setIsDragging(false);
    localStorage.setItem(
      `DraggablePosition-${uniqueId}`,
      JSON.stringify(dragRef.current?.state)
    );
  };
  return (
    <Draggable
      ref={dragRef}
      defaultPosition={JSON.parse(
        localStorage.getItem(`DraggablePosition-${uniqueId}`) || '{}'
      )}
      onStart={() => {
        setIsDragging(true);
      }}
      bounds='parent'
      onStop={handleDragStopped}
    >
      <div className='cursor-grab w-full'>{children}</div>
    </Draggable>
  );
};

export default DraggableWrapper;
