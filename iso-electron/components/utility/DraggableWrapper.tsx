'use client';

import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

interface DraggableWrapperProps {
  children: React.ReactNode;
  uniqueId: string;
}

const DraggableWrapper: React.FC<DraggableWrapperProps> = ({
  children,
  uniqueId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPosition = localStorage.getItem(
        `DraggablePosition-${uniqueId}`
      );
      if (storedPosition) {
        try {
          const parsedPosition = JSON.parse(storedPosition);
          setPosition(parsedPosition);
        } catch (error) {
          console.error('Error parsing stored position:', error);
        }
      }
    }
  }, [uniqueId]);

  const handleDragStopped = (e: any, data: any) => {
    setIsDragging(false);
    const newPosition = { x: data.x, y: data.y };
    setPosition(newPosition);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        `DraggablePosition-${uniqueId}`,
        JSON.stringify(newPosition)
      );
    }
  };

  return (
    <Draggable
      position={position}
      onStart={() => setIsDragging(true)}
      bounds='parent'
      onStop={handleDragStopped}
    >
      <div className='cursor-grab w-full'>{children}</div>
    </Draggable>
  );
};

export default DraggableWrapper;
