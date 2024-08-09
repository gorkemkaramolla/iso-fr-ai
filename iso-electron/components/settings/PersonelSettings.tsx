'use client';
import { Personel } from '@/types';
import React, { useState } from 'react';

const PersonelSettings: React.FC = () => {
  const [personelData, setPersonelData] = useState<Personel>({
    _id: '',
    name: '',
    lastname: '',
    title: '',
    address: '',
    phone: '',
    email: '',
    gsm: '',
    resume: '',
    birth_date: '',
    iso_phone: '',
    iso_phone2: '',
    file_path: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonelData({ ...personelData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Submit form logic
    console.log(personelData);
  };

  return (
    <div className=' p-4  rounded shadow-md overflow-auto'>
      <h2 className='text-lg font-bold mb-4'>Yeni Personel Ekle</h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-2 flex flex-col'>
          <div className='flex w-full gap-2'>
            <div className='flex-col w-full flex'>
              <label className='text-gray-700 mb-1'>İsim</label>
              <input
                className='p-2 border-2 border-gray-300 rounded'
                type='text'
                name='FOTO_DOSYA_TIPI'
                value={personelData.name}
                onChange={handleChange}
              />
            </div>
            <div className='w-full'>
              <div className='flex-col w-full flex'>
                <label className='text-gray-700 mb-1'>Soy İsim</label>
                <input
                  className='p-2 border-2 border-gray-300 rounded'
                  type='text'
                  name='FOTO_DOSYA_TIPI'
                  value={personelData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type='submit'
          className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Ekle
        </button>
      </form>
    </div>
  );
};

export default PersonelSettings;
