import React, { useState, ChangeEvent, FormEvent } from 'react';
import { z } from 'zod';
import { ZodError } from 'zod';
import { FaUser, FaEnvelope, FaLock, FaUserCog } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import createApi from '@/utils/axios_instance';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { capitalize } from 'lodash';

const userSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']),
});

type User = z.infer<typeof userSchema>;

type Props = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

export default function AddUserDialog({ isModalOpen, setIsModalOpen }: Props) {
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
      // Validate the user input
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
      await api.post('/add_user', newUser);

      // Display the success message
      setMessage('Kullanıcı başarıyla eklendi!');

      // Delay the view change to show the success message first
      setTimeout(() => {
        // Reset the form
        setNewUser({
          id: '',
          username: '',
          email: '',
          password: '',
          role: 'user',
        });

        // Close modal after showing the message
        setIsModalOpen(false);
      }, 1500);
    } catch (error) {
      setMessage('Error adding user: ' + (error as Error).message);
    }
  };

  const footerContent = (
    <div>
      <Button
        label='İptal'
        icon='pi pi-times'
        onClick={() => setIsModalOpen(false)}
        className='p-button-text'
      />
      {/* Ensure the button type is submit */}
      <Button
        type='submit'
        label='Add User'
        icon='pi pi-check'
        className='p-button p-button-primary'
        form='addUserForm' // Ensure the form is targeted
      />
    </div>
  );

  return (
    <Dialog
      header='Yeni Kullanıcı Ekle'
      visible={isModalOpen}
      style={{ width: '50vw' }}
      footer={footerContent}
      onHide={() => setIsModalOpen(false)}
    >
      {/* Ensure the form has an id matching the button's form attribute */}
      <form
        id='addUserForm'
        onSubmit={handleAddNewUser}
        className='p-fluid space-y-4'
      >
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
                  <InputText
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
                    placeholder={`${capitalize(field)} Giriniz`}
                  />
                </>
              ) : (
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <FaUserCog className='text-gray-400' />
                  </div>
                  <Dropdown
                    value={newUser.role}
                    options={[
                      { label: 'User', value: 'user' },
                      { label: 'Admin', value: 'admin' },
                    ]}
                    onChange={(e) => handleInputChange(e as any)}
                    placeholder='Select a Role'
                    name='role'
                    id='role'
                    className=''
                  />
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
      </form>
    </Dialog>
  );
}
