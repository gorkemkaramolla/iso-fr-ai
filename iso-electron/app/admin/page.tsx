'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import ShowUsers from './user-list';

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(
    'users'
  );

  useEffect(() => {
    setActiveComponent('users');
  }, []);

  return (
    <div className=''>
      <header className=''>
        <nav className=''>
          <ul className='flex justify-center items-center h-16'>
            <li>
              <button className='flex items-center px-4 py-2 rounded-md transition-colors duration-200 bg-indigo-600 text-white'>
                <Users size={20} className='mr-2' />
                <span>Kullanıcı Listesi</span>
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ShowUsers />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
