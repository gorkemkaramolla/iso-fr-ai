'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddPersonel from './add-personel';
import ShowPersonel from './personel-list';

export default function Page() {
  const [view, setView] = useState<'form' | 'personnel'>('form');

  return (
    <div className='container mx-auto px-4 '>
      <nav className='flex justify-center'>
        <ul className='flex space-x-8 border-b border-gray-300'>
          <li
            className={`cursor-pointer py-2 px-4 ${
              view === 'form'
                ? 'text-blue-500 border-b-4 border-blue-500' // Increase the border thickness for active state
                : 'text-gray-500 border-b-4 border-transparent hover:text-gray-700' // Transparent border for inactive state
            }`}
            onClick={() => setView('form')}
          >
            Kullanıcı Ekle
          </li>
          <li
            className={`cursor-pointer py-2 px-4 ${
              view === 'personnel'
                ? 'text-blue-500 border-b-4  border-blue-500' // Increase the border thickness for active state
                : 'text-gray-500 border-b-4 border-transparent hover:text-gray-700' // Transparent border for inactive state
            }`}
            onClick={() => setView('personnel')}
          >
            Kullanıcı Listesi
          </li>
        </ul>
      </nav>

      <div className='gap-6'>
        <AnimatePresence>
          {view === 'form' && (
            <motion.div className='w-full'>
              <AddPersonel />
            </motion.div>
          )}

          {view === 'personnel' && (
            <motion.div className='w-full'>
              <ShowPersonel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
