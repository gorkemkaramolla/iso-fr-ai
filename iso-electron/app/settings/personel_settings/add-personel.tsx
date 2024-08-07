'use client';

import React, { useState, ChangeEvent, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { z } from 'zod';
import FileUploader from '@/components/FileUploader';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Divider } from 'primereact/divider';

interface FormDataState {
  name: string;
  lastname: string;
  title: string;
  address: string;
  phone: string;
  email: string;
  gsm: string;
  resume: string;
  birth_date: string;
  iso_phone: string;
  iso_phone2: string;
  uploadedFile: File | null;
}

const formSchema = z.object({
  name: z.string().nonempty({ message: 'İsim boş bırakılmamalı' }),
  lastname: z.string().nonempty({ message: 'Soyisim boş bırakılmamalı' }),
  email: z.string().email({ message: 'Geçersiz email adresi' }),
  phone: z.string().optional(),
  gsm: z
    .string()
    .regex(/^\d+$/, { message: 'GSM sadece rakam içermelidir' })
    .optional(),
  address: z.string().optional(),
  title: z.string().optional(),
  resume: z.string().optional(),
  birth_date: z.string().optional(),
  iso_phone: z.string().optional(),
  iso_phone2: z.string().optional(),
  uploadedFile: z.any().optional(),
});

export default function AddPersonel() {
  const [formData, setFormData] = useState<FormDataState>({
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
    uploadedFile: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useRef<Toast>(null);
  const router = useRouter();

  const showError = (error: string) => {
    toast.current?.show({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 3000,
    });
  };

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleFileUpload = (file: File) => {
    setFormData((prevData) => ({ ...prevData, uploadedFile: file }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    let fieldErrors: Record<string, string> = {}; // Initialize fieldErrors with an empty object
    try {
      formSchema.parse(formData);
      setErrors({});

      const apiUrl = `${process.env.NEXT_PUBLIC_UTILS_URL}/personel`;

      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) fd.append(key, value as Blob);
      });

      const response = await fetch(apiUrl, { method: 'POST', body: fd });
      const data = await response.json();

      if (response.ok) {
        showSuccess(data.message || 'Personel başarıyla eklendi.');
        router.push(`/profiles/${data.data._id}`);
      } else {
        showError(data.message || 'Bir hata oluştu.');
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        fieldErrors = {}; // Assign an empty object to fieldErrors
        e.errors.forEach((err) => {
          if (err.path && err.path[0]) fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        showError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div className='w-full bg-white rounded-lg shadow-xl overflow-hidden'>
      <Toast ref={toast} />

      <div className='bg-indigo-600 text-white py-4 px-6'>
        <h1 className='text-2xl font-bold'>Personel Ayarları</h1>
        <p className='mt-1 text-indigo-200'>
          Yeni personel bilgilerini ekleyin
        </p>
      </div>

      <div className='p-6'>
        <FileUploader onFileUpload={handleFileUpload} />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              İsim
            </label>
            <InputText
              id='name'
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-500'>{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='lastname'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Soyisim
            </label>
            <InputText
              id='lastname'
              value={formData.lastname}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.lastname ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastname && (
              <p className='mt-1 text-sm text-red-500'>{errors.lastname}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Unvan
            </label>
            <InputText
              id='title'
              value={formData.title}
              onChange={handleChange}
              className='w-full p-2 border border-gray-300 rounded-md'
            />
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <InputText
              id='email'
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className='mt-1 text-sm text-red-500'>{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='phone'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Telefon
            </label>
            <InputText
              id='phone'
              value={formData.phone}
              onChange={handleChange}
              className='w-full p-2 border border-gray-300 rounded-md'
            />
          </div>

          <div>
            <label
              htmlFor='gsm'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              GSM
            </label>
            <InputText
              id='gsm'
              value={formData.gsm}
              onChange={handleChange}
              className={`w-full p-2 border rounded-md ${
                errors.gsm ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.gsm && (
              <p className='mt-1 text-sm text-red-500'>{errors.gsm}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='birth_date'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Doğum Tarihi
            </label>
            <InputText
              id='birth_date'
              value={formData.birth_date}
              onChange={handleChange}
              type='date'
              className='w-full p-2 border border-gray-300 rounded-md'
            />
          </div>

          <div>
            <label
              htmlFor='iso_phone'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              ISO Telefon 1
            </label>
            <InputText
              id='iso_phone'
              value={formData.iso_phone}
              onChange={handleChange}
              className='w-full p-2 border border-gray-300 rounded-md'
            />
          </div>

          <div>
            <label
              htmlFor='iso_phone2'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              ISO Telefon 2
            </label>
            <InputText
              id='iso_phone2'
              value={formData.iso_phone2}
              onChange={handleChange}
              className='w-full p-2 border border-gray-300 rounded-md'
            />
          </div>
        </div>

        <Divider />

        <div className='mt-4'>
          <label
            htmlFor='address'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Adres
          </label>
          <InputTextarea
            id='address'
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className='w-full p-2 border border-gray-300 rounded-md'
          />
        </div>

        <div className='mt-4'>
          <label
            htmlFor='resume'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Özgeçmiş
          </label>
          <InputTextarea
            id='resume'
            value={formData.resume}
            onChange={handleChange}
            rows={4}
            className='w-full p-2 border border-gray-300 rounded-md'
          />
        </div>

        <div className='mt-6 flex justify-end'>
          <Button
            onClick={handleSubmit}
            label='Yeni Personel Ekle'
            icon='pi pi-user-plus'
            className='p-button-md bg-indigo-600 border-indigo-600 hover:bg-indigo-700'
            disabled={isSubmitting}
          />
        </div>
      </div>

      <ConfirmDialog />
    </motion.div>
  );
}
