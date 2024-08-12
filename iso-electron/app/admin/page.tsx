'use client';

import React, { useState, useEffect } from 'react';
import AddUser from './add-user';
import UserList from './list-user';
import { motion, AnimatePresence } from 'framer-motion';
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
      const response = await api.get<User[]>('/users');
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'tween', ease: 'anticipate', duration: 0.5 }}
      className='min-h-screen'
    >
      <div className='max-w-7xl mx-auto'>
        <motion.h1
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          className='text-4xl font-bold text-black text-center mb-16 tracking-wide'
        >
          Admin Kontrol Paneli
        </motion.h1>

        <nav className='flex justify-center mb-8'>
          <ul className='flex space-x-8 border-b border-gray-300'>
            <li
              className={`cursor-pointer py-2 px-4 ${
                activeView === 'addUser'
                  ? 'text-blue-500 border-b-4 border-blue-500'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveView('addUser')}
            >
              Kullanıcı Ekle
            </li>
            <li
              className={`cursor-pointer py-2 px-4 ${
                activeView === 'userList'
                  ? 'text-blue-500 border-b-4 border-blue-500'
                  : 'text-gray-500 border-b-4 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveView('userList')}
            >
              Kullanıcı Listesi
            </li>
          </ul>
        </nav>

        <AnimatePresence>
          {activeView === 'addUser' && (
            <AddUser setActiveView={setActiveView} fetchUsers={fetchUsers} />
          )}
          {activeView === 'userList' && (
            <UserList
              users={users}
              fetchUsers={fetchUsers}
              openModal={openModal}
            />
          )}
        </AnimatePresence>
      </div>

      {isModalOpen && currentUser && (
        <div className='modal modal-open'>
          <div className='modal-box bg-white rounded-lg shadow-lg'>
            <h3 className='font-bold text-lg text-gray-800'>
              Update User Information
            </h3>
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
                    setCurrentUser({
                      ...currentUser,
                      role: e.target.value as 'user' | 'admin',
                    })
                  }
                  className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                >
                  <option value='user'>User</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>
            </div>
            <div className='modal-action'>
              <button
                className='btn btn-primary bg-indigo-500 hover:bg-indigo-600 text-white'
                onClick={handleUpdateUser}
              >
                Confirm
              </button>
              <button
                className='btn bg-gray-200 hover:bg-gray-300 text-gray-800'
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
