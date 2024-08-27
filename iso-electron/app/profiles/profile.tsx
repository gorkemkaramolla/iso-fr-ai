'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import createApi, { getCsrfTokenFromCookies } from '@/utils/axios_instance';
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Globe,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import EnlargedImage from './enlarged-image';
import InfoSection from './info-section';
import InfoItem from './info-item';

interface Props {
  profileData: Personel;
}

interface Personel {
  _id: string;
  name: string;
  lastname: string;
  title: string;
  email: string;
  phone: string;
  gsm: string;
  address: string;
  birth_date: string;
  iso_phone: string;
  iso_phone2: string;
  resume: string;
}

export default function Profile({ profileData }: Props) {
  const [personel, setPersonel] = useState<Personel | null>(profileData);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPersonel, setEditedPersonel] = useState<Personel | null>(
    profileData
  );
  const [error, setError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const iso_fr_api = createApi(process.env.NEXT_PUBLIC_FLASK_URL);
  useEffect(() => {
    const fetchPersonel = async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_UTILS_URL);
        const response = await api.get(`/personel/${profileData._id}`);
        const data = await response.json();
        setPersonel(data);
        setEditedPersonel(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching personel:', error);
        setError(
          'Personel verileri yüklenemedi. Lütfen daha sonra tekrar deneyiniz.'
        );
      }
    };

    if (profileData._id) {
      fetchPersonel();
    }
  }, [profileData._id]);

  useEffect(() => {
    router.refresh();
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      if (editedPersonel) {
        formData.append('name', editedPersonel.name);
        formData.append('lastname', editedPersonel.lastname);
        formData.append('title', editedPersonel.title);
        formData.append('email', editedPersonel.email);
        formData.append('phone', editedPersonel.phone);
        formData.append('gsm', editedPersonel.gsm);
        formData.append('address', editedPersonel.address);
        formData.append('birth_date', editedPersonel.birth_date);
        formData.append('iso_phone', editedPersonel.iso_phone);
        formData.append('iso_phone2', editedPersonel.iso_phone2);
        formData.append('resume', editedPersonel.resume);
      }

      if (newImage) {
        formData.append('image', newImage);
      }

      let accessToken = '';
      if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('access_token') || '';
      }

      const defaultHeaders = {
        'X-CSRF-TOKEN': getCsrfTokenFromCookies(),
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/${profileData._id}`,
        {
          method: 'PUT',
          headers: defaultHeaders,
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      const fr_db_update = await iso_fr_api.post('update_database_with_id', {
        personnel_id: profileData._id,
      });
      console.log(fr_db_update.json());

      setPersonel(editedPersonel);
      setIsEditing(false);
      setNewImage(null);
      setPreviewImage(null);
      setError(null);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Profil başarıyla güncellendi',
        life: 3000,
      });

      // Re-fetch data after successful save
      const updatedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/${profileData._id}`
      );
      const updatedData = await updatedResponse.json();
      setPersonel(updatedData);
      setEditedPersonel(updatedData);
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
    setNewImage(null);
    setPreviewImage(null);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedPersonel((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  if (error)
    return <div className='text-red-600 text-center py-8'>{error}</div>;
  if (!personel) return <div className='text-center py-8'>Yükleniyor...</div>;

  return (
    <div className='container mx-auto px-4 py-6 max-w-5xl'>
      <div className='bg-white shadow-lg rounded-xl overflow-hidden'>
        <Toast ref={toast} />
        <div className='relative h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'>
          <div className='absolute inset-0 bg-black opacity-30'></div>
          <div className='absolute bottom-0 left-0 right-0 p-8 text-white'>
            <h1 className='text-4xl font-light tracking-wide'>
              Personel Profili
            </h1>
          </div>
        </div>

        <div className='relative px-8 py-10'>
          <div className='flex flex-col md:flex-row items-center md:items-start md:space-x-12'>
            <div className='relative mb-8 md:mb-0'>
              {isEditing ? (
                <div className='relative'>
                  <Image
                    alt={`${personel.name} ${personel.lastname}`}
                    src={
                      previewImage ||
                      `${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${personel._id}`
                    }
                    width={240}
                    height={240}
                    className='rounded-full object-cover md:w-64 md:h-64 w-32 h-32 shadow-lg ring-4 ring-white'
                  />
                  <label
                    htmlFor='imageUpload'
                    className='absolute bottom-3 right-3 bg-white text-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-100 transition duration-300'
                  >
                    <Upload size={24} />
                  </label>
                  <input
                    id='imageUpload'
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                </div>
              ) : (
                <Image
                  alt={`${personel.name} ${personel.lastname}`}
                  src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${personel._id}`}
                  width={240}
                  height={240}
                  className='rounded-full md:w-64 md:h-64 w-32 h-32 object-cover shadow-lg ring-4 ring-white cursor-pointer hover:opacity-90 transition duration-300'
                  onClick={() => setEnlargedImage(true)}
                />
              )}
            </div>

            <div className='flex-1'>
              <motion.div
                className='mb-8'
                animate={
                  isEditing ? { scale: [1, 1.02, 1], opacity: [1, 0.9, 1] } : {}
                }
                transition={{ duration: 0.5 }}
              >
                {isEditing ? (
                  <div className='space-y-4'>
                    <input
                      name='name'
                      value={editedPersonel?.name}
                      onChange={handleInputChange}
                      className='text-3xl font-light text-gray-800 bg-transparent border-b border-gray-300 focus:border-indigo-500 px-2 py-1 w-full focus:outline-none transition-colors duration-300'
                      placeholder='Ad'
                    />
                    <input
                      name='lastname'
                      value={editedPersonel?.lastname}
                      onChange={handleInputChange}
                      className='text-3xl font-light text-gray-800 bg-transparent border-b border-gray-300 focus:border-indigo-500 px-2 py-1 w-full focus:outline-none transition-colors duration-300'
                      placeholder='Soyad'
                    />
                    <input
                      name='title'
                      value={editedPersonel?.title}
                      onChange={handleInputChange}
                      className='text-xl font-light text-gray-600 bg-transparent border-b border-gray-300 focus:border-indigo-500 px-2 py-1 w-full focus:outline-none transition-colors duration-300'
                      placeholder='Unvan'
                    />
                  </div>
                ) : (
                  <>
                    <h2 className='text-3xl font-light text-gray-800 mb-2'>
                      {personel.name} {personel.lastname}
                    </h2>
                    <p className='text-xl font-extrabold text-gray-600'>
                      {personel.title}
                    </p>
                  </>
                )}
              </motion.div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                <InfoSection title='İletişim Bilgileri'>
                  <InfoItem
                    icon={<Mail className='text-indigo-500' />}
                    label='Email'
                    isEditing={isEditing}
                    name='email'
                    value={editedPersonel?.email}
                    onChange={handleInputChange}
                    href={`mailto:${editedPersonel?.email}`}
                  />
                  <InfoItem
                    icon={<Phone className='text-indigo-500' />}
                    label='Telefon'
                    isEditing={isEditing}
                    name='phone'
                    value={editedPersonel?.phone}
                    onChange={handleInputChange}
                    href={`tel:${editedPersonel?.phone}`}
                  />
                  <InfoItem
                    icon={<Phone className='text-indigo-500' />}
                    label='GSM'
                    isEditing={isEditing}
                    name='gsm'
                    value={editedPersonel?.gsm}
                    onChange={handleInputChange}
                    href={`tel:${editedPersonel?.gsm}`}
                  />
                  <InfoItem
                    icon={<MapPin className='text-indigo-500' />}
                    label='Adres'
                    isEditing={isEditing}
                    name='address'
                    value={editedPersonel?.address}
                    onChange={handleInputChange}
                  />
                </InfoSection>

                <InfoSection title='Ek Bilgiler'>
                  <span className='flex justify-between w-full gap-2'>
                    <InfoItem
                      icon={<Calendar className='text-indigo-500' />}
                      label='İş başlangıç tarihi'
                      isEditing={isEditing}
                      name='Başlangıç Tarihi'
                      value={editedPersonel?.birth_date}
                      onChange={handleInputChange}
                    />
                    <InfoItem
                      icon={<Calendar className='text-indigo-500' />}
                      label='İş ayrılma tarihi'
                      isEditing={isEditing}
                      name='Başlangıç Tarihi'
                      value={editedPersonel?.birth_date}
                      onChange={handleInputChange}
                    />
                  </span>

                  <span className='flex justify-between w-full gap-2'>
                    <InfoItem
                      icon={<Globe className='text-indigo-500' />}
                      label='ISO Telefon'
                      isEditing={isEditing}
                      name='iso_phone'
                      value={editedPersonel?.iso_phone}
                      onChange={handleInputChange}
                    />
                    <InfoItem
                      icon={<Globe className='text-indigo-500' />}
                      label='ISO Telefon 2'
                      isEditing={isEditing}
                      name='iso_phone2'
                      value={editedPersonel?.iso_phone2}
                      onChange={handleInputChange}
                    />
                  </span>
                  <InfoItem
                    icon={<Calendar className='text-indigo-500' />}
                    label='Doğum Tarihi'
                    isEditing={isEditing}
                    name='birth_date'
                    value={editedPersonel?.birth_date}
                    onChange={handleInputChange}
                  />
                </InfoSection>
              </div>
            </div>
          </div>
          <span className='flex w-full gap-2 my-5 justify-center'>
            <span className='w-1/2 h-full bg-gray-50  flex flex-col'>
              <span className='text-sm font-bold px-4'>Özgeçmiş</span>
              <div className='px-4 py-1 rounded-lg w-full text-gray-700 leading-relaxed'>
                {isEditing ? (
                  <textarea
                    name='resume'
                    value={editedPersonel?.resume}
                    onChange={handleInputChange}
                    className='  border  rounded w-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-light'
                    rows={3}
                  />
                ) : (
                  <p className='inline font-light'>{personel.resume}</p>
                )}
              </div>
            </span>
            <span className='w-1/2 h-full bg-gray-50  rounded-lg  flex flex-col'>
              <span className='text-sm font-bold px-4'>Detay</span>
              <div className='px-4 py-1 w-full rounded-lg text-gray-700 leading-relaxed'>
                {isEditing ? (
                  <textarea
                    name='resume'
                    value={editedPersonel?.resume}
                    onChange={handleInputChange}
                    className=' border rounded  bg-white w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 font-light'
                    rows={3}
                  />
                ) : (
                  <p className='inline font-light'>{personel.resume}</p>
                )}
              </div>
            </span>
          </span>

          <div className='mt-12 flex justify-center space-x-4'>
            {isEditing ? (
              <>
                <motion.button
                  onClick={handleSave}
                  className='bg-indigo-600 hover:bg-indigo-700 text-white font-light py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Değişiklikleri Kaydet
                </motion.button>
                <motion.button
                  onClick={handleCancel}
                  className='bg-gray-200 hover:bg-gray-300 text-gray-800 font-light py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  İptal
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={handleEdit}
                className='bg-indigo-600 hover:bg-indigo-700 text-white font-light py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Profili Düzenle
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {enlargedImage && (
          <EnlargedImage
            src={`${process.env.NEXT_PUBLIC_UTILS_URL}/personel/image/?id=${personel._id}`}
            alt={`${personel.name} ${personel.lastname}`}
            onClose={() => setEnlargedImage(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
