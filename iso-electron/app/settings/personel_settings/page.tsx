'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { motion, AnimatePresence } from 'framer-motion';
import AddPersonel from './add-personel';
import ShowPersonel from './personel-list';

export default function Page() {
  const [view, setView] = useState<'form' | 'personnel'>('form');

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-end mb-4'>
        <Button
          label='Formu Göster'
          onClick={() => setView('form')}
          className={`p-button-md ${
            view === 'form' ? 'p-button-secondary' : ''
          }`}
        />
        <Button
          label='Personel Listesini Göster'
          onClick={() => setView('personnel')}
          className={`p-button-md ml-2 ${
            view === 'personnel' ? 'p-button-secondary' : ''
          }`}
        />
      </div>

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
