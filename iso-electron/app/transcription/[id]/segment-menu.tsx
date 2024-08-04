import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Edit2, Trash2, X } from 'lucide-react';

interface SegmentMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCopy: () => void;
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

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className='absolute bg-white rounded-lg py-2 z-50'
      style={{ top: position.y, left: position.x }}
    >
      <button
        className='flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100'
        onClick={onEdit}
      >
        <Edit2 size={16} /> Edit
      </button>
      <button
        className='flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600'
        onClick={() => {
          if (window.confirm('Are you sure you want to delete this segment?'))
            onDelete();
        }}
      >
        <Trash2 size={16} /> Delete
      </button>
      <button
        className='flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100'
        onClick={onCopy}
      >
        <Copy size={16} /> Copy
      </button>
    </motion.div>
  );
};

export default SegmentMenu;
