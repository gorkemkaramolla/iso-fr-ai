'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import createApi from '@/utils/axios_instance';
import { z } from 'zod';
import { ZodError } from 'zod';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserCog,
  FaPlus,
  FaTrash,
  FaKey,
  FaEdit,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import 'daisyui';

const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['user', 'admin']),
});

type User = z.infer<typeof userSchema>;

export default function AdminPage() {
  const [newUser, setNewUser] = useState<User>({
    id: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof User, string>>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleAddNewUser = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      userSchema.parse(newUser);
      setErrors({});
    } catch (e) {
      if (e instanceof ZodError) {
        const validationErrors: Partial<Record<keyof User, string>> = {};
        e.errors.forEach((error) => {
          if (error.path.length > 0) {
            const path = error.path[0] as keyof User;
            validationErrors[path] = error.message;
          }
        });
        setErrors(validationErrors);
        return;
      }
    }

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.post('/add_user', newUser, { withCredentials: true });
      setMessage('User added successfully!');
      setNewUser({
        id: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
      });
      fetchUsers();
    } catch (error) {
      setMessage('Error adding user: ' + (error as Error).message);
    }
  };

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

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.delete(`/users/${userId}`, { withCredentials: true });
      setMessage('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      setMessage('Error deleting user: ' + (error as Error).message);
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
      userSchema.parse(currentUser);
      setErrors({});
    } catch (e) {
      if (e instanceof ZodError) {
        const validationErrors: Partial<Record<keyof User, string>> = {};
        e.errors.forEach((error) => {
          if (error.path.length > 0) {
            const path = error.path[0] as keyof User;
            validationErrors[path] = error.message;
          }
        });
        setErrors(validationErrors);
        return;
      }
    }

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.put(
        `/users/${currentUser.id}`,
        { ...currentUser },
        { withCredentials: true }
      );
      setMessage('User updated successfully!');
      fetchUsers(); // To refresh the user list after update
      closeModal();
    } catch (error) {
      setMessage('Error updating user: ' + (error as Error).message);
    }
  };

  const handleModalInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!currentUser) return;
    const { name, value } = e.target;
    setCurrentUser((prev) => ({ ...prev!, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      userSchema.parse(newUser);
      setErrors({});
    } catch (e) {
      if (e instanceof ZodError) {
        const validationErrors: Partial<Record<keyof User, string>> = {};
        e.errors.forEach((error) => {
          if (error.path.length > 0) {
            const path = error.path[0] as keyof User;
            validationErrors[path] = error.message;
          }
        });
        setErrors(validationErrors);
        return;
      }
    }

    try {
      const api = createApi(process.env.NEXT_PUBLIC_DIARIZE_URL);
      await api.post('/users', newUser, { withCredentials: true });
      setMessage('User added successfully!');
      setNewUser({
        id: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
      });
      fetchUsers();
    } catch (error) {
      setMessage('Error adding user: ' + (error as Error).message);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: -20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: 20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial='initial'
      animate='in'
      exit='out'
      variants={pageVariants}
      transition={pageTransition}
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

        <div className='flex flex-col gap-8'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className='bg-white overflow-hidden shadow-xl rounded-lg'
          >
            <div className='px-4 py-5 sm:p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                Yeni Kullanıcı Ekle
              </h2>
              <form onSubmit={handleSubmit} className='space-y-4'>
                {['username', 'email', 'password', 'role'].map(
                  (field, index) => (
                    <motion.div
                      key={field}
                      variants={itemVariants}
                      initial='hidden'
                      animate='visible'
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                    >
                      <label
                        htmlFor={field}
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <div className='mt-1 relative rounded-md shadow-sm'>
                        {field !== 'role' ? (
                          <>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                              {field === 'username' && (
                                <FaUser className='text-gray-400' />
                              )}
                              {field === 'email' && (
                                <FaEnvelope className='text-gray-400' />
                              )}
                              {field === 'password' && (
                                <FaLock className='text-gray-400' />
                              )}
                            </div>
                            <input
                              type={field === 'password' ? 'password' : 'text'}
                              name={field}
                              id={field}
                              value={newUser[field as keyof User]}
                              onChange={handleInputChange}
                              className={`block w-full pl-10 pr-3 py-2 border ${
                                errors[field as keyof User]
                                  ? 'border-red-300'
                                  : 'border-gray-300'
                              } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                              placeholder={`${field} giriniz`}
                            />
                          </>
                        ) : (
                          <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                              <FaUserCog className='text-gray-400' />
                            </div>
                            <select
                              name={field}
                              id={field}
                              value={newUser.role}
                              onChange={handleInputChange}
                              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                            >
                              <option value='user'>User</option>
                              <option value='admin'>Admin</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <AnimatePresence>
                        {errors[field as keyof User] && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className='mt-2 text-sm text-red-600'
                          >
                            {errors[field as keyof User]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handleAddNewUser}
                    type='submit'
                    className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    <FaPlus className='mr-2' /> Add User
                  </button>
                </motion.div>
              </form>
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`mt-4 p-4 rounded-md ${
                      message.includes('Error')
                        ? 'bg-red-50 text-red-800'
                        : 'bg-green-50 text-green-800'
                    }`}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
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
                          key={user.id} // Ensure this key is unique
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
                              onClick={() => handleDeleteUser(user?.id!)}
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
        </div>
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
                  onChange={handleModalInputChange}
                  className={`mt-1 block w-full border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <input
                  type='password'
                  name='password'
                  value={currentUser.password}
                  onChange={handleModalInputChange}
                  className={`mt-1 block w-full border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Role
                </label>
                <select
                  name='role'
                  value={currentUser.role}
                  onChange={handleModalInputChange}
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
