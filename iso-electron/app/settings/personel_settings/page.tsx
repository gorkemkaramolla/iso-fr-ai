'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import ShowPersonel from './personel-list';

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(
    'personnel'
  );

  useEffect(() => {
    setActiveComponent('personnel');
  }, []);

  return (
    <div className=''>
      <header className='container mx-auto px-5 pt-8 pb-4'>
        <h2>Personel Ayarları</h2>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ShowPersonel />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
