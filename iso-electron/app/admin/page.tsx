// pages/admin.tsx
'use client';
import React, { useState, useEffect } from 'react';
import AddUser from './add-user';
import UserList from './list-user';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from 'primereact/button';
import createApi from '@/utils/axios_instance';
import { User } from '@/types';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'addUser' | 'userList'>(
    'addUser'
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      const response = await api.get<User[]>('/users', {
        withCredentials: true,
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const openModal = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setCurrentUser(null);
    setIsModalOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.put(`/users/${currentUser.id}`, currentUser, {
        withCredentials: true,
      });
      fetchUsers(); // Refresh the user list after update
      closeModal();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <motion.div
      initial='initial'
      animate='in'
      exit='out'
      variants={{
        initial: { opacity: 0, y: -20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: 20 },
      }}
      transition={{ type: 'tween', ease: 'anticipate', duration: 0.5 }}
      className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8'
    >
      <div className='max-w-7xl mx-auto'>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className='text-4xl font-extrabold text-gray-900 text-center mb-12'
        >
          Admin Kontrol Paneli
        </motion.h1>

        <ul className='menu menu-horizontal rounded-box'>
          <li>
            <button
              onClick={() => setActiveView('addUser')}
              className={`mr-2 ${
                activeView === 'addUser' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Kullanıcı Ekle
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveView('userList')}
              className={`${
                activeView === 'userList' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Kullanıcı Listesi
            </button>
          </li>
        </ul>

        {/* Active View Component */}
        <AnimatePresence>
          {activeView === 'addUser' && <AddUser fetchUsers={fetchUsers} />}
          {activeView === 'userList' && (
            <UserList
              users={users}
              fetchUsers={fetchUsers}
              openModal={openModal}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      {isModalOpen && currentUser && (
        <div className='modal modal-open'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg'>Update User Information</h3>
            <div className='mt-4 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Username
                </label>
                <input
                  type='text'
                  name='username'
                  value={currentUser.username}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, username: e.target.value })
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <input
                  type='password'
                  name='password'
                  value={currentUser.password ?? ''}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, password: e.target.value })
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Role
                </label>
                <select
                  name='role'
                  value={currentUser.role}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, role: e.target.value })
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                >
                  <option value='user'>User</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>
            </div>
            <div className='modal-action'>
              <button className='btn btn-primary' onClick={handleUpdateUser}>
                Confirm
              </button>
              <button className='btn' onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
