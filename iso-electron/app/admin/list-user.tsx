// components/UserList.tsx
'use client';

import React from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import createApi from '@/utils/axios_instance';
import { User } from '@/types';
interface UserListProps {
  users: User[];
  fetchUsers: () => void;
  openModal: (user: User) => void;
}

export default function UserList({
  users,
  fetchUsers,
  openModal,
}: UserListProps) {
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.delete(`/users/${userId}`, { withCredentials: true });
      fetchUsers();
    } catch (error) {
      alert('Error deleting user: ' + (error as Error).message);
    }
  };

  return (
    <motion.div
      key='userList'
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className='bg-white overflow-hidden shadow-xl rounded-lg flex flex-col'
    >
      <div className='px-4 py-5 sm:p-6 flex-grow'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          Kullanıcı Listesi
        </h2>
        <div
          className='overflow-y-auto'
          style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50 sticky top-0'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Kullanıcı Adı
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Email
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Rol
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              <AnimatePresence>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {user.username}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {user.email}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <motion.span
                        whileHover={{ scale: 1.1 }}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </motion.span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className='text-red-600 hover:text-red-800'
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaTrash />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className='text-yellow-600 hover:text-yellow-800'
                        onClick={() => openModal(user)}
                      >
                        <FaEdit />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
