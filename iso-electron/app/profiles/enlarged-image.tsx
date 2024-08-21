'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface EnlargedImageProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function EnlargedImage({
  src,
  alt,
  onClose,
}: EnlargedImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50'
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        className='relative'
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={600}
          height={600}
          className='max-w-full max-h-[90vh] object-contain'
        />
        <button
          onClick={onClose}
          className='absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2'
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
