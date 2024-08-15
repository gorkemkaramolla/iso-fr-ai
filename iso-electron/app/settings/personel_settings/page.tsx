'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import AddPersonel from './add-personel';
import ShowPersonel from './personel-list';

const Dashboard = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Use useEffect to set the active component after the component has mounted
  useEffect(() => {
    const storedComponent =
      localStorage.getItem('activeDashboardComponent') || 'form';
    setActiveComponent(storedComponent);
  }, []);

  useEffect(() => {
    if (activeComponent) {
      localStorage.setItem('activeDashboardComponent', activeComponent);
    }
  }, [activeComponent]);

  const menuItems = [
    { id: 'form', label: 'Kullanıcı Ekle', icon: UserPlus },
    { id: 'personnel', label: 'Kullanıcı Listesi', icon: Users },
  ];

  const renderActiveComponent = () => {
    if (!activeComponent) {
      return null; // Return null or a loading indicator while the active component is being determined
    }
    switch (activeComponent) {
      case 'form':
        return <AddPersonel />;
      case 'personnel':
        return <ShowPersonel />;
      default:
        return null;
    }
  };

  return (
    <div className=''>
      <header className=''>
        <nav className=''>
          <ul className='flex justify-center items-center h-16'>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveComponent(item.id)}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                    activeComponent === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} className='mr-2' />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <motion.div
          key={activeComponent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderActiveComponent()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
