'use client';

import { ChangeEvent } from 'react';
import { motion } from 'framer-motion';

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  isEditing: boolean;
  name: string;
  value: string | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  href?: string;
}

export default function InfoItem({
  icon,
  label,
  isEditing,
  name,
  value,
  onChange,
  href,
}: InfoItemProps) {
  return (
    <motion.div
      className='flex items-center text-gray-700'
      animate={
        isEditing
          ? {
              backgroundColor: ['#ffffff', '#f0f4ff', '#ffffff'],
              boxShadow: [
                '0 0 0 rgba(59, 130, 246, 0)',
                '0 0 6px rgba(59, 130, 246, 0.3)',
                '0 0 0 rgba(59, 130, 246, 0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      <div className='mr-2 text-blue-600'>{icon}</div>
      <div className='flex-grow'>
        <p className='font-medium'>{label}</p>
        {isEditing ? (
          <input
            name={name}
            value={value}
            onChange={onChange}
            className='text-gray-600 border-b border-gray-300 p-1 w-full bg-transparent focus:outline-none focus:border-blue-500 transition-colors duration-300'
          />
        ) : href ? (
          <a href={href} className='text-blue-500 hover:underline'>
            {value}
          </a>
        ) : (
          <p className='text-gray-600'>{value}</p>
        )}
      </div>
    </motion.div>
  );
}
