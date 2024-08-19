// components/SegmentMenu.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react';
import { Copy, Edit2, Trash2 } from 'lucide-react';

interface SegmentMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void; // Assuming onEdit now no longer requires parameters
  onCopy: () => void;
  segmentId: string; // Add this line
  oldName: string;
}

const SegmentMenu: React.FC<SegmentMenuProps> = ({
  isOpen,
  position,
  onClose,
  onDelete,
  onEdit,
  onCopy,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: position.y - 30,
        left: position.x,
        zIndex: 50,
      }}
    >
      <Dropdown isOpen={true} onClose={onClose}>
        <DropdownTrigger>
          <div style={{ width: 0, height: 0 }}></div>
        </DropdownTrigger>
        <DropdownMenu aria-label='Segment actions'>
          <DropdownItem
            key='edit'
            startContent={<Edit2 size={16} />}
            onPress={onEdit}
          >
            Edit Speaker Name
          </DropdownItem>
          <DropdownItem
            key='delete'
            className='text-danger'
            color='danger'
            startContent={<Trash2 size={16} />}
            onPress={() => {
              if (
                window.confirm('Are you sure you want to delete this segment?')
              ) {
                onDelete();
              }
            }}
          >
            Delete Segment
          </DropdownItem>
          <DropdownItem
            key='copy'
            startContent={<Copy size={16} />}
            onPress={onCopy}
          >
            Copy
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default SegmentMenu;
