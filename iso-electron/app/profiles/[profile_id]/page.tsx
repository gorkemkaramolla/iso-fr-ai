'use client';

import { useState, useEffect, useRef } from 'react';
import createApi from '@/utils/axios_instance';
import { Mail, Phone, MapPin, Briefcase, Calendar, Globe } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Toast } from 'primereact/toast';

interface Props {
  params: {
    profile_id: string;
  };
}

export default function Profile({ params: { profile_id } }: Props) {
  const [personel, setPersonel] = useState<Personel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPersonel, setEditedPersonel] = useState<Personel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    const fetchPersonel = async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
        const response = await api.get(`/personel/${profile_id}`, {
          withCredentials: true,
        });
        setPersonel(response.data);
        setEditedPersonel(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching personel:', error);
        setError(
          'Personel verileri yüklenemedi. Lütfen daha sonra tekrar deneyiniz.'
        );
      }
    };
    fetchPersonel();
  }, [profile_id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
      await api.put(`/personel/${profile_id}`, editedPersonel);
      setPersonel(editedPersonel);
      setIsEditing(false);
      setError(null);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Profil başarıyla güncellendi',
        life: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Profil güncellenemedi. Lütfen daha sonra tekrar deneyiniz.');
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Profil güncellenemedi',
        life: 3000,
      });
    }
  };

  const handleCancel = () => {
    setEditedPersonel(personel);
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedPersonel((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  if (error)
    return <div className='text-red-600 text-center py-8'>{error}</div>;
  if (!personel) return <div className='text-center py-8'>Yükleniyor...</div>;

  return (
    <div className='container mx-auto flex px-4 sm:px-6 lg:px-8'>
      <Toast ref={toast} />
      <div className='w-full max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden'>
        <div className='bg-gradient-to-r from-blue-600 to-indigo-700 h-24'></div>
        <div className='relative px-6 -mt-12 pb-8'>
          <div className='flex flex-col items-center'>
            <Image
              alt={`${personel.name} ${personel.lastname}`}
              src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${personel._id}`}
              width={120}
              height={120}
              className='rounded-full border-4 object-cover border-white shadow-lg w-48 h-48'
            />
            <motion.div
              className='mt-4 text-center'
              animate={
                isEditing ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : {}
              }
              transition={{ duration: 0.5 }}
            >
              {isEditing ? (
                <div className='space-y-2'>
                  <input
                    name='name'
                    value={editedPersonel?.name}
                    onChange={handleInputChange}
                    className='text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 px-2 py-1 w-full text-center focus:outline-none transition-colors duration-300'
                    placeholder='Ad'
                  />
                  <input
                    name='lastname'
                    value={editedPersonel?.lastname}
                    onChange={handleInputChange}
                    className='text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 px-2 py-1 w-full text-center focus:outline-none transition-colors duration-300'
                    placeholder='Soyad'
                  />
                  <input
                    name='title'
                    value={editedPersonel?.title}
                    onChange={handleInputChange}
                    className='text-lg text-gray-600 bg-transparent border-b border-gray-300 focus:border-blue-500 px-2 py-1 w-full text-center focus:outline-none transition-colors duration-300'
                    placeholder='Unvan'
                  />
                </div>
              ) : (
                <>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {personel.name} {personel.lastname}
                  </h1>
                  <p className='text-lg text-gray-600 mt-1'>{personel.title}</p>
                </>
              )}
            </motion.div>
          </div>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <InfoSection title='İletişim Bilgileri'>
              <InfoItem
                icon={<Mail />}
                label='Email'
                isEditing={isEditing}
                name='email'
                value={editedPersonel?.email}
                onChange={handleInputChange}
                href={`mailto:${editedPersonel?.email}`}
              />
              <InfoItem
                icon={<Phone />}
                label='Telefon'
                isEditing={isEditing}
                name='phone'
                value={editedPersonel?.phone}
                onChange={handleInputChange}
                href={`tel:${editedPersonel?.phone}`}
              />
              <InfoItem
                icon={<Phone />}
                label='GSM'
                isEditing={isEditing}
                name='gsm'
                value={editedPersonel?.gsm}
                onChange={handleInputChange}
                href={`tel:${editedPersonel?.gsm}`}
              />
              <InfoItem
                icon={<MapPin />}
                label='Adres'
                isEditing={isEditing}
                name='address'
                value={editedPersonel?.address}
                onChange={handleInputChange}
              />
            </InfoSection>

            <InfoSection title='Ek Bilgiler'>
              <InfoItem
                icon={<Calendar />}
                label='Doğum Tarihi'
                isEditing={isEditing}
                name='birth_date'
                value={editedPersonel?.birth_date}
                onChange={handleInputChange}
              />
              <InfoItem
                icon={<Globe />}
                label='ISO Telefon'
                isEditing={isEditing}
                name='iso_phone'
                value={editedPersonel?.iso_phone}
                onChange={handleInputChange}
              />
              <InfoItem
                icon={<Globe />}
                label='ISO Telefon 2'
                isEditing={isEditing}
                name='iso_phone2'
                value={editedPersonel?.iso_phone2}
                onChange={handleInputChange}
              />
            </InfoSection>
          </div>

          <InfoSection title='Özgeçmiş'>
            <div className='bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed'>
              <Briefcase className='inline-block w-5 h-5 mr-2 text-blue-600' />
              {isEditing ? (
                <textarea
                  name='resume'
                  value={editedPersonel?.resume}
                  onChange={handleInputChange}
                  className='w-full p-2 border rounded bg-white'
                  rows={4}
                />
              ) : (
                <p className='inline'>{personel.resume}</p>
              )}
            </div>
          </InfoSection>

          <div className='mt-6 flex justify-center space-x-3'>
            {isEditing ? (
              <>
                <motion.button
                  onClick={handleSave}
                  className='bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Değişiklikleri Kaydet
                </motion.button>
                <motion.button
                  onClick={handleCancel}
                  className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  İptal
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={handleEdit}
                className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Profili Düzenle
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className='text-lg font-semibold text-gray-800 mb-2'>{title}</h2>
      <div className='space-y-2'>{children}</div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  isEditing,
  name,
  value,
  onChange,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  isEditing: boolean;
  name: string;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  href?: string;
}) {
  return (
    <motion.div
      className='flex items-center text-gray-700'
      animate={
        isEditing
          ? {
              backgroundColor: ['#ffffff', '#f0f4ff', '#ffffff'],
              boxShadow: [
                '0 0 0 rgba(59, 130, 246, 0)',
                '0 0 6px rgba(59, 130, 246, 0.3)',
                '0 0 0 rgba(59, 130, 246, 0)',
              ],
            }
          : {}
      }
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      <div className='mr-2 text-blue-600'>{icon}</div>
      <div className='flex-grow'>
        <p className='font-medium'>{label}</p>
        {isEditing ? (
          <input
            name={name}
            value={value}
            onChange={onChange}
            className='text-gray-600 border-b border-gray-300 p-1 w-full bg-transparent focus:outline-none focus:border-blue-500 transition-colors duration-300'
          />
        ) : href ? (
          <a href={href} className='text-blue-500 hover:underline'>
            {value}
          </a>
        ) : (
          <p className='text-gray-600'>{value}</p>
        )}
      </div>
    </motion.div>
  );
}
