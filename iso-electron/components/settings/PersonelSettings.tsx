'use client';
import React, { useState } from 'react';

const PersonelSettings: React.FC = () => {
  const [personelData, setPersonelData] = useState({
    PERSONEL_ID: '',
    ADI: '',
    SOYADI: '',
    UNVANI: '',
    ADRES: '',
    TELEFON1: '',
    TELEFON2: '',
    EPOSTA: '',
    GSM: '',
    OZGECMIS: '',
    DOGUM_TARIHI: '',
    FOTO_DOSYA_ADI: '',
    ISO_TELEFON1: '',
    ISO_TELEFON2: '',
    FOTO_BINARY_DATA: '',
    FOTO_DOSYA_TIPI: 'image/jpeg',
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
          <label className='text-gray-700 mb-1'>PERSONEL_ID</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='PERSONEL_ID'
            value={personelData.PERSONEL_ID}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>ADI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='ADI'
            value={personelData.ADI}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>SOYADI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='SOYADI'
            value={personelData.SOYADI}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>UNVANI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='UNVANI'
            value={personelData.UNVANI}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>ADRES</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='ADRES'
            value={personelData.ADRES}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>TELEFON1</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='TELEFON1'
            value={personelData.TELEFON1}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>TELEFON2</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='TELEFON2'
            value={personelData.TELEFON2}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>EPOSTA</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='EPOSTA'
            value={personelData.EPOSTA}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>GSM</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='GSM'
            value={personelData.GSM}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>OZGECMIS</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='OZGECMIS'
            value={personelData.OZGECMIS}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>DOGUM_TARIHI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='DOGUM_TARIHI'
            value={personelData.DOGUM_TARIHI}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>FOTO_DOSYA_ADI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='FOTO_DOSYA_ADI'
            value={personelData.FOTO_DOSYA_ADI}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>ISO_TELEFON1</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='ISO_TELEFON1'
            value={personelData.ISO_TELEFON1}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>ISO_TELEFON2</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='ISO_TELEFON2'
            value={personelData.ISO_TELEFON2}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>FOTO_BINARY_DATA</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='FOTO_BINARY_DATA'
            value={personelData.FOTO_BINARY_DATA}
            onChange={handleChange}
          />
        </div>
        <div className='mb-2 flex flex-col'>
          <label className='text-gray-700 mb-1'>FOTO_DOSYA_TIPI</label>
          <input
            className='p-2 border-2 border-gray-300 rounded'
            type='text'
            name='FOTO_DOSYA_TIPI'
            value={personelData.FOTO_DOSYA_TIPI}
            onChange={handleChange}
          />
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
