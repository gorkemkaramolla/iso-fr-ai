// components/AddUser.tsx
'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { z } from 'zod';
import { ZodError } from 'zod';
import { FaUser, FaEnvelope, FaLock, FaUserCog, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import createApi from '@/utils/axios_instance';

const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['user', 'admin']),
});

type User = z.infer<typeof userSchema>;

export default function AddUser({ fetchUsers }: { fetchUsers: () => void }) {
  const [newUser, setNewUser] = useState<User>({
    id: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof User, string>>>({});

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewUser = async (e: FormEvent<HTMLFormElement>) => {
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

  return (
    <motion.div
      key='addUser'
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className='bg-white overflow-hidden shadow-xl rounded-lg'
    >
      <div className='px-4 py-5 sm:p-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>
          Yeni Kullanıcı Ekle
        </h2>
        <form onSubmit={handleAddNewUser} className='space-y-4'>
          {['username', 'email', 'password', 'role'].map((field, index) => (
            <motion.div
              key={field}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
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
          ))}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
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
  );
}
