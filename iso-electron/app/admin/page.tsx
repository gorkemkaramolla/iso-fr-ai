'use client';

import React, { useState, useEffect } from 'react';
import AddUser from './add-user';
import UserList from './list-user';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import createApi from '@/utils/axios_instance';
import { User } from '@/types';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers();

    // Set the active component after the component has mounted
    const storedComponent =
      localStorage.getItem('activeAdminComponent') || 'addUser';
    setActiveComponent(storedComponent);
  }, []);

  // Save the active component to localStorage when it changes
  useEffect(() => {
    if (activeComponent) {
      localStorage.setItem('activeAdminComponent', activeComponent);
    }
  }, [activeComponent]);

  const fetchUsers = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      const response = await api.get('/users');
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const openModal = (user: User) => {
    setCurrentUser(user); // Set the current user to be edited
    setIsModalOpen(true); // Open the modal
  };

  const closeModal = () => {
    setCurrentUser(null);
    setIsModalOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      const api = createApi(process.env.NEXT_PUBLIC_AUTH_URL);
      await api.put(`/users/${currentUser.id}`, currentUser, {});

      fetchUsers(); // Refresh the user list after update
      closeModal();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const menuItems = [
    { id: 'addUser', label: 'Kullanıcı Ekle', icon: UserPlus },
    { id: 'userList', label: 'Kullanıcı Listesi', icon: Users },
  ];

  const renderActiveComponent = () => {
    if (!activeComponent) {
      return null; // Return null or a loading indicator while the active component is being determined
    }
    switch (activeComponent) {
      case 'addUser':
        return (
          <AddUser setActiveView={setActiveComponent} fetchUsers={fetchUsers} />
        );
      case 'userList':
        return (
          <UserList
            users={users}
            fetchUsers={fetchUsers}
            openModal={openModal}
          />
        );
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
                    setCurrentUser({
                      ...currentUser,
                      username: e.target.value,
                    })
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
                    setCurrentUser({
                      ...currentUser,
                      password: e.target.value,
                    })
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
    </div>
  );
}
